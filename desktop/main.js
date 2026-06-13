
const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage, shell } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const fs = require('fs');
const { exec } = require('child_process');

// ─── CONFIG ────────────────────────────────────────────
// ─── CONFIG ────────────────────────────────────────────
const ZYLRON_BACKEND = 'https://zylron-agent-ai.onrender.com';
const ZYLRON_FRONTEND_PORTS = [
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://zylron-agent-ai.vercel.app' // 🚀 Live Production 
];
const SCREENSHOT_INTERVAL_MS = 5000; // Omni-Vision: every 5s
const SCREENSHOT_PATH = path.join(__dirname, 'omni_snapshot.jpg');

// ─── STATE ─────────────────────────────────────────────
let tray = null;
let jarvisWindow = null;
let wakeWordWindow = null;      // 🎙️ Hidden wake word listener
let omniVisionActive = true;
let screenInterval = null;
let latestScreenshotBase64 = null;

// ─── GRANT MIC PERMISSION (required for wake word & voice input) ────
const { session } = require('electron');

// Enable speech recognition flags before app is ready
app.commandLine.appendSwitch('enable-speech-input');
app.commandLine.appendSwitch('enable-experimental-web-platform-features');
app.commandLine.appendSwitch('disable-features', 'SpeechSynthesis');

// ─── SINGLE INSTANCE LOCK ──────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // If user tries to run a second instance, focus our window.
        if (jarvisWindow) {
            if (jarvisWindow.isMinimized()) jarvisWindow.restore();
            jarvisWindow.show();
            jarvisWindow.focus();
        } else {
            openJarvisWindow();
        }
    });
}

// ─── APP READY ─────────────────────────────────────────
app.whenReady().then(() => {
    // ✅ Auto-grant microphone permission — required for "Hey Zylron" wake word
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowed = ['microphone', 'media', 'audioCapture'];
        if (allowed.includes(permission)) {
            console.log(`🎙️ Microphone permission: GRANTED for ${permission}`);
            callback(true);  // Always allow mic
        } else {
            callback(false);
        }
    });

    // Also handle permission checks
    session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
        if (permission === 'microphone' || permission === 'media') {
            return true; // Always granted
        }
        return false;
    });

    createTray();
    registerGlobalShortcut();
    startOmniVision();
    startWakeWordEngine();       // 🎙️ Start background wake word listener
    setWindowsStartup();         // 🔄 Auto-start with Windows
    openJarvisWindow();          // 🚀 OPEN IMMEDIATELY ON STARTUP (Boss request)
    console.log('🤖 Zylron JARVIS: Online. Press Ctrl+Shift+Z or say "Hey Zylron"');
});

// ─── WINDOWS AUTO-STARTUP ──────────────────────────────
function setWindowsStartup() {
    if (process.platform === 'win32') {
        app.setLoginItemSettings({
            openAtLogin: true,
            openAsHidden: true, // Start minimized to tray
            name: 'Zylron AI'
        });
        console.log('🔄 Windows Startup: Registered — Zylron starts with Windows');
    }
}

// ─── TRAY ICON ─────────────────────────────────────────
function createTray() {
    // Neon "Z" icon — clearly visible in system tray
    const icon = nativeImage.createFromDataURL(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABuElEQVR4nO2Xv0oDQRDGf5eYmJiYKIiIiIiIiIiI+AKKiIiIiIiIiIiIKKIiIiIiIiIiIiIiIiIiIiLvwCfYS3aT3b27u7t3l4WBQR6YmW9mvpn5diGEEEIIIYQQQgjxryilVoAD4BbY/BMQO+AeuAV2gAVgGVgF1oAx8AhcA3tAD9gCdoF9YBoYAIfAMXAC9IFT4BI4A66BG2AAXAM3wB2wBEyBfeAQOAEOgB5wDpwCZ8AVcAEcA3tACegCe8Ah0AMOgB5wAZwDj0AVWAO2gQ2gDcwCHWAN6AIVoAssARtAD2gDc0AJWAO2gBlgHigCBWAeWAZ2gF2gCqwCc0AJKANFoACsAzWgCpSBElAGCsAcUABmgSJQAGaBIlAEZoEiUADmgAIwB+SAHFAEioRQSqkVoA+cAgfAHrALbAMHwCmwD+wCO8Ah0AEOgB5wDBwDO8AhcAjsA3vAHrAF9IEuMAIGwDlwCpwCe8AQGAMdoAusAiNgCIyAEbAKdIEBMAIGwCowBnrAGBgCY2AE9IExMAAmwBDoA0NgAIyAHjAAxsAAGAFDYASMgAEwAAbAABgBQ2AEjIABMAD+AB/4DRZ6Ky1VAAAAAElFTkSuQmCC'
    );

    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
        { label: '🤖 Zylron AI — JARVIS Mode', enabled: false },
        { type: 'separator' },
        { label: '🚀 Open Zylron  (Ctrl+Shift+Z)', click: openJarvisWindow },
        { label: '🎙️ Wake Word: "Hey Zylron"', enabled: false },
        { label: '👁️ Omni-Vision: ON', id: 'omni', type: 'checkbox', checked: true, click: toggleOmniVision },
        { type: 'separator' },
        { label: '❌ Quit Zylron', click: () => app.quit() }
    ]);

    tray.setToolTip('Zylron AI — Always On | Say "Hey Zylron"');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', openJarvisWindow);
    tray.on('click', openJarvisWindow); // Single click also opens on Windows
}

// ─── GLOBAL SHORTCUT ───────────────────────────────────
function registerGlobalShortcut() {
    const success = globalShortcut.register('CommandOrControl+Shift+Z', () => {
        if (jarvisWindow && jarvisWindow.isVisible()) {
            jarvisWindow.hide();
        } else {
            openJarvisWindow();
        }
    });

    if (success) {
        console.log('⌨️ JARVIS shortcut: Ctrl+Shift+Z registered ✅');
    } else {
        console.warn('⚠️ Ctrl+Shift+Z failed. Trying Alt+Z...');
        globalShortcut.register('Alt+Z', () => {
            if (jarvisWindow && jarvisWindow.isVisible()) {
                jarvisWindow.hide();
            } else {
                openJarvisWindow();
            }
        });
        console.log('⌨️ JARVIS shortcut: Alt+Z registered as fallback');
    }
}

// ─── JARVIS WINDOW ─────────────────────────────────────
function openJarvisWindow() {
    if (jarvisWindow) {
        jarvisWindow.show();
        jarvisWindow.focus();
        return;
    }

    const { screen } = require('electron');
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    jarvisWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        x: Math.round((width - 1000) / 2),
        y: Math.round((height - 700) / 2),
        frame: true,
        titleBarStyle: 'default',
        backgroundColor: '#0f172a',
        alwaysOnTop: false,
        skipTaskbar: false,
        resizable: true,
        show: false,
        title: '🤖 Zylron AI — JARVIS Mode',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    jarvisWindow.once('ready-to-show', () => {
        jarvisWindow.show();
        jarvisWindow.focus();
        console.log('🚀 JARVIS Window: Visible!');
    });

    async function tryLoadFrontend() {
        for (const url of ZYLRON_FRONTEND_PORTS) {
            try {
                await jarvisWindow.loadURL(url);
                console.log(`✅ JARVIS loaded: ${url}`);
                return;
            } catch (e) {
                console.warn(`⚠️ Could not load ${url}`);
            }
        }
        console.warn('⚠️ All frontend ports failed — loading fallback UI');
        jarvisWindow.loadURL(`data:text/html,
            <html>
            <body style="background:#0f172a;color:#06b6d4;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px">
                <div style="font-size:3rem">🤖</div>
                <h1 style="font-size:1.5rem;margin:0">Zylron JARVIS Online</h1>
                <p style="color:#94a3b8;text-align:center">Frontend not found on ports 5173 or 3000.<br>Start it with <code style="background:#1e293b;padding:2px 6px;border-radius:4px">npm run dev</code> in the frontend folder.</p>
                <p style="color:#475569;font-size:0.75rem">Press Ctrl+Shift+Z or say "Hey Zylron" to toggle</p>
            </body>
            </html>
        `);
    }
    tryLoadFrontend();

    jarvisWindow.webContents.setWindowOpenHandler(({ url }) => {
        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                width: 500,
                height: 650,
                modal: true,
                parent: jarvisWindow,
                autoHideMenuBar: true,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    webSecurity: false
                }
            }
        };
    });

    jarvisWindow.on('closed', () => {
        jarvisWindow = null;
    });
}

// ─── 🎙️ WAKE WORD ENGINE ───────────────────────────────
function startWakeWordEngine() {
    wakeWordWindow = new BrowserWindow({
        width: 0,
        height: 0,
        show: false,
        skipTaskbar: true,
        frame: false,
        transparent: true,
        hasShadow: false,
        type: 'toolbar', // Prevents showing in Alt-Tab
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load the wake word listener HTML
    wakeWordWindow.loadFile(path.join(__dirname, 'wakeword.html'));

    wakeWordWindow.on('closed', () => {
        wakeWordWindow = null;
        // Restart wake word engine if it crashes
        setTimeout(startWakeWordEngine, 2000);
    });

    console.log('🎙️ Wake Word Engine: Loading... (say "Hey Zylron" to activate)');
}

// ─── 🎙️ WAKE WORD IPC HANDLER ──────────────────────────
ipcMain.on('wake-word-detected', (event, transcript) => {
    console.log(`🎙️ WAKE WORD: "${transcript}" detected! Opening JARVIS...`);
    openJarvisWindow();
    
    // Flash the tray icon briefly to signal activation
    if (tray) {
        tray.setToolTip('🎙️ Zylron is listening...');
        setTimeout(() => {
            if (tray) tray.setToolTip('Zylron AI — Always On | Say "Hey Zylron"');
        }, 3000);
    }
});

// ─── OMNI-VISION: Screen Awareness ─────────────────────
function startOmniVision() {
    omniVisionActive = true;
    console.log('👁️ Omni-Vision: ACTIVE — capturing screen every 5s');

    screenInterval = setInterval(async () => {
        if (!omniVisionActive) return;
        try {
            const imgBuffer = await screenshot();
            latestScreenshotBase64 = imgBuffer.toString('base64');
            fs.writeFileSync(SCREENSHOT_PATH, imgBuffer);
        } catch (err) {
            console.error('👁️ Omni-Vision capture failed:', err.message);
        }
    }, SCREENSHOT_INTERVAL_MS);
}

function toggleOmniVision() {
    omniVisionActive = !omniVisionActive;
    if (!omniVisionActive) {
        if (screenInterval) {
            clearInterval(screenInterval);
            screenInterval = null;
        }
        console.log('👁️ Omni-Vision: PAUSED');
    } else {
        if (!screenInterval) startOmniVision();
        console.log('👁️ Omni-Vision: RESUMED');
    }
}

// ─── IPC: Send screenshot to renderer ──────────────────
ipcMain.handle('get-screen-context', () => {
    return latestScreenshotBase64;
});

// ─── OS MEDIA CONTROLS (Bypass Spotify API) ─────────────
ipcMain.handle('os-media-control', async (event, action) => {
    if (process.platform === 'win32') {
        let keyCode = '';
        if (action === 'playpause' || action === 'play' || action === 'pause') keyCode = '179';
        else if (action === 'next') keyCode = '176';
        else if (action === 'prev') keyCode = '177';
        
        if (keyCode) {
            const cmd = `powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys([char]${keyCode})"`;
            exec(cmd, (err) => {
                if (err) console.error('Media Key Error:', err);
            });
            console.log(`🎵 OS Media Key Executed: ${action} (${keyCode})`);
            return { success: true, message: `Executed OS Media Key: ${action}` };
        }
    }
    return { success: false, message: 'OS Media controls only supported on Windows Desktop App.' };
});

// ─── APP LIFECYCLE ──────────────────────────────────────
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (screenInterval) clearInterval(screenInterval);
});

app.on('window-all-closed', (e) => {
    e.preventDefault(); // Keep running in tray even if all windows closed
});
