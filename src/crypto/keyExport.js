export async function exportPublicKey(publicKey) {
    const exported = await window.crypto.subtle.exportKey(
      "spki",
      publicKey
    );
  
    const buffer = new Uint8Array(exported);
    let binary = "";
    buffer.forEach(b => binary += String.fromCharCode(b));
    return window.btoa(binary);
  }
  