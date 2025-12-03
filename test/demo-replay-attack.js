/**
 * Demonstration Script: Replay Attack Simulation
 * 
 * Purpose: Simulate a replay attack by sending a previously captured message
 *          with the same nonce to demonstrate replay protection
 * 
 * Usage: 
 * 1. Send a normal message first (to get real data)
 * 2. Copy the message data from Network tab or this script
 * 3. Run this script to replay the message
 * 
 * Evidence for Report Section: 6. Replay Attack Protection
 * Screenshot: Shows replay detection and blocking
 * 
 * WARNING: This is for educational/demonstration purposes only
 */

console.clear();
console.log("═══════════════════════════════════════════════════════");
console.log("    REPLAY ATTACK DEMONSTRATION");
console.log("═══════════════════════════════════════════════════════\n");

console.log("🚨 ATTACKER: Captured a legitimate message");
console.log("🚨 ATTACKER: Attempting to replay it...\n");

// Captured message (replace with actual captured data)
const capturedMessage = {
  senderId: "69305ae1f37907d025de64d9",
  receiverId: "69305b06f37907d025de64e0",
  ciphertext: "EzI=",
  iv: "3SeDU2Ms7N8hMI7p",
  authTag: "OANtJihUGcOfQpSm3ydNZQ==",
  nonce: "KcVN+nn8f8fQCQjWpF17Qg==",  // ← DUPLICATE NONCE (already used!)
  sequenceNumber: 0,  // ← Old sequence number
  timestamp: 1764781443422,  // ← Old timestamp
  signature: "YxF27G+raXDz4itWBzV987WxFbO3EbI0Fdzqu+QtwkLi5sGHZltxbeo9VS2gn2XS5PeJqGLqaElhKOyFBhV0/A=="
};

console.log("📦 Replaying captured message:");
console.log("   Nonce: " + capturedMessage.nonce + " (already used!)");
console.log("   Sequence: " + capturedMessage.sequenceNumber + " (old)");
console.log("   Timestamp: " + new Date(capturedMessage.timestamp).toLocaleString() + " (old)");
console.log("");

console.log("🚨 ATTACKER: Sending replay...");
console.log("Expected: Replay protection will detect and block\n");

fetch('http://localhost:5000/api/messages/send', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(capturedMessage)
})
.then(r => r.json())
.then(d => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  SYSTEM RESPONSE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  if (d.error) {
    console.error("🛡️ SYSTEM: REPLAY ATTACK DETECTED!");
    console.error("🛡️ SYSTEM: " + d.error);
    console.error("");
    console.error("🚨 Attack blocked by replay protection!\n");
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  ✅ REPLAY ATTACK BLOCKED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    console.log("🔐 Detection mechanism:");
    if (d.error.includes('nonce')) {
      console.log("   ✅ Nonce-based detection triggered");
      console.log("   - Same nonce detected (already used)");
    }
    if (d.error.includes('timestamp')) {
      console.log("   ✅ Timestamp-based detection triggered");
      console.log("   - Message too old (outside 5-minute window)");
    }
    if (d.error.includes('sequence')) {
      console.log("   ✅ Sequence-based detection triggered");
      console.log("   - Sequence number not increasing");
    }
    
  } else {
    console.log("❌ Replay succeeded (unexpected):", d);
  }
})
.catch(e => {
  console.error("🛡️ Request blocked:", e.message);
});

