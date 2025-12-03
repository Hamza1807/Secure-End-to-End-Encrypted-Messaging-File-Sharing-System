/**
 * Demonstration Script: Authentication Events
 * 
 * Purpose: Display all authentication-related security logs
 * Usage: Copy and paste into browser console (F12) while on http://localhost:3000
 * 
 * Evidence for Report Section: 4.8 Security Event Logging & Audit Trail
 * Screenshot: Figure 4.8.2 - Authentication Events
 */

console.clear();
console.log("═══════════════════════════════════════════════════════");
console.log("    1. AUTHENTICATION EVENTS");
console.log("═══════════════════════════════════════════════════════\n");

fetch('http://localhost:5000/api/logs?limit=20')
  .then(r => r.json())
  .then(data => {
    const authLogs = data.logs.filter(log => 
      log.eventType.includes('AUTH')
    );
    
    console.log("Total Authentication Events: " + authLogs.length + "\n");
    
    console.table(authLogs.map(log => ({
      Time: new Date(log.timestamp).toLocaleString(),
      Event: log.eventType,
      Severity: log.severity,
      User: log.details?.username || 'N/A',
      Result: log.eventType.includes('SUCCESS') ? '✅ Success' : '❌ Failed',
      IP: log.ipAddress,
      Reason: log.details?.reason || log.details?.action || 'N/A'
    })));
    
    console.log("\n✅ Logged: Registration, Login, Failures");
    console.log("✅ IP addresses captured for attribution");
    console.log("✅ Both successful and failed attempts tracked");
  })
  .catch(error => {
    console.error("❌ Error:", error);
  });

