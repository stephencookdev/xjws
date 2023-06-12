import { useState, useEffect } from "react";

export const addBlockVariables = async ({
  scriptArray,
  blockVariables: initBlockVariables,
}) => {
  const extensions = window.api.coreExtensions.filter(
    (extension) => extension.addBlockVariables && extension.__isInit()
  );

  const blockVariables = initBlockVariables;
  for (const curExtension of extensions) {
    const newBlockVariables = await curExtension.addBlockVariables({
      scriptArray,
      blockVariables,
    });
    Object.assign(blockVariables, newBlockVariables);
  }

  return blockVariables;
};

export const transformOutput = async (initOut) => {
  const extensions = window.api.coreExtensions.filter(
    (extension) => extension.transformOutput && extension.__isInit()
  );

  let out = initOut;
  for (const curExtension of extensions) {
    out = await curExtension.transformOutput(out);
  }

  return out;
};

export const useExtensionsStatus = () => {
  const getExtensionsStatus = () =>
    window.api.coreExtensions.map((extension) => ({
      name: extension.__name,
      loaded: extension.__isInit(),
    }));

  const [extensionsStatus, setExtensionsStatus] = useState(
    getExtensionsStatus()
  );

  useEffect(() => {
    const listener = (event) => {
      if (event.data.type !== "extension-ready-change") return;
      setExtensionsStatus(getExtensionsStatus());
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  return extensionsStatus;
};
