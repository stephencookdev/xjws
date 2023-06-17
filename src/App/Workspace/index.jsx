import React from "react";
import ScriptBlock from "./ScriptBlock";
import { useScriptBlocks } from "../scriptBlocks";

const Workspace = () => {
  const { scriptBlocks, updateBlock, deleteBlock, addBlock } =
    useScriptBlocks("test-tab-id");

  return (
    <>
      {scriptBlocks.map((script, index) => {
        return (
          <ScriptBlock
            key={index}
            script={script}
            updateScript={(newScript) => updateBlock(script.id, newScript)}
            deleteScript={() => deleteBlock(script.id)}
          />
        );
      })}
      <br />
      (Add new...)
      <textarea
        value={""}
        onChange={(event) =>
          addBlock({
            content: event.target.value,
            result: null,
            error: false,
            autoFocus: true,
            id: Math.max(...scriptBlocks.map((script) => script.id), -1) + 1,
          })
        }
      ></textarea>
    </>
  );
};

export default Workspace;
