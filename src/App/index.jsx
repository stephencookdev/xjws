import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import Workspace from "./Workspace";
import { useExtensionsStatus } from "./extensions";
import { useTabs } from "./state";

const App = () => {
  const extensionsStatus = useExtensionsStatus();
  const { tabs, addTab, closeTab, activeTabName, setActiveTabName } = useTabs();

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
        {tabs.map((tab) => (
          <div key={tab.name}>
            <button onClick={() => setActiveTabName(tab.name)}>
              {tab.name}
            </button>
            <button onClick={() => closeTab(tab.name)}>(x)</button>
          </div>
        ))}
        <button onClick={() => addTab()}>Add Tab</button>

        {activeTabName ? <Workspace tabName={activeTabName} /> : null}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
