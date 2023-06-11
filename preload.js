const vm = require("node:vm");
const { contextBridge } = require("electron");
const { coreExtensions } = require("./src/coreExtensions");

contextBridge.exposeInMainWorld("api", {
  runInNewContext: (code, context) => {
    const script = new vm.Script(code);
    return script.runInNewContext(context);
  },
  coreExtensions,
});
