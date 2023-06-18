import React from "react";
import MonacoEditor from "react-monaco-editor";

const ScriptBlock = ({ script, updateScript, deleteScript }) => {
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
        editorDidMount={(node) => {
          if (script.autoFocus && node) {
            node.focus();
            node.setSelectionRange(node.value.length, node.value.length);
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
