const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),
  resizeWindow: (w, h) => ipcRenderer.send('resize-window', w, h),
  closeWindow: () => ipcRenderer.send('close-window')
});
