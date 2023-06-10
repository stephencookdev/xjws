import React, { useState, useEffect } from "react";
import ScriptBlock from "./ScriptBlock";
import { coreExtensions } from "../../coreExtensions";

const Workspace = () => {
  const [scriptArray, setScriptArray] = useState([]);

  useEffect(() => {
    (async () => {
      let xout = null;
      let globalOut = {};
      let error = null;
      let errorIndex = null;
      const results = [];
      const addResults = (scriptArray) => {
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
      };
      for (let i = 0; i < scriptArray.length; i++) {
        const enrichedScriptArray = addResults(scriptArray);
        const initBlockVariables = { $$: globalOut, $xin: xout };
        const blockVariables = coreExtensions.reduce(
          (acc, curExtension) => ({
            ...acc,
            ...curExtension.addBlockVariables({
              scriptArray: enrichedScriptArray,
              blockVariables,
            }),
          }),
          initBlockVariables
        );

        const codeToEval = `
            async () => {
              ${Object.entries(blockVariables)
                .map(
                  ([key, value]) => `const ${key} = ${JSON.stringify(value)};`
                )
                .join("\n")}
              try {
                const __xout = await (async () => { ${
                  scriptArray[i].content
                } })();

                return {
                  xout: __xout,
                  globalOut: $$,
                };
              } catch (err) {
                return {
                  error: err,
                  errorStack: err.stack,
                }
              }
            };
        `;
        try {
          const resp = await window.api.runInNewContext(codeToEval, {
            __xout: xout,
            globalOut,
          })();
          if (resp.error) {
            const error = resp.error;
            error.originalStack = resp.errorStack;
            throw error;
          }

          xout = resp.xout;
          globalOut = resp.globalOut;
          results.push(xout);
        } catch (err) {
          if (err.originalStack) {
            console.error(err.originalStack);
          } else {
            console.error(err);
          }
          error = err;
          errorIndex = i;
          break;
        }
      }

      setScriptArray((scriptArray) => addResults(scriptArray));
    })();
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
