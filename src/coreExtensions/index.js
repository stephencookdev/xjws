const core = require("./core");
const mongodb = require("./mongodb");

module.exports.coreExtensions = Object.entries({ core, mongodb }).map(
  ([extensionName, extension]) => {
    const wrappedExtension = { ...extension };

    wrappedExtension.__isInit = () => extension.__init !== false;
    wrappedExtension.__name = extensionName;

    return wrappedExtension;
  }
);
