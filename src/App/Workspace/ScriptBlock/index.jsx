import React, { useState, useEffect } from "react";
import MonacoEditor from "react-monaco-editor";

let _globalDisposable = null;

const ScriptBlock = ({
  script,
  scriptAutoCompleteSuggestions,
  updateScript,
  deleteScript,
}) => {
  const [monaco, setMonaco] = useState(null);

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
    >
      <div style={{ border: "1px dashed black" }}>$x{script.id}</div>
      {script.loading ? <div>Loading...</div> : null}
      <MonacoEditor
        language="javascript"
        theme="vs-dark"
        height={200}
        width="50%"
        value={script.content}
        onChange={(content) => {
          updateScript({ content });
        }}
        editorDidMount={(node, newMonaco) => {
          if (newMonaco && newMonaco !== monaco) {
            setMonaco(newMonaco);
          }
          if (script.autoFocus && node) {
            node.focus();
            const model = node.getModel();
            const lineCount = model.getLineCount();
            const lastLineLength = model.getLineLength(lineCount);

            node.setPosition({
              lineNumber: lineCount,
              column: lastLineLength + 1,
            });

            updateScript({ autoFocus: false });
          }
        }}
      />
      {script.error ? (
        <div style={{ border: "1px dashed red" }}>
          {script.error.toString()}
        </div>
      ) : (
        <div style={{ border: "1px dashed black" }}>
          {JSON.stringify(script.result)}
        </div>
      )}
      <button onClick={deleteScript}>Delete</button>
    </div>
  );
};

export default ScriptBlock;
