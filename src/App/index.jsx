import React from "react";
import { createRoot } from "react-dom/client";
import Workspace from "./Workspace";
import { useExtensionsStatus } from "./extensions";

const App = () => {
  const extensionsStatus = useExtensionsStatus();

  return (
    <div>
      <h1>XJWS</h1>
      <div>
        <h2>Loaded Extensions</h2>
        <ul>
          {extensionsStatus.map(({ name, loaded }) => (
            <li
              key={name}
              style={{
                opacity: loaded ? 1 : 0.5,
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Workspace</h2>
        <Workspace />
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
