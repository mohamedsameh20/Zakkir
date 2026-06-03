const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

app.name = 'zakkir-desktop';
app.setPath('userData', path.join(app.getPath('appData'), 'zakkir-desktop'));

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 580,
    frame: false,
    show: false,
    resizable: true,
    alwaysOnTop: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'popup.html'));

  win.once('ready-to-show', () => {
    win.show();
  });

  // F12 toggles DevTools for debugging in packaged builds
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.on('set-always-on-top', (event, flag) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setAlwaysOnTop(flag);
  }
});

ipcMain.on('resize-window', (event, w, h) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setSize(w, h);
  }
});

ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.minimize();
  }
});

ipcMain.on('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
  }
});
