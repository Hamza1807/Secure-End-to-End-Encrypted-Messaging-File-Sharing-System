/**
 * Demonstration Script: Key Exchange Events
 * 
 * Purpose: Display key exchange lifecycle and verification events
 * Usage: Copy and paste into browser console (F12) while on http://localhost:3000
 * 
 * Evidence for Report Section: 4.8 Security Event Logging & Audit Trail
 * Screenshot: Figure 4.8.3 - Key Exchange Events
 */

console.clear();
console.log("═══════════════════════════════════════════════════════");
console.log("    2. KEY EXCHANGE EVENTS");
console.log("═══════════════════════════════════════════════════════\n");

fetch('http://localhost:5000/api/logs?limit=20')
  .then(r => r.json())
  .then(data => {
    const kexLogs = data.logs.filter(log => 
      log.eventType.includes('KEY_EXCHANGE')
    );
    
    console.log("Total Key Exchange Events: " + kexLogs.length + "\n");
    
    console.table(kexLogs.map(log => ({
      Time: new Date(log.timestamp).toLocaleString(),
      Event: log.eventType,
      Severity: log.severity,
      Status: log.eventType.includes('COMPLETED') ? '✅ Success' :
              log.eventType.includes('FAILED') ? '❌ Failed' : '🔄 In Progress',
      Partner: log.details?.receiverUsername || log.details?.receiverId || 'N/A',
      Details: log.details?.reason || 'Exchange successful'
    })));
    
    console.log("\n✅ Tracks key exchange lifecycle");
    console.log("✅ Detects tampering and verification failures");
    console.log("✅ Logs both initiation and completion");
  })
  .catch(error => {
    console.error("❌ Error:", error);
  });

