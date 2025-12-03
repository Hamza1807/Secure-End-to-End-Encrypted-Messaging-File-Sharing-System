// client/src/crypto/keyGeneration.js

// Helpers
function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// 🔐 Generate long-term identity keypair (for signatures & verification)
export async function generateIdentityKeyPair() {
  return window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,                 // extractable (for public key)
    ["sign", "verify"]    // usages
  );
}

// 🔐 Export identity public key to Base64 (SPKI)
export async function exportIdentityPublicKeyBase64(publicKey) {
  const spki = await window.crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(spki);
}
