const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),
  resizeWindow: (w, h) => ipcRenderer.send('resize-window', w, h),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  setPrayerTimes: (times, settings) => ipcRenderer.send('set-prayer-times', times, settings),
  onPlaySound: (cb) => ipcRenderer.on('play-sound', (_, file) => cb(file)),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (_, version, url) => cb(version, url)),
});
