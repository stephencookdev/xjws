import { useEffect, useState } from "react";
import { hri } from "human-readable-ids";

export const usePersistState = (key, defaultValue) => {
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setLoaded(false);
    setValue(defaultValue);

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

export const useTabs = () => {
  const [loaded, setLoaded] = useState(false);
  const [tabs, setTabs] = useState([]);

  const [activeTabName, setActiveTabName] = useState(null);

  useEffect(() => {
    if (tabs.length > 0 && !activeTabName) {
      setActiveTabName(tabs[0].name);
    }
  }, [tabs.length]);

  useEffect(() => {
    (async () => {
      await window.api.store.init();
      setLoaded(true);
      const tabs = window.api.store.getAllKeys();
      if (tabs && tabs.length)
        setTabs(
          tabs.map((tabName) => ({
            name: tabName,
            persisted: true,
          }))
        );
      else
        setTabs([
          {
            tabName: hri.random(),
            persisted: false,
          },
        ]);
    })();
  }, []);

  const addTab = () => {
    const newTabName = hri.random();
    setTabs([...tabs, { name: newTabName, persisted: false }]);
    setActiveTabName(newTabName);
    return newTabName;
  };

  const closeTab = (tabName) => {
    const newTabs = tabs.filter((tab) => tab.name !== tabName);
    setTabs(newTabs);
    window.api.store.delete(tabName);
  };

  return loaded
    ? {
        tabs,
        addTab,
        closeTab,

        activeTabName,
        setActiveTabName,
      }
    : {
        tabs: [],
        addTab: () => {},
        closeTab: () => {},

        activeTabName: null,
        setActiveTabName: () => {},
      };
};
