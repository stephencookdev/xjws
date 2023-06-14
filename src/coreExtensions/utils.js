const extensionNameToInit = {};

const genUtils = () => {
  function setInitState(newInit) {
    const curInit = this.__isInit();
    if (curInit !== newInit) {
      window.postMessage({
        type: "extension-ready-change",
        extensionName: this.__name,
        init: newInit,
      });
    }
    extensionNameToInit[this.__name] = newInit;
  }

  return {
    setInitState,
  };
};

module.exports.wrapExtension = (extensionName, extensionFn) => {
  const utils = genUtils();
  const extension =
    typeof extensionFn === "function" ? extensionFn(utils) : extensionFn;

  Object.keys(utils).forEach((key) => {
    const fn = utils[key];
    if (typeof fn !== "function") return;
    utils[key] = fn.bind(extension);
  });

  extension.__isInit = () => {
    const isInit = Object.keys(extensionNameToInit).includes(extensionName)
      ? extensionNameToInit[extensionName]
      : extension.__init !== false;
    extensionNameToInit[extensionName] = isInit;
    return isInit;
  };
  extension.__name = extensionName;

  return extension;
};
