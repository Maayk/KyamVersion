const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => {
        // Allowlist channels
        const validChannels = ['launch-game', 'minimize-window', 'close-window', 'open-game-location', 'repair-game'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    invoke: (channel, data) => {
        const validChannels = [
            'get-settings',
            'save-settings',
            'get-hytale-version',
            'get-news',
            'get-gpu-info',
            'search-mods',
            'get-mod-description',
            'list-installed-mods',
            'install-mod',
            'delete-mod',
            'toggle-mod',
            'select-java-path',
            'load-locale' // New channel for i18n
        ];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, data);
        }
    },
    on: (channel, func) => {
        const validChannels = [
            'launch-status',
            'launch-error',
            'launch-success',
            'repair-complete',
            'download-progress'
        ];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`, but pass dummy {} to match renderer signature (event, arg)
            ipcRenderer.on(channel, (event, ...args) => func({}, ...args));
        }
    },
    openExternal: (url) => shell.openExternal(url)
});
