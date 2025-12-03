// client/src/crypto/ephemeralKx.js

// --- small helpers ---

function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  
  function base64ToArrayBuffer(b64) {
    const binary = window.atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  // --- ECDH helpers ---
  
  export async function generateEphemeralECDH() {
    return window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveBits"]
    );
  }
  
  export async function exportECDHPublicKeyBase64(publicKey) {
    const raw = await window.crypto.subtle.exportKey("raw", publicKey);
    return bufferToBase64(raw);
  }
  
  export async function importECDHPublicKeyBase64(b64) {
    const raw = base64ToArrayBuffer(b64);
    return window.crypto.subtle.importKey(
      "raw",
      raw,
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      []
    );
  }
  
  // --- HKDF -> AES-256-GCM session key ---
  
  export async function deriveSessionKey(
    ourPrivateKey,
    theirPublicKey,
    { sessionId, from, to, nonceA = "", nonceB = "" }
  ) {
    // 1) ECDH shared secret (256 bits)
    const sharedBits = await window.crypto.subtle.deriveBits(
      {
        name: "ECDH",
        public: theirPublicKey,
      },
      ourPrivateKey,
      256
    );
  
    // 2) HKDF over shared secret
    const hkdfKey = await window.crypto.subtle.importKey(
      "raw",
      sharedBits,
      "HKDF",
      false,
      ["deriveKey"]
    );
  
    const enc = new TextEncoder();
    const salt = await window.crypto.subtle.digest(
      "SHA-256",
      enc.encode(sessionId + "|salt")
    );
  
    const info = enc.encode(`SPSEK-256|${from}|${to}|${nonceA}|${nonceB}`);
  
    const sessionKey = await window.crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt,
        info,
      },
      hkdfKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"]
    );
  
    return sessionKey; // CryptoKey for AES-GCM
  }
  