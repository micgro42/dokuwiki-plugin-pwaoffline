const cacheName = 'dokuwiki PWA cache';

self.addEventListener('install', function (e) {
    idbKeyval.del('lastSync');
});

self.addEventListener('message', function (e) {

    // console.log("[ServiceWorker] Received Message:");
    // console.log(e.data.type);

    switch (e.data.type) {
        case 'updatePages':
            cachePages(e, e.data.pages);
            break;
        case 'getLastUpdate':
            idbKeyval.get('lastSync').then((value) => e.source.postMessage(
                {
                    type: 'lastUpdate',
                    ts: value,
                }
            ));
            break;
        case 'getHashVersion':
            e.source.postMessage(
                {
                    type: 'swHashVersion',
                    hash: swHashVersion, // injected when serviceworker is constructed in PHP
                }
            )
    }

});

/**
 * The normal cache.add doesn't send credentials with its request, this function does.
 *
 * @param cache
 * @param url
 */
function cacheAddWithCredentials(cache, url) {
    fetch(url, {
        credentials: 'include',
    }).then(function(response) {
        if (!response.ok) {
            throw new TypeError('bad response status');
        }
        return cache.put(url, response);
    })
}

function cachePages(e, data) {
    idbKeyval.set('lastSync', Math.floor(Date.now()/1000));
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {

            // if (r) {
            //     const lmTimeString = r.headers.get('Last-Modified');
            //     const ts = (new Date( lmTimeString )).getTime();
            //     console.log('we have a cache for ' + e.request.url + ' from ', lmTimeString, ts);
            // }
            return Promise.all(data.map(function (pageData) {
                return cacheAddWithCredentials(cache, pageData.link)
            }));
        })
    );
}

self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activate');
});

const CACHED_DESTINATIONS = [
    'document',
    'style',
    'script',
    'image',
    'font',
];

const OFFLINE_FIRST_DESTINATIONS = [
    'script',
    'style',
    'font',
];

self.addEventListener('fetch', function (e) {
    if (e.request.method !== 'GET') {
        return;
    }

    if (!CACHED_DESTINATIONS.includes(e.request.destination)) {
        // only cache important modes
        return;
    }

    if (OFFLINE_FIRST_DESTINATIONS.includes(e.request.destination)) {
        e.respondWith(cacheFirst(e.request));
        return;
    }

    e.respondWith(networkFirst(e.request));
});

function networkFirst(request) {
    return fromNetwork(request, 400).then(function (response) {
        if (response.headers.has('X-DWPLUGIN-PWAOFFLINE-ACT') &&
            response.headers.get('X-DWPLUGIN-PWAOFFLINE-ACT') !== 'show') {
            // don't cache modes other than show
            return response;
        }
        return caches.open(cacheName).then(function (cache) {
            cache.put(request, response.clone());
            return response;
        });
    }).catch(function () {
        return fromCache(request);
    })
}

function cacheFirst(request) {
    return caches.match(request).then(function (cacheResponse) {
        return cacheResponse || fetch(request).then(function (response) {
                return caches.open(cacheName).then(function (cache) {
                    cache.put(request, response.clone());
                    return response;
                });
            });
    })
}

function fromNetwork(request, timeout) {
    return new Promise(function (fulfill, reject) {
        const timeoutId = setTimeout(() => {
            // check if response is in cache, if so then reject and fetch from there
            caches.open(cacheName).then(function (cache) {
                cache.match(request).then(function (matching) {
                    if (matching) {
                        reject();
                    }
                });
            };
        }, timeout);
        fetch(request).then(function (response) {

            if (response.status >= 500) {
                reject();
            }
            clearTimeout(timeoutId);
            fulfill(response);
        }, reject);
    });
}

function fromCache(request) {
    if (!CACHED_DESTINATIONS.includes(request.destination)) {
        return Promise.reject('no-match');
    }

    return caches.open(cacheName).then(function (cache) {
        return cache.match(request).then(function (matching) {
            if (matching) {
                return matching;
            }
            if (request.destination === 'document') {
                return new Response('Page not available. Please go back.', {
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                });
            }
            return Promise.reject('no-match');
        });
    });
}
