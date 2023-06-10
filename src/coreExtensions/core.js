export const addBlockVariables = ({ scriptArray }) => {
  return Object.fromEntries(
    scriptArray.map(({ result, id }) => [`$x${id}`, result])
  );
};
