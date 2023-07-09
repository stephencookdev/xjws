const path = require("path");
const { MongoClient } = require("mongodb");
const debounce = require("lodash.debounce");
const { xjwsPath } = require("../../common");

function getEnvConfig() {
  const envJsonPath = path.join(xjwsPath, "envs.json");
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

module.exports = (utils) => {
  const addBlockVariables = async () => {
    const envClients = await debouncedGetEnvClients();
    const envDbCollections = await debouncedGetEnvDbCollections();

    const accessCollection = (envName, dbName, collectionName) => {
      const client = envClients[envName];
      const db = client.db(dbName);
      const collection = db.collection(collectionName);

      const safeCollection = Object.getOwnPropertyNames(
        Object.getPrototypeOf(collection)
      )
        .filter(
          (key) => typeof collection[key] === "function" && !/^_/.test(key)
        )
        .reduce(
          (acc, key) => ({
            ...acc,
            [key]: (...args) => collection[key](...args),
          }),
          {}
        );

      return safeCollection;
    };

    const populatedEnvs = {};
    for (const [envName, dbToCollections] of Object.entries(envDbCollections)) {
      const populatedDbToCollections = {};
      for (const [dbName, collections] of Object.entries(dbToCollections)) {
        const populatedCollections = {};
        for (const collectionName of collections) {
          populatedCollections[collectionName] = accessCollection(
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

  const addBlockAutoCompleteSuggestions = async () => {
    const blockVariables = (await addBlockVariables()).$mongodb;

    const suggestions = [
      {
        label: "$mongodb",
        insertText: "$mongodb.",
        kind: "Variable",
        detail: "Access the MongoDB client",
      },
    ];

    Object.entries(blockVariables).forEach(([envName, dbToCollections]) => {
      suggestions.push({
        label: `$mongodb.${envName}`,
        insertText: envName,
        kind: "Variable",
        detail: `The ${envName} env of the MongoDB client`,
      });

      Object.entries(dbToCollections).forEach(([dbName, collections]) => {
        if (/^_/.test(dbName)) return;

        suggestions.push({
          label: `$mongodb.${envName}.${dbName}`,
          insertText: dbName,
          kind: "Variable",
          detail: `The ${dbName} db in ${envName}`,
        });

        Object.entries(collections).forEach(([collectionName, collection]) => {
          if (/^_/.test(collectionName)) return;

          const collectionMethods = Object.getOwnPropertyNames(
            Object.getPrototypeOf(collection)
          )
            .filter((prop) => typeof collection[prop] === "function")
            .filter((prop) => !/^_/.test(prop));

          suggestions.push(
            {
              label: `$mongodb.${envName}.${dbName}.${collectionName}`,
              insertText: collectionName,
              kind: "Variable",
              detail: `The ${collectionName} collection in ${envName}`,
            },
            ...collectionMethods.map((method) => ({
              label: `$mongodb.${envName}.${dbName}.${collectionName}.${method}`,
              insertText: `${method}${
                // if the method takes arguments, add `(`, otherwise add `()`
                collection[method].length ? "(" : "()"
              }`,
              kind: "Function",
              detail: `https://www.mongodb.com/docs/manual/reference/method/db.collection.${method}/`,
            }))
          );
        });
      });
    });

    return suggestions;
  };

  const transformOutputStr = () =>
    (async (initOut) => {
      const classNames = [];
      let currentObj = initOut;

      while (currentObj) {
        const constructorName = currentObj.constructor.name;
        if (constructorName) {
          classNames.push(constructorName);
        }
        currentObj = Object.getPrototypeOf(currentObj);
      }

      const isAbstractCursor = classNames.includes("AbstractCursor");
      if (isAbstractCursor) {
        const arrayToReturn = [];
        while (arrayToReturn.length < 20 && (await initOut.hasNext())) {
          arrayToReturn.push(await initOut.next());
        }
        return arrayToReturn;
      }

      return initOut;
    }).toString();

  (async () => {
    const checkForInit = async () => {
      try {
        await debouncedGetEnvClients();
        utils.setInitState(true);
      } catch {
        utils.setInitState(false);
      } finally {
        setTimeout(checkForInit, 1_000);
      }
    };
    checkForInit();
  })();

  return {
    __init: false,
    addBlockVariables,
    addBlockAutoCompleteSuggestions,
    transformOutputStr,
  };
};
