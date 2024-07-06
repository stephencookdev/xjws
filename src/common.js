const os = require("os");
const path = require("path");
const fs = require("fs");

module.exports.xjwsPath = path.join(os.homedir(), "/.xjws");

// create the xjws directory if it doesn't exist
if (!fs.existsSync(module.exports.xjwsPath)) {
  fs.mkdirSync(module.exports.xjwsPath);
}
