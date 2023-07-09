import React from "react";
import ScriptBlock from "./ScriptBlock";
import { useScriptBlocks } from "../scriptBlocks";
import { useBlockAutoCompleteSuggestions } from "../extensions";

const Workspace = ({ tabName }) => {
  const { scriptBlocks, updateBlock, deleteBlock, addBlock } =
    useScriptBlocks(tabName);
  const blockAutoCompleteSuggestions = useBlockAutoCompleteSuggestions();

  return (
    <>
      {scriptBlocks.map((script) => {
        return (
          <ScriptBlock
            key={script.id}
            script={script}
            scriptAutoCompleteSuggestions={blockAutoCompleteSuggestions}
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
