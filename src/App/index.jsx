import React from "react";
import { createRoot } from "react-dom/client";
import Workspace from "./Workspace";

const App = () => {
  return (
    <div>
      <h1>XJWS</h1>
      <Workspace />
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
