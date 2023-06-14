import React, { useState, useEffect } from "react";
import ScriptBlock from "./ScriptBlock";
import { addBlockVariables, transformOutputStr } from "../extensions";

const Workspace = () => {
  const [scriptArray, setScriptArray] = useState([]);

  useEffect(() => {
    (async () => {
      let xout = null;
      let globalOut = {};
      let error = null;
      let errorIndex = null;
      let dirtyHit = false;
      const results = [];
      const globalAtPoints = [];
      const addResults = (scriptArray, { loadingAt } = {}) => {
        const newScriptArray = [...scriptArray];
        newScriptArray.forEach((script, index) => {
          script.loading = typeof loadingAt === "number" && loadingAt <= index;
          if (typeof loadingAt !== "number") {
            script.dirty = false;
          }

          if (index === errorIndex) {
            script.error = error;
            script.result = null;
            script.globalAtPoint = null;
          } else if (errorIndex !== null && index > errorIndex) {
            script.error = false;
            script.result = null;
            script.globalAtPoint = null;
          } else {
            script.result = results[index];
            script.globalAtPoint = globalAtPoints[index];
            script.error = false;
          }
        });
        return newScriptArray;
      };
      for (let i = 0; i < scriptArray.length; i++) {
        dirtyHit = dirtyHit || scriptArray[i].dirty || !scriptArray[i].content;
        if (!dirtyHit) {
          xout = scriptArray[i].result;
          globalOut = scriptArray[i].globalAtPoint;
          error = scriptArray[i].error;
          if (error) {
            errorIndex = i;
          }
          results.push(xout);
          globalAtPoints.push(globalOut);
          continue;
        }

        // const enrichedScriptArray = addResults(scriptArray);
        const enrichedScriptArray = scriptArray;
        const initBlockVariables = { $$: globalOut, $xin: xout };

        const blockVariables = await addBlockVariables({
          scriptArray: enrichedScriptArray,
          blockVariables: initBlockVariables,
        });

        const codeToEval = `
            async () => {
              try {
                const __xout = await (${transformOutputStr()})(
                  await (async () => { ${scriptArray[i].content} })()
                );

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
        let setLoading;
        try {
          setLoading = setTimeout(() => {
            setScriptArray((scriptArray) =>
              addResults(scriptArray, { loadingAt: i })
            );
          }, 100);

          const resp = await window.api.runInNewContext(codeToEval, {
            ...blockVariables,
            delay: async (ms) =>
              await new Promise((resolve) => setTimeout(resolve, ms)),
          })();
          if (resp.error) {
            const error = resp.error;
            error.originalStack = resp.errorStack;
            throw error;
          }

          xout = resp.xout;
          globalOut = resp.globalOut;
          results.push(xout);
          globalAtPoints.push(globalOut);
        } catch (err) {
          if (err.originalStack) {
            console.error(err.originalStack);
          } else {
            console.error(err);
          }
          error = err;
          errorIndex = i;
          break;
        } finally {
          clearTimeout(setLoading);
        }
      }

      setScriptArray((scriptArray) => addResults(scriptArray));
    })();
  }, [JSON.stringify(scriptArray.map((script) => script.dirty))]);

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
              newScriptArray[index].dirty = true;
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
