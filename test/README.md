# Security Demonstration Scripts

This folder contains demonstration scripts used to generate evidence for the security report.

## Purpose

These scripts are NOT part of the running application. They are standalone demonstration tools used to:
- Generate screenshots for the project report
- Demonstrate security features (logging, attack detection)
- Simulate attacks (MITM, replay) to show defenses work

## Usage

All scripts are designed to be run in the browser console (F12 → Console) while the application is running.

### Prerequisites

1. Server running: `cd server && npm start`
2. Client running: `cd client && npm start`
3. Browser open at: `http://localhost:3000`
4. At least one user logged in

---

## Script Descriptions

### Security Logging Demonstrations

#### 1. `demo-all-logs.js`
**Purpose:** Display overview of all security events  
**Report Section:** 4.8 Security Event Logging & Audit Trail  
**Screenshot:** Figure 4.8.1 - All Log Types Overview

Shows:
- Event type summary (authentication, key exchange, attacks, metadata)
- Recent events table
- Total counts

#### 2. `demo-authentication-logs.js`
**Purpose:** Display authentication-specific events  
**Report Section:** 4.8.1 Authentication Events  
**Screenshot:** Figure 4.8.2 - Authentication Events

Shows:
- User registration attempts
- Login successes/failures
- IP address tracking

#### 3. `demo-keyexchange-logs.js`
**Purpose:** Display key exchange lifecycle events  
**Report Section:** 4.8.2 Key Exchange Events  
**Screenshot:** Figure 4.8.3 - Key Exchange Events

Shows:
- Key exchange initiations
- Key exchange completions
- Failed exchanges (MITM indicators)

#### 4. `demo-security-attacks.js`
**Purpose:** Display detected security attacks  
**Report Section:** 4.8.3 Message Security Events  
**Screenshot:** Figure 4.8.4 - Attack Detection

Shows:
- Replay attacks detected
- Invalid signatures (MITM attempts)
- Message decryption failures
- All marked as CRITICAL severity

#### 5. `demo-log-structure.js`
**Purpose:** Display log structure and severity distribution  
**Report Section:** 4.8.4 Log Entry Structure  
**Screenshot:** Figure 4.8.5 - Log Structure & Severity Levels

Shows:
- Severity distribution (INFO, WARNING, ERROR, CRITICAL)
- Example log entries
- JSON structure

---

### Attack Simulations

#### 6. `demo-mitm-simulation.js`
**Purpose:** Simulate MITM attack by tampering with message  
**Report Section:** 4.9 MITM Attack Demonstration  
**Screenshot:** Shows attack detection

Demonstrates:
- Intercepting encrypted message
- Modifying ciphertext
- Attempting to send with original signature
- Signature verification failure
- Attack blocked

#### 7. `demo-replay-attack.js`
**Purpose:** Simulate replay attack using captured message  
**Report Section:** 6. Replay Attack Protection  
**Screenshot:** Shows replay detection

Demonstrates:
- Capturing legitimate message
- Replaying with same nonce
- Triple detection (nonce, timestamp, sequence)
- Attack blocked

---

## How to Use

### Step 1: Generate Normal Traffic

Before running demo scripts, generate some normal activity:
1. Register 2 users (Alice, Bob)
2. Perform key exchange (Alice selects Bob)
3. Send some messages
4. Upload/download a file

This creates logs to demonstrate.

### Step 2: Run Demo Scripts

1. Open browser console (F12 → Console)
2. Copy entire contents of a demo script
3. Paste into console
4. Press Enter
5. Screenshot the output

### Step 3: Run Attack Simulations

For attack demos:
1. First capture real message data (from Wireshark or Network tab)
2. Update the script with actual values
3. Run the simulation
4. Screenshot the detection/blocking

---

## Example Workflow

### For Logging Evidence:

```bash
# 1. Start application
cd server && npm start
cd client && npm start

# 2. Generate activity (browser)
# - Register users
# - Send messages
# - Perform key exchanges

# 3. Run demo scripts (browser console)
# - Copy demo-all-logs.js
# - Paste in console → Screenshot
# - Copy demo-authentication-logs.js
# - Paste in console → Screenshot
# ... repeat for all demos
```

### For Attack Evidence:

```bash
# 1. Start Wireshark (optional)
# - Capture on loopback
# - Filter: tcp.port == 5000

# 2. Send normal message
# - Bob → Alice: "Test message"

# 3. Copy message data
# - From Wireshark or Network tab
# - Update demo-mitm-simulation.js with real values

# 4. Run simulation
# - Paste in console
# - Screenshot the blocking
```

---

## Automated Test Script

The `automated-tests.js` file runs programmatic tests of the API endpoints. Run with:

```bash
cd test
node automated-tests.js
```

---

## Notes

- These scripts do NOT run automatically
- They are for manual demonstration only
- Replace placeholder values with actual data from your system
- Screenshots should show timestamps to prove they're real
- All attacks should be blocked (if not, there's a bug!)

---

## Report Integration

When adding screenshots to report:

```markdown
### 4.8.1 Authentication Events
[INSERT Screenshot from demo-authentication-logs.js]

**Figure 4.8.2**: Authentication event logs showing user registration 
attempts, successful logins, and failed authentication attempts with 
IP address tracking for security attribution.
```

Each demo script has a comment at the top indicating:
- Report section
- Figure number
- What to caption

---

## Troubleshooting

**Problem:** "No logs found"  
**Solution:** Generate activity first (login, send messages)

**Problem:** Script error  
**Solution:** Make sure server is running and CORS is enabled

**Problem:** No INVALID_SIGNATURE logs  
**Solution:** Run `demo-mitm-simulation.js` first to generate them

---

## Security Note

⚠️ **These attack simulations are for educational purposes only.**

They demonstrate that the system correctly detects and blocks attacks. 
Do not use these techniques against systems you don't own or have 
permission to test.
