const os = require("os");
const path = require("path");
const { MongoClient } = require("mongodb");
const debounce = require("lodash.debounce");

function getEnvConfig() {
  const envJsonPath = path.join(os.homedir(), "/.xjws/envs.json");
  const environments = Object.fromEntries(
    Object.entries(require(envJsonPath)).filter(
      ([envName]) => !/^__/.test(envName)
    )
  );
  return environments;
}

const debouncedGetEnvConfig = debounce(getEnvConfig, 15_000, {
  leading: true,
});

const openConnections = {};
async function getEnvClients() {
  const failTimeout = () =>
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Failed to connect to MongoDB"));
      }, 5_000);
    });

  const main = async () => {
    const environments = await debouncedGetEnvConfig();
    const envClients = Object.fromEntries(
      await Promise.all(
        Object.entries(environments).map(async ([envName, env]) => {
          if (openConnections[envName] && !openConnections[envName].cleanup()) {
            await openConnections[envName].client.db().admin().ping();
            return [envName, openConnections[envName].client];
          }

          const client = new MongoClient(env.url);
          openConnections[envName] = {
            client,
            isClosed: () =>
              ["closed", "connecting"].includes(client.topology.s.state),
            cleanup: () => {
              if (openConnections[envName].isClosed()) {
                openConnections[envName].client.close();
                delete openConnections[envName];
                return true;
              }
              return false;
            },
          };
          await client.connect();
          return [envName, client];
        })
      )
    );
    return envClients;
  };

  return await Promise.race([main(), failTimeout()]);
}

const debouncedGetEnvClients = debounce(getEnvClients, 5_000, {
  leading: true,
});

async function getEnvDbCollections() {
  const envClients = await debouncedGetEnvClients();

  const envToDbToCollections = {};
  for (const [envName, client] of Object.entries(envClients)) {
    const dbToCollections = {};
    const dbNames = await client.db().admin().listDatabases();
    for (const { name: dbName } of dbNames.databases) {
      const collections = [];
      try {
        collections.push(
          ...(await client.db(dbName).listCollections().toArray())
        );
      } catch (err) {
        // do nothing
      }
      if (collections.length) {
        dbToCollections[dbName] = collections.map(({ name }) => name);
      }
    }
    envToDbToCollections[envName] = dbToCollections;
  }

  return envToDbToCollections;
}

const debouncedGetEnvDbCollections = debounce(getEnvDbCollections, 20_000, {
  leading: true,
});

module.exports.addBlockVariables = async () => {
  const envClients = await debouncedGetEnvClients();
  const envDbCollections = await debouncedGetEnvDbCollections();

  const accessCollection = async (envName, dbName, collectionName) => {
    const client = envClients[envName];
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    return () => collection;
  };

  const populatedEnvs = {};
  for (const [envName, dbToCollections] of Object.entries(envDbCollections)) {
    const populatedDbToCollections = {};
    for (const [dbName, collections] of Object.entries(dbToCollections)) {
      const populatedCollections = {};
      for (const collectionName of collections) {
        populatedCollections[collectionName] = await accessCollection(
          envName,
          dbName,
          collectionName
        );
      }
      populatedDbToCollections[dbName] = populatedCollections;
    }
    populatedEnvs[envName] = populatedDbToCollections;
  }

  return {
    $mongodb: populatedEnvs,
  };
};

module.exports.addBlockAutoCompleteSuggestions = async () => {
  const envClients = await debouncedGetEnvClients();
  const envDbCollections = await debouncedGetEnvDbCollections();

  // TODO implement me once we have a proper editor, that takes suggestions

  return [];
};

module.exports.__init = false;
(async () => {
  const checkForInit = async () => {
    const prevInit = module.exports.__init;
    try {
      await debouncedGetEnvClients();
      module.exports.__init = true;
    } catch {
      module.exports.__init = false;
    } finally {
      if (prevInit !== module.exports.__init) {
        window.postMessage({ type: "extension-ready-change" });
      }
      setTimeout(checkForInit, 1_000);
    }
  };
  checkForInit();
})();
