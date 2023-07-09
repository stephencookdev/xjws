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

export const transformOutputStr = () => {
  const extensions = window.api.coreExtensions.filter(
    (extension) => extension.transformOutputStr && extension.__isInit()
  );
  const functionsToCall = extensions.map((extension) =>
    extension.transformOutputStr()
  );

  return `async (initOut) => {

    let out = initOut;
    ${functionsToCall.map((fn) => `out = (${fn})(out)`).join("\n")}

    return out;
  }`;
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

export const useBlockAutoCompleteSuggestions = () => {
  // refresh on extension changes
  const status = useExtensionsStatus();
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    (async () => {
      const extensions = window.api.coreExtensions.filter(
        (extension) =>
          extension.addBlockAutoCompleteSuggestions && extension.__isInit()
      );
      const newSuggestions = [];
      for (const curExtension of extensions) {
        newSuggestions.push(
          ...(await curExtension.addBlockAutoCompleteSuggestions())
        );
      }

      setSuggestions(newSuggestions);
    })();
  }, [JSON.stringify(status)]);

  return suggestions;
};
