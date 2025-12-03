// client/src/crypto/aesGcm.js

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
  
  export async function encryptJson(sessionKey, obj) {
    const enc = new TextEncoder();
    const plaintext = enc.encode(JSON.stringify(obj));
  
    // 96-bit IV for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      sessionKey,
      plaintext
    );
  
    return {
      ivB64: bufferToBase64(iv.buffer),
      ciphertextB64: bufferToBase64(ciphertext),
    };
  }
  
  export async function decryptJson(sessionKey, ivB64, ciphertextB64) {
    const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
    const ciphertext = base64ToArrayBuffer(ciphertextB64);
  
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      sessionKey,
      ciphertext
    );
  
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  }
  