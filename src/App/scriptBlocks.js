import { useEffect } from "react";
import { addBlockVariables, transformOutputStr } from "./extensions";
import { usePersistState } from "./state";

export const useScriptBlocks = (tabId) => {
  const [scriptBlocks, setScriptBlocks] = usePersistState(tabId, []);

  const addBlock = (scriptBlock) => {
    setScriptBlocks([...scriptBlocks, scriptBlock]);
  };

  const removeBlock = (id) => {
    setScriptBlocks(
      scriptBlocks.filter((scriptBlock) => scriptBlock.id !== id)
    );
  };

  const updateBlock = (id, newScriptBlock) => {
    setScriptBlocks(
      scriptBlocks.map((curBlock) =>
        curBlock.id === id
          ? {
              ...(curBlock || {}),
              ...newScriptBlock,
              dirty: true,
            }
          : curBlock
      )
    );
  };

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
      for (let i = 0; i < scriptBlocks.length; i++) {
        dirtyHit =
          dirtyHit || scriptBlocks[i].dirty || !scriptBlocks[i].content;
        if (!dirtyHit) {
          xout = scriptBlocks[i].result;
          globalOut = scriptBlocks[i].globalAtPoint;
          error = scriptBlocks[i].error;
          if (error) {
            errorIndex = i;
          }
          results.push(xout);
          globalAtPoints.push(globalOut);
          continue;
        }

        const enrichedScriptBlocks = scriptBlocks;
        const initBlockVariables = { $$: globalOut, $xin: xout };

        const blockVariables = await addBlockVariables({
          scriptArray: enrichedScriptBlocks,
          blockVariables: initBlockVariables,
        });

        const codeToEval = `
            async () => {
              try {
                const __xout = await (${transformOutputStr()})(
                  await (async () => { ${scriptBlocks[i].content} })()
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
            setScriptBlocks((scriptBlocks) =>
              addResults(scriptBlocks, { loadingAt: i })
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

      setScriptBlocks((scriptBlocks) => addResults(scriptBlocks));
    })();
  }, [JSON.stringify(scriptBlocks.map((script) => script.dirty))]);

  return {
    scriptBlocks,
    addBlock,
    removeBlock,
    updateBlock,
  };
};
