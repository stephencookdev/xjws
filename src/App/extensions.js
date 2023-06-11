export const addBlockVariables = async ({
  scriptArray,
  blockVariables: initBlockVariables,
}) => {
  const extensions = window.api.coreExtensions.filter(
    (extension) => extension.addBlockVariables
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
    (extension) => extension.transformOutput
  );

  let out = initOut;
  for (const curExtension of extensions) {
    out = await curExtension.transformOutput(out);
  }

  return out;
};
