import { useEffect, useState } from "react";

export const usePersistState = (key, defaultValue) => {
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    (async () => {
      await window.api.store.init();
      setLoaded(true);

      const storedValue = window.api.store.get(key);
      if (storedValue !== undefined) setValue(storedValue);
    })();
  }, [key]);

  const setValueAndStore = (newValue) => {
    if (typeof newValue === "function") {
      setValue((oldValue) => {
        const newValueToStore = newValue(oldValue);
        window.api.store.set(key, newValueToStore);
        return newValueToStore;
      });
    } else {
      setValue(newValue);
      window.api.store.set(key, newValue);
    }
  };

  return loaded ? [value, setValueAndStore] : [defaultValue, () => {}];
};
