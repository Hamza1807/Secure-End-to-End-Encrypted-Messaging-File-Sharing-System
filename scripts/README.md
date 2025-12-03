# MITM Attack Demonstration Scripts

## Overview
This directory contains scripts for demonstrating Man-in-the-Middle (MITM) attacks against key exchange protocols.

## Files

### `mitm-attacker.js`
A Node.js script that demonstrates:
1. How MITM successfully breaks Diffie-Hellman without signatures
2. How digital signatures prevent MITM attacks

## Usage

### Run the MITM Attack Demonstration

```bash
# From project root
node scripts/mitm-attacker.js
```

### Expected Output

The script will demonstrate:
- **Part 1**: How a vulnerable DH protocol (without signatures) can be broken by MITM
- **Part 2**: How digital signatures prevent MITM attacks

## Using BurpSuite

For a more realistic demonstration using BurpSuite:

1. **Install BurpSuite Community Edition**
   - Download from: https://portswigger.net/burp/communitydownload

2. **Configure BurpSuite Proxy**
   - Start BurpSuite
   - Go to Proxy > Options
   - Ensure proxy is listening on 127.0.0.1:8080

3. **Configure Browser**
   - Set browser proxy to 127.0.0.1:8080
   - Install BurpSuite CA certificate (for HTTPS)

4. **Intercept Key Exchange**
   - Start the application
   - Enable interception in BurpSuite (Proxy > Intercept)
   - Initiate a key exchange between two users
   - Intercept the key exchange messages

5. **Attempt MITM Attack**
   - Modify the public key in the intercepted message
   - Forward the modified message
   - Observe that signature verification fails
   - Check security logs for `INVALID_SIGNATURE` event

## Using Wireshark

For packet-level analysis:

1. **Start Wireshark**
   - Select network interface (e.g., Loopback for localhost)

2. **Set Filter**
   ```
   http.host == localhost && http.port == 5000
   ```

3. **Capture Packets**
   - Start capture
   - Initiate key exchange
   - Stop capture

4. **Analyze Packets**
   - Look for key exchange messages
   - Verify signatures are present
   - Check for any tampering attempts

## Integration with Application

The application automatically logs MITM attack attempts:

```javascript
// Check security logs
GET /api/logs/attacks

// Response includes:
{
  "logs": [
    {
      "eventType": "INVALID_SIGNATURE",
      "severity": "CRITICAL",
      "details": {
        "reason": "Signature verification failed",
        "attackType": "MITM_ATTEMPT"
      }
    }
  ]
}
```

## Security Notes

- These scripts are for **educational purposes only**
- They demonstrate security vulnerabilities and protections
- Do not use these techniques for malicious purposes
- Always use secure protocols with digital signatures in production

