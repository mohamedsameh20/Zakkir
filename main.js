const { app, BrowserWindow, ipcMain, Notification, shell } = require('electron');
const path = require('path');

app.name = 'zakkir-desktop';
app.setPath('userData', path.join(app.getPath('appData'), 'zakkir-desktop'));

let mainWindow = null;
let prayerSchedule = null;
let reminderSettings = {
  remindersEnabled: false,
  reminderMinutes: 10,
  reminderPrayers: [],
  reminderSound: 'adhan-makkah',
  prayerAlertEnabled: true,
  iqamaEnabled: false,
  iqamaMinutes: 10
};
const firedToday = new Set(); // "Prayer-YYYY-MM-DD-N" keys to avoid double-firing

function createWindow() {
  mainWindow = new BrowserWindow({
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

  mainWindow.loadFile(path.join(__dirname, 'popup.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // F12 toggles DevTools for debugging in packaged builds
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
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

  checkForUpdates();
  setInterval(checkForUpdates, 4 * 60 * 60 * 1000); // every 4 hours

  // Reminder scheduler — check every 60 seconds
  setInterval(() => {
    if (!prayerSchedule) return;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const nowM = now.getHours() * 60 + now.getMinutes();
    for (const name of (reminderSettings.reminderPrayers || [])) {
      const timeStr = prayerSchedule[name];
      if (!timeStr) continue;
      const [h, m] = timeStr.split(':').map(Number);
      const prayerM = h * 60 + m;

      // 1. Normal Reminder (Before Adhan)
      if (reminderSettings.remindersEnabled) {
        const diff = prayerM - nowM;
        const fireKey = `${name}-${todayStr}-${reminderSettings.reminderMinutes}`;
        if (diff === reminderSettings.reminderMinutes && !firedToday.has(fireKey)) {
          firedToday.add(fireKey);
          if (Notification.isSupported()) {
            new Notification({
              title: 'Zakkir — Prayer Reminder',
              body: `${name} in ${diff} minutes`,
              icon: path.join(__dirname, 'icon.png'),
            }).show();
          }
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('play-sound', reminderSettings.reminderSound);
          }
        }
      }

      // 2. Exact Prayer Time Alert
      if (reminderSettings.prayerAlertEnabled) {
        const diff = prayerM - nowM;
        const nowKey = `${name}-now-${todayStr}`;
        if (diff === 0 && !firedToday.has(nowKey)) {
          firedToday.add(nowKey);
          if (Notification.isSupported()) {
            new Notification({
              title: 'Zakkir — Prayer Time',
              body: `It is now time for ${name} prayer`,
              icon: path.join(__dirname, 'icon.png'),
            }).show();
          }
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('play-sound', reminderSettings.reminderSound);
          }
        }
      }

      // 2. Iqama Reminder (After Adhan)
      if (reminderSettings.iqamaEnabled) {
        const elapsed = nowM - prayerM;
        const iqamaKey = `${name}-iqama-${todayStr}-${reminderSettings.iqamaMinutes}`;
        if (elapsed === reminderSettings.iqamaMinutes && !firedToday.has(iqamaKey)) {
          firedToday.add(iqamaKey);
          if (Notification.isSupported()) {
            new Notification({
              title: 'Zakkir — Iqama Reminder',
              body: `Iqama for ${name} is now! (${reminderSettings.iqamaMinutes} minutes after Adhan)`,
              icon: path.join(__dirname, 'icon.png'),
            }).show();
          }
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('play-sound', reminderSettings.reminderSound);
          }
        }
      }
    }
    // Clean firedToday for old dates
    for (const key of firedToday) {
      if (!key.includes(todayStr)) firedToday.delete(key);
    }
  }, 60_000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.on('set-always-on-top', (event, flag) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.setAlwaysOnTop(flag);
});

ipcMain.on('resize-window', (event, w, h) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.setSize(w, h);
});

ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.on('set-prayer-times', (event, times, settings) => {
  prayerSchedule = times;
  reminderSettings = { ...reminderSettings, ...settings };
});

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

async function checkForUpdates() {
  try {
    const res = await fetch('https://api.github.com/repos/mohamedsameh20/Zakkir/releases/latest');
    const data = await res.json();
      if (data && data.tag_name) {
        const latestVersion = data.tag_name.replace('v', '');
        const cmp = latestVersion.localeCompare(app.getVersion(), undefined, { numeric: true, sensitivity: 'base' });
        if (cmp > 0) { // Only notify if latestVersion is greater
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update-available', latestVersion, data.html_url);
          }
        }
      }
  } catch (e) {
    console.error('Update check failed:', e);
  }
}
