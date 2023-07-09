import React, { useState } from "react";
import ReactJson from "react-json-view";
import useClipboard from "react-use-clipboard";

const modes = ["json", "raw"];

const OutputRenderer = ({ result }) => {
  const [isCopied, setCopied] = useClipboard(result);
  const [mode, setMode] = useState("json");

  const isJson = typeof result === "object";
  const finalMode = isJson ? mode : "raw";

  return (
    <div>
      <div>
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              fontWeight: mode === m ? "bold" : "normal",
            }}
          >
            {m}
          </button>
        ))}
      </div>
      {isCopied ? (
        <div>Copied!</div>
      ) : (
        <button onClick={setCopied}>Copy</button>
      )}
      <div>
        {finalMode === "json" ? (
          <ReactJson
            src={result}
            indentWidth={2}
            collapsed={2}
            enableClipboard={false}
            style={{
              backgroundColor: "transparent",
            }}
          />
        ) : (
          <pre>{isJson ? JSON.stringify(result, null, 2) : result}</pre>
        )}
      </div>
    </div>
  );
};

export default OutputRenderer;
