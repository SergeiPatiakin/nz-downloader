import { app, BrowserWindow, dialog, Menu } from 'electron';

import { getApiService, getDatabaseService } from './di';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const initWindow = async (): Promise<void> => {
  // Initialize API
  const apiService = getApiService()

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  let zoomLevel = 0

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Application',
      submenu: [
        {
          label: "Reset application",
          click: async (m, b: BrowserWindow, e) => {
            dialog.showMessageBox(b, {
              message: 'Reset application? This will delete all application settings',
              buttons: ['OK', 'Cancel'],
            }).then(async ({ response }: { response: number}) => {
              if (response === 0) {
                await getDatabaseService().resetDb()
                app.quit()
              }
            })
          },
        },
        {
          label: "Open dev tools",
          click: async (m, b: BrowserWindow, e) => {
            b.webContents.openDevTools()
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: 'undo' },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: 'redo' },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: 'cut'},
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: 'copy' },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: 'paste' },
        { label: "Select All", accelerator: "CmdOrCtrl+A", role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In', click: () => {
          zoomLevel += 1
          mainWindow.webContents.setZoomLevel(zoomLevel)
        }},
        { label: 'Zoom Out', click: () => {
          zoomLevel -= 1
          mainWindow.webContents.setZoomLevel(zoomLevel)
        }},
      ]
    },
  ]))

  apiService.setMainWindow(mainWindow)
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', initWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    initWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
