const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 560,
    title: 'Phresh\'s Poker Clock', 
    icon: __dirname + '/ppcapp/img/ppcicon.png'
  });

  mainWindow.loadURL('file://' + __dirname + '/ppcapp/index.html');
  mainWindow.setMenu(null);
  mainWindow.setMaximizable(false);
  /* mainWindow.setResizable(false); */ // not works correctly
  mainWindow.setMaximumSize(1000,560);
  mainWindow.setMinimumSize(1000,560);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
