import React, { useRef, useState, useEffect } from "react";
import MonacoEditor from "react-monaco-editor";
import OutputRenderer from "./OutputRenderer";

let _globalDisposable = null;

const ScriptBlock = ({
  script,
  scriptAutoCompleteSuggestions,
  updateScript,
  deleteScript,
  requestRun,
  tabToNextBlock,
  tabToPreviousBlock,
}) => {
  const mountActions = useRef({
    requestRun,
    tabToNextBlock,
    tabToPreviousBlock,
  });
  const editorRef = useRef(null);
  const [monaco, setMonaco] = useState(null);

  useEffect(() => {
    mountActions.current = {
      requestRun,
      tabToNextBlock,
      tabToPreviousBlock,
    };
  }, [requestRun, tabToNextBlock, tabToPreviousBlock]);

  useEffect(() => {
    // listen for a global "focus request" event for this script id
    // and focus monaco if it is fired
    const listener = (event) => {
      if (event.detail === script.id && editorRef.current) {
        editorRef.current.focus();
      }
    };

    document.addEventListener("focus-request", listener);
    return () => {
      document.removeEventListener("focus-request", listener);
    };
  }, [script.id, monaco]);

  useEffect(() => {
    if (!monaco || _globalDisposable) return;

    _globalDisposable = monaco.languages.registerCompletionItemProvider(
      "javascript",
      {
        provideCompletionItems: () => {
          const suggestions = (scriptAutoCompleteSuggestions || []).map(
            (suggestion) => ({
              ...suggestion,
              kind: suggestion.kind
                ? monaco.languages.CompletionItemKind[suggestion.kind]
                : undefined,
            })
          );

          return { suggestions };
        },
      }
    );

    return () => {
      _globalDisposable.dispose();
      _globalDisposable = null;
    };
  }, [monaco, JSON.stringify(scriptAutoCompleteSuggestions)]);

  return (
    <div
      style={{
        border: `1px solid ${script.error ? "red" : "black"}`,
        opacity: script.loading ? 0.5 : 1,
      }}
      className="foo"
      data-script-block
    >
      <style type="text/css">{`.foo:focus-within { background: #eaa; }`}</style>
      <div style={{ border: "1px dashed black", display: "flex" }}>
        $x{script.id}
        <button style={{ marginLeft: "auto" }} onClick={deleteScript}>
          Delete
        </button>
      </div>
      <div style={{ display: "flex" }}>
        <MonacoEditor
          language="javascript"
          theme="vs-dark"
          height={200}
          width="50%"
          value={script.content}
          onChange={(content) => {
            updateScript({ content });
          }}
          editorDidMount={(editor, newMonaco) => {
            editorRef.current = editor;

            editor.addAction({
              id: "cmd-enter",
              label: "Run code",
              keybindings: [newMonaco.KeyMod.CtrlCmd | newMonaco.KeyCode.Enter],
              contextMenuGroupId: "navigation",
              contextMenuOrder: 1.5,
              run: () => mountActions.current.requestRun(),
            });
            editor.addAction({
              id: "ctrl+tab",
              label: "Next code block",
              keybindings: [newMonaco.KeyMod.WinCtrl | newMonaco.KeyCode.Tab],
              contextMenuGroupId: "navigation",
              contextMenuOrder: 1.5,
              run: () => mountActions.current.tabToNextBlock(),
            });
            editor.addAction({
              id: "ctrl+shift+tab",
              label: "Previous code block",
              keybindings: [
                newMonaco.KeyMod.WinCtrl |
                  newMonaco.KeyMod.Shift |
                  newMonaco.KeyCode.Tab,
              ],
              contextMenuGroupId: "navigation",
              contextMenuOrder: 1.5,
              run: () => mountActions.current.tabToPreviousBlock(),
            });

            if (newMonaco && newMonaco !== monaco) {
              setMonaco(newMonaco);
            }
            if (script.autoFocus) {
              editor.focus();
              const model = editor.getModel();
              const lineCount = model.getLineCount();
              const lastLineLength = model.getLineLength(lineCount);

              editor.setPosition({
                lineNumber: lineCount,
                column: lastLineLength + 1,
              });

              updateScript({ autoFocus: false });
            }
          }}
          options={{
            scrollBeyondLastLine: false,
            scrollBeyondLastColumn: 0,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
            },
          }}
        />
        <div>
          {script.loading ? <div>Loading...</div> : null}
          {script.dirty ? (
            "..."
          ) : script.error ? (
            <div style={{ border: "1px dashed red" }}>
              {script.error.toString()}
            </div>
          ) : (
            <OutputRenderer result={script.result} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptBlock;
