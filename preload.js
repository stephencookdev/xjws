const vm = require("node:vm");
const { contextBridge } = require("electron");
const { Store } = require("./src/store");
const { coreExtensions } = require("./src/coreExtensions");

const store = new Store();

// Expose public methods that allow the renderer process to use
const exposableStore = Object.getOwnPropertyNames(Store.prototype)
  .filter((key) => typeof store[key] === "function" && !/^_/.test(key))
  .reduce(
    (acc, key) => ({
      ...acc,
      [key]: (...args) => store[key](...args),
    }),
    {}
  );

contextBridge.exposeInMainWorld("api", {
  store: exposableStore,
  coreExtensions,
  runInNewContext: (code, context) => {
    const script = new vm.Script(code);
    return script.runInNewContext(context);
  },
});
