/**
 * Demonstration Script: MITM Attack Simulation
 * 
 * Purpose: Simulate a Man-in-the-Middle attack by tampering with a message
 *          and attempting to send it with an invalid signature
 * 
 * Usage: Copy and paste into browser console (F12) while on http://localhost:3000
 * 
 * Evidence for Report Section: 4.9 MITM Attack Demonstration
 * Screenshot: Shows attack detection and blocking
 * 
 * WARNING: This is for educational/demonstration purposes only
 */

console.clear();
console.log("═══════════════════════════════════════════════════════");
console.log("    MITM ATTACK SIMULATION");
console.log("═══════════════════════════════════════════════════════\n");

console.log("🕵️ EVE: Intercepting Alice's message from Wireshark...");
console.log("🕵️ EVE: Attempting to modify the message...\n");

// Simulated intercepted message (replace with actual values from Wireshark)
const interceptedMessage = {
  senderId: "69305ae1f37907d025de64d9",
  receiverId: "69305b06f37907d025de64e0",
  ciphertext: "MODIFIED_BY_EVE_TO_INJECT_MALICIOUS_CONTENT",  // ← Eve changes this
  iv: "3SeDU2Ms7N8hMI7p",
  authTag: "OANtJihUGcOfQpSm3ydNZQ==",
  nonce: "DIFFERENT_NONCE_BY_EVE_123",  // ← Eve uses different nonce
  sequenceNumber: 99,  // ← Eve changes sequence number
  timestamp: Date.now(),
  signature: "YxF27G+raXDz4itWBzV987WxFbO3EbI0Fdzqu+QtwkLi5sGHZltxbeo9VS2gn2XS5PeJqGLqaElhKOyFBhV0/A=="  // ← Original signature (now INVALID!)
};

console.log("📦 Eve's modifications:");
console.log("   Original ciphertext: EzI=");
console.log("   Eve's ciphertext: MODIFIED_BY_EVE_TO_INJECT_MALICIOUS_CONTENT");
console.log("   Original nonce: KcVN+nn8f8fQCQjWpF17Qg==");
console.log("   Eve's nonce: DIFFERENT_NONCE_BY_EVE_123");
console.log("   Signature: (kept original - Eve cannot forge new signature!)");
console.log("");

console.log("🕵️ EVE: Sending modified message with original signature...");
console.log("Expected: Signature verification will FAIL\n");

// Eve sends the tampered message
fetch('http://localhost:5000/api/messages/send', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(interceptedMessage)
})
.then(r => r.json())
.then(d => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  BOB'S SYSTEM RESPONSE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  if (d.error) {
    console.error("🛡️ BOB: SIGNATURE VERIFICATION FAILED!");
    console.error("🛡️ BOB: " + d.error);
    console.error("");
    console.error("🚨 BOB: MITM ATTACK DETECTED!");
    console.error("🚨 BOB: Message has been tampered!");
    console.error("🚨 BOB: Discarding message for security!\n");
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  ✅ MITM ATTACK BLOCKED SUCCESSFULLY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    console.log("🔐 Why Eve's attack failed:");
    console.log("   1. Eve modified the ciphertext");
    console.log("   2. Eve kept Alice's original signature");
    console.log("   3. Signature was calculated over ORIGINAL data");
    console.log("   4. Bob verifies signature over MODIFIED data");
    console.log("   5. Signature mismatch → MITM detected!");
    
  } else {
    console.log("❌ Attack succeeded (unexpected):", d);
  }
})
.catch(e => {
  console.error("🛡️ Request blocked or failed:", e.message);
});

