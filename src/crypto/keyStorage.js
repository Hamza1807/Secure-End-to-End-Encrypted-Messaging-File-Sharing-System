// client/src/crypto/keyStorage.js

const DB_NAME = "SecureKeysDB";
const DB_VERSION = 1;
const STORE_NAME = "keys";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 🔐 Store IDENTITY private key under a fixed key name
export async function storePrivateKey(privateKey) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(privateKey, "identityPrivateKey");

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// 🔐 Load IDENTITY private key
export async function loadPrivateKey() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get("identityPrivateKey");

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
