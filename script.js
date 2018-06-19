if ('serviceWorker' in navigator) {
    const serviceWorkerScript = DOKU_BASE + 'doku.php?do=pwaoffline_serviceworker';
    navigator.serviceWorker
        .register(serviceWorkerScript, {
                scope: '.'
            }
        )
        .then(function (registration) {
            const filesToCache = [
                DOKU_BASE + 'doku.php?id=sidebar',
                DOKU_BASE + 'doku.php?id=start',
                DOKU_BASE + 'doku.php',
                DOKU_BASE,
            ];
            const data = {'DOKU_BASE': window.DOKU_BASE};
            data.filesToCache = filesToCache;
            if (registration.active) {
                registration.active.postMessage(JSON.stringify(data));
            }
        });
}

function reportStorageUsage() {
    navigator.storage.estimate().then(estimate => {
        const perc = Math.round((estimate.usage / estimate.quota) * 100 * 100)/100;
        const severity = perc > 80 ? 'error' : perc > 20 ? 'notify' : 'info';
        const msg = 'Current storage usage on this device for this origin: ' + estimate.usage + '/' + estimate.quota;
        showMessage(msg + ' ( ' + perc + ' % )', severity);
    });
}

function showMessage(message, severity) {
    let $msgArea = jQuery('div.pwaOfflineMSGArea');
    if (!$msgArea.length) {
        $msgArea = jQuery('<div>').addClass('pwaOfflineMSGArea');
        jQuery('#dokuwiki__header').after($msgArea);
    }
    $msgArea.append(jQuery('<div>')
        .text(message)
        .addClass(severity)
    );
}

jQuery(function () {

    const LIVE_DELAY = 10;
    const now = Math.floor(Date.now() / 1000);

    const lag = now - JSINFO.plugins.pwaoffline.ts;

    if (lag > LIVE_DELAY) {
        showMessage('This page may have been loaded from cache. Age in seconds: ' + lag, 'notify');
        jQuery('.dokuwiki').addClass('pwa--is-offline');
    }

    reportStorageUsage();

// if (!navigator.onLine) {
//     jQuery('<div></div>').text('You appear to be offline')
// }

});