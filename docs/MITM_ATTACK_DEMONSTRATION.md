# MITM Attack Demonstration

## Overview
This document demonstrates how a Man-in-the-Middle (MITM) attack can be performed against an insecure key exchange protocol, and how our system prevents such attacks using digital signatures.

## Attack Scenario

### Without Digital Signatures (Vulnerable Protocol)

In a basic Diffie-Hellman key exchange without authentication:

1. **Alice** wants to communicate with **Bob**
2. **Alice** sends her public key `A` to **Bob**
3. **Eve (Attacker)** intercepts the communication
4. **Eve** replaces Alice's public key with her own public key `E`
5. **Bob** receives `E` thinking it's from Alice
6. **Bob** sends his public key `B` to Alice
7. **Eve** intercepts and replaces it with her own public key `E`
8. **Alice** receives `E` thinking it's from Bob

**Result**: Eve can now decrypt all messages between Alice and Bob.

### With Digital Signatures (Our Secure Protocol)

Our system prevents MITM attacks by:

1. **Digital Signatures**: All key exchange messages are signed with ECDSA
2. **Public Key Verification**: Receivers verify signatures using the sender's public key
3. **Timestamp Validation**: Messages include timestamps to prevent replay attacks
4. **Key Confirmation**: Final confirmation message ensures both parties have the same session key

## Attack Demonstration Script

### Prerequisites
- Node.js installed
- BurpSuite Community Edition
- Wireshark installed

### Step 1: Setup Attack Environment

```bash
# Install dependencies
npm install

# Start the server
cd server
npm start

# In another terminal, start the client
cd client
npm start
```

### Step 2: Intercept Key Exchange (BurpSuite)

1. Configure BurpSuite as a proxy (default: 127.0.0.1:8080)
2. Configure browser to use BurpSuite proxy
3. Navigate to the application
4. Initiate a key exchange between two users
5. In BurpSuite, intercept the key exchange messages

### Step 3: Attempt MITM Attack

**Without Signatures (Simulated Attack)**:

See `scripts/mitm-attacker.js` for a complete demonstration script.

```bash
# Run the attacker demonstration script
node scripts/mitm-attacker.js
```

The script demonstrates:
1. How MITM successfully breaks DH without signatures
2. How digital signatures prevent MITM attacks

**Key Code Snippet**:
```javascript
// attacker-script.js
// This demonstrates what an attacker would do

const interceptedPublicKey = "attacker_public_key";
const originalPublicKey = "alice_public_key";

// Attacker replaces Alice's public key
function interceptKeyExchange(message) {
  if (message.type === 'KEY_EXCHANGE_INIT') {
    // Replace public key
    message.publicKey = interceptedPublicKey;
    // Remove or forge signature (would fail verification)
    message.signature = forgeSignature(message);
  }
  return message;
}
```

**Expected Result**: Signature verification fails, attack is detected.

### Step 4: Verify Protection

Our system logs the attack attempt:

```javascript
// Server logs show:
{
  eventType: 'INVALID_SIGNATURE',
  userId: 'alice_id',
  details: {
    reason: 'Signature verification failed',
    attackType: 'MITM_ATTEMPT'
  },
  severity: 'CRITICAL'
}
```

## Wireshark Packet Capture

### Capturing Key Exchange Packets

1. Start Wireshark
2. Select network interface
3. Filter: `http.host == localhost && http.port == 5000`
4. Initiate key exchange
5. Observe packets

### What to Look For

**Secure Protocol Indicators**:
- All messages include signature fields
- Timestamps are present
- Sequence numbers increment
- HTTPS encryption (TLS 1.2+)

**Attack Indicators**:
- Modified public keys
- Invalid signatures
- Replayed messages
- Out-of-order sequence numbers

## Attack Prevention Mechanisms

### 1. Digital Signatures (ECDSA)
- **Algorithm**: ECDSA with P-256 curve
- **Hash**: SHA-256
- **Verification**: Every key exchange message is verified

### 2. Public Key Binding
- Public keys are registered during user registration
- Server stores public keys securely
- Clients verify public keys match registered keys

### 3. Timestamp Validation
- Messages include timestamps
- Server rejects messages older than 5 minutes
- Prevents replay of old key exchange messages

### 4. Key Confirmation
- Final confirmation message encrypted with session key
- Both parties verify they have the same key
- Prevents key mismatch attacks

## Testing the Protection

### Test Case 1: Valid Key Exchange
```bash
# User 1 initiates key exchange with User 2
# Expected: Key exchange completes successfully
# Logs show: KEY_EXCHANGE_COMPLETED
```

### Test Case 2: Modified Public Key
```bash
# Attacker modifies public key in transit
# Expected: Signature verification fails
# Logs show: INVALID_SIGNATURE, KEY_EXCHANGE_FAILED
```

### Test Case 3: Replayed Key Exchange
```bash
# Attacker replays old key exchange message
# Expected: Timestamp validation fails
# Logs show: REPLAY_ATTACK_DETECTED
```

## Attack Logs

All attack attempts are logged in the SecurityLog collection:

```javascript
// Example attack log entry
{
  eventType: 'INVALID_SIGNATURE',
  userId: 'user123',
  ipAddress: '192.168.1.100',
  details: {
    messageType: 'KEY_EXCHANGE_INIT',
    reason: 'Signature verification failed',
    publicKeyHash: 'abc123...'
  },
  severity: 'CRITICAL',
  timestamp: '2024-01-15T10:30:00Z'
}
```

## Conclusion

Our system successfully prevents MITM attacks through:
1. **Cryptographic Signatures**: All key exchange messages are signed
2. **Public Key Verification**: Receivers verify signatures before accepting keys
3. **Timestamp Validation**: Prevents replay attacks
4. **Security Logging**: All attack attempts are logged for analysis

The combination of these mechanisms ensures that even if an attacker intercepts the communication, they cannot successfully perform a MITM attack without being detected.

