import React, { useRef, useEffect } from "react";
import ScriptBlock from "./ScriptBlock";
import { useScriptBlocks } from "../scriptBlocks";
import { useBlockAutoCompleteSuggestions } from "../extensions";
import { add } from "lodash";

const Workspace = ({ tabName }) => {
  const scriptContainer = useRef(null);
  const addNewText = useRef(null);
  const { scriptBlocks, updateBlock, deleteBlock, addBlock, requestRun } =
    useScriptBlocks(tabName);
  const blockAutoCompleteSuggestions = useBlockAutoCompleteSuggestions();

  useEffect(() => {
    // add a global key listener so if the user pushes Cmd+Enter, then the button is clicked
    const listener = (event) => {
      if (event.metaKey && event.key === "Enter") {
        requestRun();
      }
    };
    document.addEventListener("keydown", listener);

    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, []);

  useEffect(() => {
    if (!addNewText.current) return;
    const listener = (event) => {
      // detect if the user is ctrl+tabbing
      if (event.ctrlKey && event.key === "Tab") {
        const scriptIdToFocus =
          scriptBlocks[event.shiftKey ? scriptBlocks.length - 1 : 0].id;
        document.dispatchEvent(
          new CustomEvent("focus-request", {
            detail: scriptIdToFocus,
          })
        );
      }
    };

    addNewText.current.addEventListener("keydown", listener);

    return () => {
      addNewText.current.removeEventListener("keydown", listener);
    };
  }, [addNewText.current, scriptBlocks]);

  return (
    <div ref={scriptContainer}>
      <button onClick={() => requestRun()}>Run code</button>
      {scriptBlocks.map((script, i) => {
        return (
          <ScriptBlock
            key={script.id}
            script={script}
            scriptAutoCompleteSuggestions={blockAutoCompleteSuggestions}
            updateScript={(newScript) => updateBlock(script.id, newScript)}
            deleteScript={() => deleteBlock(script.id)}
            requestRun={requestRun}
            tabToNextBlock={() => {
              if (i === scriptBlocks.length - 1) {
                addNewText.current.focus();
              } else {
                const idToFocus = scriptBlocks[i + 1].id;
                document.dispatchEvent(
                  new CustomEvent("focus-request", {
                    detail: idToFocus,
                  })
                );
              }
            }}
            tabToPreviousBlock={() => {
              if (i === 0) {
                addNewText.current.focus();
              } else {
                const idToFocus = scriptBlocks[i - 1].id;
                document.dispatchEvent(
                  new CustomEvent("focus-request", {
                    detail: idToFocus,
                  })
                );
              }
            }}
          />
        );
      })}
      <br />
      (Add new...)
      <textarea
        ref={addNewText}
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
      />
    </div>
  );
};

export default Workspace;
