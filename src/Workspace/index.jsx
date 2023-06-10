import React, { useState, useEffect } from "react";
import ScriptBlock from "./ScriptBlock";

const Workspace = () => {
  const [scriptArray, setScriptArray] = useState([]);

  useEffect(() => {
    let xout = null;
    let globalOut = {};
    let error = null;
    let errorIndex = null;
    const results = [];
    for (let i = 0; i < scriptArray.length; i++) {
      const codeToEval = `
            const global = ${JSON.stringify(globalOut)};
            const $xin = ${JSON.stringify(xout)};
            ${results
              .map(
                (result, index) =>
                  `const $x${scriptArray[index].id} = ${JSON.stringify(
                    result
                  )};`
              )
              .join("\n")}
            xout = (() => { ${scriptArray[i].content} })();
            
            (() => ({
              xout,
              globalOut: global,
            }))();
        `;
      try {
        const resp = window.api.runInNewContext(codeToEval, {
          xout,
          globalOut,
        });
        xout = resp.xout;
        globalOut = resp.globalOut;
        results.push(xout);
      } catch (err) {
        error = err;
        errorIndex = i;
        break;
      }
    }

    setScriptArray((scriptArray) => {
      const newScriptArray = [...scriptArray];
      newScriptArray.forEach((script, index) => {
        if (index === errorIndex) {
          script.error = error;
          script.result = null;
        } else if (errorIndex !== null && index > errorIndex) {
          script.error = false;
          script.result = null;
        } else {
          script.result = results[index];
          script.error = false;
        }
      });
      return newScriptArray;
    });
  }, [JSON.stringify(scriptArray)]);

  return (
    <>
      {scriptArray.map((script, index) => {
        return (
          <ScriptBlock
            key={index}
            script={script}
            updateScript={(newScript) => {
              const newScriptArray = [...scriptArray];
              Object.entries(newScript).forEach(([key, value]) => {
                newScriptArray[index][key] = value;
              });
              setScriptArray(newScriptArray);
            }}
            deleteScript={() => {
              const newScriptArray = [...scriptArray];
              newScriptArray.splice(index, 1);
              setScriptArray(newScriptArray);
            }}
          />
        );
      })}
      <br />
      (Add new...)
      <textarea
        value={""}
        onChange={(event) => {
          const newScriptArray = [...scriptArray];
          newScriptArray.push({
            content: event.target.value,
            result: null,
            error: false,
            autoFocus: true,
            id: Math.max(...newScriptArray.map((script) => script.id), -1) + 1,
          });
          setScriptArray(newScriptArray);
        }}
      ></textarea>
    </>
  );
};

export default Workspace;
