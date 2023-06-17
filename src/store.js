const fs = require("fs").promises;
const path = require("path");
const pLimit = require("p-limit");
const { xjwsPath } = require("./common");

const storePath = path.join(xjwsPath, "store");

const storeLimit = pLimit(5);

module.exports.Store = class Store {
  constructor() {
    this._init = false;
    this._store = {};
    this._storeKeyHashes = {};
    this._storeKeyTimeouts = {};
    this._dirtyStoreKeys = new Set();
    this._toDeleteStoreKeys = new Set();
  }

  async init() {
    // only init once
    if (this._init) return;
    this._init = true;

    // create the store path dir if it doesn't exist
    try {
      await fs.mkdir(storePath);
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
    }

    // load the store from disk
    const files = await fs.readdir(storePath);
    const fileLoadInput = files
      .map((fileName) => async () => {
        const filePath = path.join(storePath, fileName);
        const fileContent = await fs.readFile(filePath, "utf-8");

        const storeKey = fileName.replace(/\.json$/, "");
        this._store[storeKey] = JSON.parse(fileContent);
        this._storeKeyHashes[storeKey] = this._hash(fileContent);
      })
      .map((fn) => storeLimit(fn));

    await Promise.all(fileLoadInput);
  }

  get(key) {
    return this._store[key];
  }

  getAllKeys() {
    return Object.keys(this._store);
  }

  set(key, value) {
    this._store[key] = value;
    this._preScheduleSave(key, value);
  }

  delete(key) {
    delete this._store[key];
    this._toDeleteStoreKeys.add(key);
    this._scheduleSave();
  }

  _preScheduleSave(key, value) {
    if (!this._storeKeyTimeouts[key]) {
      this._storeKeyTimeouts[key] = setTimeout(() => {
        delete this._storeKeyTimeouts[key];

        const keyHash = this._hash(value);
        if (keyHash !== this._storeKeyHashes[key]) {
          this._dirtyStoreKeys.add(key);
          this._storeKeyHashes[key] = keyHash;
          this._scheduleSave();
        }
      }, 3_000);
    }
  }

  _scheduleSave() {
    if (!this._saveTimeout) {
      this._saveTimeout = setTimeout(() => {
        delete this._saveTimeout;
        this._save();
      }, 3_000);
    }
  }

  _hash(value) {
    // hash the json blob in a space efficient way
    // https://stackoverflow.com/a/7616484/2715716
    return JSON.stringify(value)
      .split("")
      .reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0)
      .toString(36);
  }

  async _save() {
    const dirtyStoreKeys = [...this._dirtyStoreKeys];
    this._dirtyStoreKeys.clear();

    const fileSaveInput = dirtyStoreKeys
      .map((key) => async () => {
        const keyStorePath = path.join(storePath, `${key}.json`);
        await fs.writeFile(keyStorePath, JSON.stringify(this._store[key]));
      })
      .map((fn) => storeLimit(fn));

    await Promise.all(fileSaveInput);

    const toDeleteStoreKeys = [...this._toDeleteStoreKeys];
    this._toDeleteStoreKeys.clear();

    const fileDeleteInput = toDeleteStoreKeys
      .map((key) => async () => {
        const keyStorePath = path.join(storePath, `${key}.json`);
        await fs.unlink(keyStorePath);
      })
      .map((fn) => storeLimit(fn));

    await Promise.all(fileDeleteInput);
  }
};
