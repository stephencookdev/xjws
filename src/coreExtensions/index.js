const { wrapExtension } = require("./utils");
const core = require("./extensions/core");
const mongodb = require("./extensions/mongodb");

module.exports.coreExtensions = Object.entries({ core, mongodb }).map(
  ([extensionName, extension]) => wrapExtension(extensionName, extension)
);
