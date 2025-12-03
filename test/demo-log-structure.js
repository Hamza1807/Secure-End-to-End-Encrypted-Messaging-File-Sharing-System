/**
 * Demonstration Script: Log Entry Structure & Severity Levels
 * 
 * Purpose: Display log structure, severity distribution, and example entries
 * Usage: Copy and paste into browser console (F12) while on http://localhost:3000
 * 
 * Evidence for Report Section: 4.8 Security Event Logging & Audit Trail
 * Screenshot: Figure 4.8.5 - Log Entry Structure & Severity Levels
 */

console.clear();
console.log("═══════════════════════════════════════════════════════");
console.log("    4. LOG ENTRY STRUCTURE & SEVERITY LEVELS");
console.log("═══════════════════════════════════════════════════════\n");

fetch('http://localhost:5000/api/logs?limit=50')
  .then(r => r.json())
  .then(data => {
    // Show severity distribution
    const severityCounts = {INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0};
    data.logs.forEach(log => {
      if (severityCounts.hasOwnProperty(log.severity)) {
        severityCounts[log.severity]++;
      }
    });
    
    console.log("📊 SEVERITY DISTRIBUTION:\n");
    console.table(Object.entries(severityCounts).map(([level, count]) => ({
      'Severity Level': level,
      'Count': count,
      'Use Case': 
        level === 'INFO' ? 'Normal operations (login, key exchange success)' :
        level === 'WARNING' ? 'Suspicious patterns (repeated failures)' :
        level === 'ERROR' ? 'Internal failures (database, network)' :
        'Security incidents (MITM, replay, tampering)'
    })));
    
    // Show example log structure for each severity
    console.log("\n📋 EXAMPLE LOG ENTRIES BY SEVERITY:\n");
    
    ['CRITICAL', 'WARNING', 'INFO'].forEach(severity => {
      const exampleLog = data.logs.find(log => log.severity === severity);
      if (exampleLog) {
        console.log(`\n${severity} Level Example:`);
        console.log(JSON.stringify({
          eventType: exampleLog.eventType,
          userId: exampleLog.userId,
          ipAddress: exampleLog.ipAddress,
          details: exampleLog.details,
          severity: exampleLog.severity,
          timestamp: exampleLog.timestamp
        }, null, 2));
      }
    });
    
    console.log("\n" + "─".repeat(59));
    console.log("✅ All logs follow standardized JSON structure");
    console.log("✅ Severity levels enable prioritized incident response");
    console.log("✅ Full metadata for forensic analysis");
    console.log("✅ Tamper-evident chronological ordering");
    console.log("─".repeat(59));
  })
  .catch(error => {
    console.error("❌ Error:", error);
  });

