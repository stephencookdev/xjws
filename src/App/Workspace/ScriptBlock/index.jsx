import React from "react";

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
      <textarea
        value={script.content}
        onChange={(event) => {
          updateScript({ content: event.target.value });
        }}
        ref={(node) => {
          if (script.autoFocus) {
            node.focus();
            node.setSelectionRange(node.value.length, node.value.length);
            updateScript({ autoFocus: false });
          }
        }}
        style={{
          width: "100%",
          height: "100px",
        }}
      ></textarea>
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
