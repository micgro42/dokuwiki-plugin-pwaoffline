console.log('service worker script');


const cacheName = 'dokuwiki PWA cache';

self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Install');
});

self.addEventListener('message', function (e) {
    const data = JSON.parse(e.data);

    console.log("[ServiceWorker] Received Message:");
    console.log(data);

    self.DOKU_BASE = data.DOKU_BASE;

    e.waitUntil(
        caches.open(cacheName).then(function (cache) {

            // if (r) {
            //     const lmTimeString = r.headers.get('Last-Modified');
            //     const ts = (new Date( lmTimeString )).getTime();
            //     console.log('we have a cache for ' + e.request.url + ' from ', lmTimeString, ts);
            // }

            console.log('[ServiceWorker] Caching app shell');
            // ToDo vergleichen von timestamps und nur fehlendes / altes aktualisieren
            return cache.addAll(data.filesToCache);
        })
    );
});

self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activate');
});

self.addEventListener('fetch', function (e) {
    if (e.request.method !== 'GET') {
        return;
    }
    console.log('[ServiceWorker] Fetch: ' + e.request.url);
    // todo: somehow check for edit pages, admin pages, -> only catch show

    e.respondWith(fromNetwork(e.request, 400).then(function (response) {
        if (response.headers.has('X-DWPLUGIN-PWAOFFLINE-ACT') &&
            response.headers.get('X-DWPLUGIN-PWAOFFLINE-ACT') !== 'show') {
            // don't cache modes other than show
            return response;
        }
        return caches.open(cacheName).then(function (cache) {
            cache.put(e.request, response.clone());
            return response;
        });
    }).catch(function () {
        return fromCache(e.request);
    }));
});

function fromNetwork(request, timeout) {
    return new Promise(function (fulfill, reject) {
        const timeoutId = setTimeout(reject, timeout);
        fetch(request).then(function (response) {

            if (response.status >= 500) {
                console.log('[ServiceWorker] Response: ' + response.status + ' -> rejecting.');
                reject();
            }
            clearTimeout(timeoutId);
            fulfill(response);
        }, reject);
    });
}

function fromCache(request) {
    console.log('[ServiceWorker] trying to serve from cache...');
    return caches.open(cacheName).then(function (cache) {
        return cache.match(request).then(function (matching) {
            if (matching) {
                return matching;
            }
            if (request.destination === 'document') {
                return new Response('Page not available. Please go back.', { headers: {
                    'Content-Type': 'text/plain'
                }});
            }
            return Promise.reject('no-match');
        });
    });
}