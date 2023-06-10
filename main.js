require("electron-reload")(__dirname, {
  electron: require(`${__dirname}/node_modules/electron`),
  hardResetMethod: "exit",
  ignored: /src|node_modules|[\/\\]\./,
});

const path = require("path");
const { app, BrowserWindow } = require("electron");

function createWindow() {
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegrationInWorker: true,
    },
  });

  win.loadFile("./index.html");
}

app.whenReady().then(createWindow);
