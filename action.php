<?php

class action_plugin_pwaoffline extends DokuWiki_Action_Plugin
{

    /**
     * Registers a callback function for a given event
     *
     * @param Doku_Event_Handler $controller DokuWiki's event controller object
     *
     * @return void
     */
    public function register(Doku_Event_Handler $controller)
    {
        $controller->register_hook('MANIFEST_SEND', 'BEFORE', $this, 'add144pxImageToManifest');
        $controller->register_hook('AJAX_CALL_UNKNOWN', 'BEFORE', $this, 'collectPagesToCache');
        $controller->register_hook('DOKUWIKI_STARTED', 'BEFORE', $this, 'writeConfigToJSINFO');

    }

    /**
     * [Custom event handler which performs action]
     *
     * Event: MANIFEST_SEND
     *
     * @param Doku_Event $event  event object by reference
     * @param mixed      $param  [the parameters passed as fifth argument to register_hook() when this
     *                           handler was registered]
     *
     * @return void
     */
    public function add144pxImageToManifest(Doku_Event $event, $param)
    {
        $event->data['icons'][] = [
            'src' => DOKU_BASE . 'lib/plugins/pwaoffline/144.png',
            'sizes' => '144x144',
        ];
    }

    /**
     * Event: AJAX_CALL_UNKNOWN
     *
     * @param Doku_Event $event
     * @param            $param
     */
    public function collectPagesToCache(Doku_Event $event, $param)
    {
        if ($event->data !== 'plugin_pwaoffline') {
            return;
        }

        // todo: collect some page that should be updated

        // maybe this contains a time timestamp when cache was last updated?

    }

    /**
     * Event: DOKUWIKI_STARTED
     *
     * @param Doku_Event $event
     * @param            $param
     */
    public function writeConfigToJSINFO(Doku_Event $event, $param)
    {
        global $JSINFO, $ACT;
        header('X-DWPLUGIN-PWAOFFLINE-ACT:' . act_clean($ACT));
        if (empty($JSINFO['plugins'])) {
            $JSINFO['plugins'] = [];
        }

        $JSINFO['plugins']['pwaoffline'] = [
            'ts' => time(),
        ];
    }

}
