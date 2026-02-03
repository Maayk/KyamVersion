const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');

const { checkForUpdates } = require('./services/updater');
const { launchGame } = require('./services/game');
const { loadSettings, saveSettings, getSettings } = require('./services/config');
const { registerModHandlers } = require('./services/mods');
const { fetchHytaleNews } = require('./services/news');

let cachedGpuInfo = null;
let gpuInfoPromise = null;
let mainWindow = null;
let splashWindow = null;

const GAME_CONFIG = {
    defaultChannel: 'latest',
    channels: ['latest', 'beta'],
    gamePathParts: ['install', 'release', 'package', 'game']
};

const VERSION_CONFIG = {
    fileCandidates: [
        'version.txt',
        'Version.txt',
        'build.txt',
        'build.version',
        'version.json',
        path.join('Client', 'version.txt'),
        path.join('Client', 'Version.txt'),
        path.join('Client', 'build.txt'),
        path.join('Client', 'build.version'),
        path.join('Client', 'version.json'),
        path.join('Client', 'resources', 'version.txt'),
        path.join('Client', 'resources', 'version.json')
    ],
    patterns: [
        /(\d{4}\.\d{2}\.\d{2}(?:-[A-Za-z0-9]+)?)/,
        /(\d{2}\.\d{2}\.\d{4}(?:-[A-Za-z0-9]+)?)/
    ]
};

const REPAIR_CONFIG = {
    maxRetries: 3,
    retryDelayMs: 1000,
    retryCodes: ['EBUSY', 'EPERM', 'ENOTEMPTY', 'EACCES'],
    processNames: ['HytaleClient.exe'],
    pendingDeleteDir: 'pending_delete'
};

function normalizeGameChannel(value) {
    return GAME_CONFIG.channels.includes(value) ? value : GAME_CONFIG.defaultChannel;
}

function buildGameDir(rootPath, channel) {
    return path.join(rootPath, ...GAME_CONFIG.gamePathParts, channel);
}

async function resolveRepairTarget(hytaleRoot, preferredChannel) {
    const primaryDir = buildGameDir(hytaleRoot, preferredChannel);
    if (await fs.pathExists(primaryDir)) {
        return { channel: preferredChannel, dir: primaryDir };
    }

    const fallbackChannel = preferredChannel === 'beta' ? 'latest' : 'beta';
    const fallbackDir = buildGameDir(hytaleRoot, fallbackChannel);
    if (await fs.pathExists(fallbackDir)) {
        return { channel: fallbackChannel, dir: fallbackDir };
    }

    return { channel: preferredChannel, dir: primaryDir };
}

function extractVersionFromText(content) {
    if (!content) return null;
    for (const pattern of VERSION_CONFIG.patterns) {
        const match = content.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function removeDirWithRetry(targetPath) {
    let lastError = null;
    for (let attempt = 0; attempt <= REPAIR_CONFIG.maxRetries; attempt += 1) {
        try {
            await fs.remove(targetPath);
            return { success: true, attempts: attempt + 1 };
        } catch (error) {
            lastError = error;
            const shouldRetry = REPAIR_CONFIG.retryCodes.includes(error.code);
            if (!shouldRetry || attempt >= REPAIR_CONFIG.maxRetries) {
                break;
            }
            await wait(REPAIR_CONFIG.retryDelayMs);
        }
    }
    const finalError = lastError || new Error('Failed to remove directory');
    throw finalError;
}

async function stopGameProcesses() {
    if (process.platform !== 'win32') return;
    const tasks = REPAIR_CONFIG.processNames.map((name) => new Promise((resolve) => {
        exec(`taskkill /F /IM "${name}" /T`, () => resolve());
    }));
    await Promise.all(tasks);
}

async function moveToPendingDelete(hytaleRoot, gameDir, channel) {
    const pendingBase = path.join(hytaleRoot, 'cache', REPAIR_CONFIG.pendingDeleteDir);
    await fs.ensureDir(pendingBase);
    const pendingTarget = path.join(pendingBase, `${channel}_${Date.now()}`);
    await fs.move(gameDir, pendingTarget, { overwrite: true });
    removeDirWithRetry(pendingTarget).catch((error) => {
        console.error('Pending delete failed:', error.message || error);
    });
}

async function readVersionFromGameDir(gameDir) {
    for (const relativePath of VERSION_CONFIG.fileCandidates) {
        const fullPath = path.join(gameDir, relativePath);
        try {
            if (await fs.pathExists(fullPath)) {
                const content = await fs.readFile(fullPath, 'utf8');
                const version = extractVersionFromText(content);
                if (version) return version;
            }
        } catch (e) {
        }
    }
    return null;
}

async function readVersionFromLocalConfig(channel) {
    const normalized = channel === 'beta' ? 'beta' : 'latest';
    const candidatePaths = [
        path.join(app.getAppPath(), 'config.json'),
        path.join(process.resourcesPath, 'config.json')
    ];
    for (const localConfigPath of candidatePaths) {
        try {
            if (await fs.pathExists(localConfigPath)) {
                const cfg = await fs.readJson(localConfigPath);
                let version = null;
                if (cfg && cfg.hytale) {
                    if (cfg.hytale[normalized] && typeof cfg.hytale[normalized].version === 'string') {
                        version = cfg.hytale[normalized].version;
                    } else if (cfg.hytale.latest && typeof cfg.hytale.latest.version === 'string') {
                        version = cfg.hytale.latest.version;
                    } else if (typeof cfg.hytale.version === 'string') {
                        version = cfg.hytale.version;
                    }
                }
                return version || null;
            }
        } catch (e) {
            console.error('Failed to read config.json:', e.message);
        }
    }
    return null;
}

async function loadGpuInfo() {
    if (cachedGpuInfo) return cachedGpuInfo;
    if (gpuInfoPromise) return gpuInfoPromise;

    gpuInfoPromise = new Promise((resolve) => {
        if (process.platform === 'win32') {
            exec('wmic path win32_VideoController get name', (error, stdout, stderr) => {
                if (error) {
                    console.error('WMIC Error:', error);
                    resolve('GPU Detection Failed');
                    return;
                }
                const lines = stdout.split('\n').map(l => l.trim()).filter(l => l && l !== 'Name');

                const gpus = {
                    all: lines,
                    integrated: lines.find(l => l.match(/Intel|Display/i)) || null,
                    dedicated: lines.find(l => l.match(/NVIDIA|AMD|Radeon RX/i)) || null
                };

                if (!gpus.integrated && lines.length > 0) gpus.integrated = lines[0];
                if (!gpus.dedicated && lines.length > 1) gpus.dedicated = lines[lines.length - 1];

                cachedGpuInfo = gpus;
                console.log('GPU Info Cached (Fast):', JSON.stringify(cachedGpuInfo));
                resolve(cachedGpuInfo);
            });
        } else {
            resolve('Unsupported Platform');
        }
    });
    return gpuInfoPromise;
}

// ipcMain.handle('perform-update', async (event, downloadUrl) => {
//     require('electron').shell.openExternal(downloadUrl);
//     app.quit();
// }); // Desativado: launcher modificado não deve auto-atualizar


ipcMain.handle('get-settings', async () => {
    return getSettings();
});

ipcMain.handle('get-hytale-version', async (event, channel) => {
    const hytaleRoot = path.join(app.getPath('appData'), 'Kyamtale');
    const settings = getSettings();
    const selectedChannel = normalizeGameChannel(channel || settings.gameChannel);
    const gameDir = buildGameDir(hytaleRoot, selectedChannel);

    const gameVersion = await readVersionFromGameDir(gameDir);
    if (gameVersion) return gameVersion;

    return await readVersionFromLocalConfig(selectedChannel);
});

ipcMain.handle('save-settings', async (event, settings) => {
    await saveSettings(settings);
    return true;
});

ipcMain.handle('get-news', async () => {
    return await fetchHytaleNews();
});

ipcMain.handle('get-gpu-info', async () => {
    return await loadGpuInfo();
});

ipcMain.handle('load-locale', async (event, lang) => {
    const localePath = path.join(__dirname, 'locales', `${lang}.json`);
    try {
        if (await fs.pathExists(localePath)) {
            return await fs.readJson(localePath);
        }
    } catch (e) {
        console.error("Failed to load locale:", e);
    }
    return null;
});

ipcMain.handle('select-java-path', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Java Executable', extensions: ['exe', 'bin'] }]
    });
    return result.filePaths[0];
});

ipcMain.on('open-game-location', () => {
    const hytaleRoot = path.join(app.getPath('appData'), 'Kyamtale');
    require('electron').shell.openPath(hytaleRoot);
});

ipcMain.on('repair-game', async (event, channel) => {
    const hytaleRoot = path.join(app.getPath('appData'), 'Kyamtale');
    const settings = getSettings();
    const selectedChannel = normalizeGameChannel(channel || settings.gameChannel);
    const target = await resolveRepairTarget(hytaleRoot, selectedChannel);
    const gameDir = target.dir;

    try {
        console.log("Repairing game: Deleting game directory...");
        if (await fs.pathExists(gameDir)) {
            await stopGameProcesses();
            await wait(500);
            try {
                await removeDirWithRetry(gameDir);
            } catch (error) {
                if (REPAIR_CONFIG.retryCodes.includes(error.code)) {
                    await moveToPendingDelete(hytaleRoot, gameDir, selectedChannel);
                } else {
                    throw error;
                }
            }
        }
        event.sender.send('repair-complete', { success: true });
    } catch (error) {
        console.error("Repair failed:", error);
        event.sender.send('repair-complete', { success: false, error: error.message });
    }
});

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 340,
        height: 380,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        center: true,
        icon: path.join(__dirname, 'assets/images/logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function createMainWindow() {

    loadSettings();

    mainWindow = new BrowserWindow({
        width: 1152,
        height: 648,
        minWidth: 960,
        minHeight: 540,
        icon: path.join(__dirname, 'assets/images/logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true, // Habilitado para segurança
            preload: path.join(__dirname, 'preload.js')
        },
        resizable: true,
        title: "Battly Launcher 4 Hytale",
        frame: false,
        autoHideMenuBar: true,
        backgroundColor: '#1e1e2f',
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.webContents.once('did-finish-load', () => {
        if (splashWindow) {
            splashWindow.close();
            splashWindow = null;
        }
        mainWindow.show();

        // checkForUpdates(mainWindow); // Desativado: launcher modificado não deve auto-atualizar
    });

    ipcMain.on('minimize-window', () => {
        if (mainWindow) mainWindow.minimize();
    });

    ipcMain.on('close-window', () => {
        app.quit();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
}

app.whenReady().then(async () => {
    createSplashWindow();

    loadGpuInfo();

    setTimeout(() => {
        createMainWindow();
    }, 1500);

    registerModHandlers(ipcMain);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('launch-game', (event, username) => {
    // Sanitização básica do servidor para evitar injeção de comandos
    if (typeof username !== 'string' || !username.match(/^[a-zA-Z0-9_]{1,16}$/)) {
        console.error("Tentativa de lançamento com username inválido:", username);
        event.reply('launch-error', 'Username inválido (apenas letras, números e underline, max 16 chars).');
        return;
    }
    launchGame(event, username);
});
