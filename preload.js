const vm = require("node:vm");
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("api", {
  runInNewContext: (code, context) => {
    const script = new vm.Script(code);
    return script.runInNewContext(context);
  },
});
