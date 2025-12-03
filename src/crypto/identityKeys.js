// client/src/crypto/identityKeys.js

import axios from "axios";

// 🔒 CRITICAL: Use the EXACT same algorithm parameters for sign and verify
const SIGN_ALGORITHM = {
  name: "ECDSA",
  hash: "SHA-256"
};

function base64ToArrayBuffer(b64) {
  const binary = window.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// 🔒 Canonical representation of KX messages
function canonicalizeKxBody(body) {
  const {
    type,
    from,
    to,
    sessionId,
    ephemeralPubA,
    ephemeralPubB,
    nonceA,
    nonceB,
    seq,
    ts,
  } = body;

  const canonical = [
    type || "",
    from || "",
    to || "",
    sessionId || "",
    ephemeralPubA || "",
    ephemeralPubB || "",
    nonceA || "",
    nonceB || "",
    String(seq ?? ""),
    ts || "",
  ].join("|");

  return canonical;
}

// ▶️ Fetch peer's identity public key from backend
export async function fetchPeerPublicKeyB64(username) {
  const res = await axios.get(
    `http://localhost:4000/api/public-key/${username}`
  );
  return res.data.publicKey; // Base64-encoded SPKI
}

// ▶️ Import identity public key for verification
export async function importIdentityPublicKey(spkiB64) {
  const keyData = base64ToArrayBuffer(spkiB64);
  return window.crypto.subtle.importKey(
    "spki",
    keyData,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["verify"]
  );
}

// ▶️ Sign KX body with identity private key
export async function signBody(privateKey, body) {
  const enc = new TextEncoder();
  const canonical = canonicalizeKxBody(body);
  const data = enc.encode(canonical);

  console.log("[KX] Signing canonical string:", canonical);

  const sig = await window.crypto.subtle.sign(
    SIGN_ALGORITHM,
    privateKey,
    data
  );

  const sigB64 = arrayBufferToBase64(sig);
  console.log("[KX] Signature (b64):", sigB64);
  return sigB64;
}

// ▶️ Verify KX body with peer's identity public key
export async function verifyBody(publicKey, body, signatureB64) {
  const enc = new TextEncoder();
  const canonical = canonicalizeKxBody(body);
  const data = enc.encode(canonical);
  const sigBuf = base64ToArrayBuffer(signatureB64);

  console.log("[KX] Verifying canonical string:", canonical);
  console.log("[KX] Incoming signature (b64):", signatureB64);

  const ok = await window.crypto.subtle.verify(
    SIGN_ALGORITHM,
    publicKey,
    sigBuf,
    data
  );

  console.log("[KX] Signature valid?", ok);
  return ok;
}
