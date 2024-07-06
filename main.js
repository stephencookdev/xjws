require("electron-reload")(__dirname, {
  electron: require(`${__dirname}/node_modules/electron`),
  hardResetMethod: "exit",
  ignored: /src\/App|node_modules|[\/\\]\./,
});

const path = require("path");
const { app, BrowserWindow, Menu } = require("electron");

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

function createMenu() {
  const template = [
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forcereload" },
        { role: "toggledevtools" },
        { type: "separator" },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  createMenu();
});
