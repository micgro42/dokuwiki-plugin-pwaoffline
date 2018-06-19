if ('serviceWorker' in navigator) {
    console.log('Registering service worker...');
    const serviceWorkerScript = DOKU_BASE + 'sw.js';
    navigator.serviceWorker
        .register(serviceWorkerScript, {
                scope: '.'
            }
        )
        .then(function (registration) {
            const filesToCache = [
                DOKU_BASE + 'lib/exe/js.php',
                DOKU_BASE + 'lib/exe/css.php',
                DOKU_BASE + 'doku.php?id=sidebar',
                DOKU_BASE + 'doku.php?id=start',
            ];
            const data = {'DOKU_BASE': window.DOKU_BASE};
            data.filesToCache = filesToCache;
            console.log("Service Worker Registered");
            if (registration.active) {
                console.log('posting message');
                registration.active.postMessage(JSON.stringify(data));
                console.log('message send.');
            }
        });
}

function reportStorageUsage($msgArea) {
    navigator.storage.estimate().then(estimate => {
        const perc = Math.round((estimate.usage / estimate.quota) * 100 * 100)/100;
        const severity = perc > 80 ? 'error' : perc > 20 ? 'notify' : 'info';
        const msg = 'Current storage usage on this device for this origin: ' + estimate.usage + '/' + estimate.quota;
        $msgArea.append(jQuery('<div>').addClass(severity).text(msg + ' ( ' + perc + ' % )'));
    });
}

jQuery(function () {

    const LIVE_DELAY = 10;
    const now = Math.floor(Date.now() / 1000);

    const lag = now - JSINFO.plugins.pwaoffline.ts;

    console.log(JSINFO.plugins.pwaoffline.ts);
    console.log(lag);

    const $msgArea = jQuery('<div>');
    jQuery('#dokuwiki__header').after($msgArea);

    if (lag > LIVE_DELAY) {
        console.log('serving from cache?');
        $msgArea.append(jQuery('<div>')
            .text('This page may have been loaded from cache. Age in seconds: ' + lag)
            .addClass('notify')
        );
        jQuery('.dokuwiki').addClass('pwa--is-offline');
    }

    reportStorageUsage($msgArea);

// if (!navigator.onLine) {
//     jQuery('<div></div>').text('You appear to be offline')
// }

});