const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer (Zylron frontend)
contextBridge.exposeInMainWorld('zylronDesktop', {
    // Get latest Omni-Vision screenshot (base64)
    getScreenContext: () => ipcRenderer.invoke('get-screen-context'),
    
    // 🎵 OS MEDIA: Bypass Spotify API
    osMediaControl: (action) => ipcRenderer.invoke('os-media-control', action),
    
    // Check if running in desktop mode
    isDesktop: true,
    
    // Platform info
    platform: process.platform
});

// Expose wake word bridge for wakeword.html hidden window
contextBridge.exposeInMainWorld('electronAPI', {
    wakeWordDetected: (transcript) => ipcRenderer.send('wake-word-detected', transcript)
});
