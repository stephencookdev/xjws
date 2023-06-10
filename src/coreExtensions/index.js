import * as core from "./core";
import * as mongodb from "./mongodb";

export const coreExtensions = [core, mongodb].map((extension) => {
  extension.addBlockVariables ||= () => {};
  return extension;
});
