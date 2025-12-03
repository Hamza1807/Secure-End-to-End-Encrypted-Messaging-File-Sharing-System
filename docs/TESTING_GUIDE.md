# Testing Guide - Functional Requirements Verification

This guide provides step-by-step instructions to test all functional requirements of the Secure E2EE Messaging System.

## Prerequisites

1. **MongoDB Running**
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

2. **Install Dependencies**
   ```bash
   # From project root
   npm run install-all
   ```

3. **Environment Setup**
   - Create `server/.env` (copy from `server/.env.example`)
   - Create `client/.env` (copy from `client/.env.example`)

## Starting the Application

### Terminal 1: Start Backend
```bash
cd server
npm start
```
Expected: `Server running on port 5000`

### Terminal 2: Start Frontend
```bash
cd client
npm start
```
Expected: Browser opens at `http://localhost:3000`

---

## Test 1: User Authentication ✅

### Test 1.1: User Registration

**Steps**:
1. Open browser at `http://localhost:3000`
2. Click "Register"
3. Enter:
   - Username: `alice`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click "Register"

**Expected Results**:
- ✅ User registered successfully
- ✅ Redirected to chat interface
- ✅ Keys generated automatically (check browser console)
- ✅ Keys stored in IndexedDB (check DevTools > Application > IndexedDB)

**Verification**:
```bash
# Check MongoDB
mongosh
use secure_messaging
db.users.findOne({username: "alice"})
# Should show: username, passwordHash, publicKey (NO privateKey)
```

### Test 1.2: User Login

**Steps**:
1. Logout (or open incognito window)
2. Click "Login"
3. Enter:
   - Username: `alice`
   - Password: `password123`
4. Click "Login"

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to chat interface
- ✅ Keys loaded from IndexedDB

**Verification**:
```bash
# Check security logs
GET http://localhost:5000/api/logs?eventType=AUTH_SUCCESS
# Should show login event
```

### Test 1.3: Password Security

**Steps**:
1. Check MongoDB for password storage
2. Verify password is hashed

**Verification**:
```bash
mongosh
use secure_messaging
db.users.findOne({username: "alice"}).passwordHash
# Should show: $2b$12$... (bcrypt hash, NOT plaintext)
```

---

## Test 2: Key Generation & Secure Storage ✅

### Test 2.1: Key Generation on Registration

**Steps**:
1. Register a new user: `bob` / `password123`
2. Open browser DevTools > Console
3. Check for key generation messages

**Expected Results**:
- ✅ Keys generated before registration request
- ✅ ECDH key pair generated (P-256)
- ✅ ECDSA key pair generated (P-256)
- ✅ Public key sent to server
- ✅ Private keys stored in IndexedDB

**Verification**:
```javascript
// In browser console
// Check IndexedDB
// DevTools > Application > IndexedDB > SecureMessagingDB > keys
// Should see: privateKey, publicKey, signingPrivateKey, signingPublicKey
```

### Test 2.2: Private Keys Never on Server

**Steps**:
1. Check server database

**Verification**:
```bash
mongosh
use secure_messaging
db.users.findOne({username: "alice"})
# Should show: publicKey field exists
# Should NOT show: privateKey field (doesn't exist)
```

### Test 2.3: Key Storage in IndexedDB

**Steps**:
1. Open DevTools > Application > IndexedDB
2. Navigate to `SecureMessagingDB` > `keys`
3. Check stored keys

**Expected Results**:
- ✅ Keys stored in IndexedDB
- ✅ Private keys present (client-side only)
- ✅ Keys never transmitted to server

---

## Test 3: Secure Key Exchange Protocol ✅

### Test 3.1: Key Exchange Initiation

**Steps**:
1. Login as `alice`
2. Select user `bob` from sidebar
3. Observe key exchange status

**Expected Results**:
- ✅ Key exchange initiated
- ✅ Status shows "Key exchange initiated"
- ✅ Security log created: `KEY_EXCHANGE_INITIATED`

**Verification**:
```bash
# Check logs
GET http://localhost:5000/api/logs?eventType=KEY_EXCHANGE_INITIATED
```

### Test 3.2: Key Exchange Completion

**Steps**:
1. Wait for key exchange to complete
2. Check status indicator

**Expected Results**:
- ✅ Key exchange completed
- ✅ Status shows "Key exchange completed"
- ✅ Session key established
- ✅ Security log: `KEY_EXCHANGE_COMPLETED`

**Verification**:
```bash
GET http://localhost:5000/api/logs?eventType=KEY_EXCHANGE_COMPLETED
```

### Test 3.3: Signature Verification

**Steps**:
1. Key exchange should complete successfully
2. Check browser console for any errors

**Expected Results**:
- ✅ No signature verification errors
- ✅ All signatures valid

---

## Test 4: End-to-End Message Encryption ✅

### Test 4.1: Send Encrypted Message

**Steps**:
1. Login as `alice`
2. Select `bob` from sidebar
3. Wait for key exchange to complete
4. Type message: `Hello Bob, this is a test message`
5. Click "Send"

**Expected Results**:
- ✅ Message sent successfully
- ✅ Message encrypted before sending
- ✅ Server receives only ciphertext

**Verification**:
```bash
# Check MongoDB
mongosh
use secure_messaging
db.messages.findOne()
# Should show: ciphertext, iv, authTag (NO plaintext)
# Should NOT show: message or content field
```

### Test 4.2: Receive and Decrypt Message

**Steps**:
1. Login as `bob` (in another browser/incognito)
2. Select `alice` from sidebar
3. Wait for key exchange
4. Send a message from `alice` to `bob`
5. Check if `bob` receives the message

**Expected Results**:
- ✅ Message received
- ✅ Message decrypted client-side
- ✅ Plaintext displayed correctly

**Verification**:
- Message should appear in chat
- Should show decrypted text, not ciphertext

### Test 4.3: Verify Encryption (AES-256-GCM)

**Steps**:
1. Check message in database
2. Verify encryption parameters

**Verification**:
```bash
mongosh
use secure_messaging
db.messages.findOne()
# Should show:
# - ciphertext: base64 encoded
# - iv: base64 encoded (12 bytes = 96 bits for GCM)
# - authTag: base64 encoded (16 bytes = 128 bits)
# - NO plaintext
```

---

## Test 5: End-to-End Encrypted File Sharing ✅

### Test 5.1: Upload Encrypted File

**Steps**:
1. Login as `alice`
2. Select `bob` from sidebar
3. Wait for key exchange
4. Click "Files" tab
5. Click "Choose File"
6. Select a test file (e.g., `test.txt`)
7. Click "Upload File"

**Expected Results**:
- ✅ File encrypted before upload
- ✅ File split into chunks (64KB)
- ✅ Each chunk encrypted with AES-256-GCM
- ✅ Upload progress shown
- ✅ File uploaded successfully

**Verification**:
```bash
# Check MongoDB
mongosh
use secure_messaging
db.files.findOne()
# Should show:
# - encryptedChunks: array of encrypted chunks
# - Each chunk: ciphertext, iv, authTag
# - NO plaintext file content
```

### Test 5.2: Download and Decrypt File

**Steps**:
1. Login as `bob`
2. Select `alice` from sidebar
3. Wait for key exchange
4. Go to "Files" tab
5. Find file sent by `alice`
6. Click "Download"

**Expected Results**:
- ✅ File downloaded
- ✅ File decrypted client-side
- ✅ Original file content recovered
- ✅ File opens correctly

**Verification**:
- Downloaded file should match original
- File content should be readable

---

## Test 6: Replay Attack Protection ✅

### Test 6.1: Normal Message Flow

**Steps**:
1. Send multiple messages between `alice` and `bob`
2. Check sequence numbers

**Expected Results**:
- ✅ Messages sent successfully
- ✅ Sequence numbers increment
- ✅ No replay errors

### Test 6.2: Replay Attack Detection

**Steps**:
1. Send a message from `alice` to `bob`
2. Try to resend the same message (with same nonce/sequence)
3. Check security logs

**Expected Results**:
- ✅ Replay attack detected
- ✅ Message rejected
- ✅ Security log: `REPLAY_ATTACK_DETECTED`

**Verification**:
```bash
# Check attack logs
GET http://localhost:5000/api/logs/attacks
# Should show: REPLAY_ATTACK_DETECTED event
```

### Test 6.3: Timestamp Validation

**Steps**:
1. Check message timestamps
2. Verify old messages are rejected

**Expected Results**:
- ✅ Messages include timestamps
- ✅ Old messages rejected (if outside 5-minute window)

---

## Test 7: MITM Attack Demonstration ✅

### Test 7.1: Run Attacker Script

**Steps**:
1. Open terminal
2. Run attacker demonstration script

```bash
node scripts/mitm-attacker.js
```

**Expected Results**:
- ✅ Script demonstrates vulnerable protocol
- ✅ Shows how MITM breaks DH without signatures
- ✅ Shows how signatures prevent MITM

### Test 7.2: Test Signature Verification

**Steps**:
1. Attempt to modify a key exchange message
2. Check if signature verification fails

**Expected Results**:
- ✅ Invalid signature detected
- ✅ Key exchange aborted
- ✅ Security log: `INVALID_SIGNATURE`

**Verification**:
```bash
# Check attack logs
GET http://localhost:5000/api/logs/attacks
# Should show: INVALID_SIGNATURE events
```

### Test 7.3: BurpSuite Demonstration

**Steps**:
1. Configure BurpSuite proxy (127.0.0.1:8080)
2. Configure browser to use proxy
3. Intercept key exchange messages
4. Try to modify public key
5. Forward modified message

**Expected Results**:
- ✅ Signature verification fails
- ✅ Attack detected and logged
- ✅ Key exchange aborted

---

## Test 8: Logging & Security Auditing ✅

### Test 8.1: Authentication Logging

**Steps**:
1. Perform login attempts (successful and failed)
2. Check security logs

**Verification**:
```bash
# Get authentication logs
GET http://localhost:5000/api/logs?eventType=AUTH_ATTEMPT
GET http://localhost:5000/api/logs?eventType=AUTH_SUCCESS
GET http://localhost:5000/api/logs?eventType=AUTH_FAILURE
```

**Expected Results**:
- ✅ All authentication attempts logged
- ✅ Success and failure events logged
- ✅ IP addresses recorded

### Test 8.2: Key Exchange Logging

**Steps**:
1. Initiate key exchange
2. Check logs

**Verification**:
```bash
GET http://localhost:5000/api/logs?eventType=KEY_EXCHANGE_INITIATED
GET http://localhost:5000/api/logs?eventType=KEY_EXCHANGE_COMPLETED
```

**Expected Results**:
- ✅ Key exchange events logged
- ✅ User IDs and receiver IDs recorded

### Test 8.3: Attack Detection Logging

**Steps**:
1. Trigger a replay attack
2. Check attack logs

**Verification**:
```bash
GET http://localhost:5000/api/logs/attacks
```

**Expected Results**:
- ✅ Attack events logged
- ✅ Details include: reason, nonce, sequence number
- ✅ Severity: CRITICAL

### Test 8.4: Metadata Access Logging

**Steps**:
1. Send messages
2. Access conversations
3. Check logs

**Verification**:
```bash
GET http://localhost:5000/api/logs?eventType=METADATA_ACCESS
```

**Expected Results**:
- ✅ Message sends logged
- ✅ Conversation access logged
- ✅ File operations logged

---

## Test 9: Compliance Verification ✅

### Test 9.1: Verify No Forbidden Libraries

**Steps**:
1. Check `package.json` files
2. Verify no forbidden libraries

**Verification**:
```bash
# Check client dependencies
cat client/package.json | grep -i "firebase\|libsodium\|openpgp\|signal\|cryptojs\|node-forge"

# Check server dependencies
cat server/package.json | grep -i "firebase\|libsodium\|openpgp\|signal\|cryptojs\|node-forge"
```

**Expected Results**:
- ✅ No forbidden libraries found
- ✅ Only allowed dependencies

### Test 9.2: Verify Web Crypto API Usage

**Steps**:
1. Check crypto implementation
2. Verify Web Crypto API usage

**Verification**:
```bash
# Search for Web Crypto API usage
grep -r "window.crypto.subtle" client/src
grep -r "crypto.subtle" client/src
```

**Expected Results**:
- ✅ All crypto uses `window.crypto.subtle`
- ✅ No third-party crypto libraries

### Test 9.3: Verify AES-GCM Only

**Steps**:
1. Check encryption implementation

**Verification**:
```bash
grep -r "AES-GCM\|AES-CBC\|AES-ECB" client/src
```

**Expected Results**:
- ✅ Only `AES-GCM` found
- ✅ No CBC or ECB

### Test 9.4: Verify ECC P-256

**Steps**:
1. Check key generation

**Verification**:
```bash
grep -r "P-256\|P-384\|namedCurve" client/src
```

**Expected Results**:
- ✅ Only `P-256` found (NIST curve)
- ✅ No other curves

---

## Complete Test Scenario

### End-to-End Test Flow

1. **Setup**:
   - Start MongoDB
   - Start server
   - Start client

2. **User Registration**:
   - Register `alice`
   - Register `bob`
   - Verify keys generated

3. **Key Exchange**:
   - `alice` selects `bob`
   - Verify key exchange completes
   - Check logs

4. **Messaging**:
   - `alice` sends message to `bob`
   - `bob` receives and decrypts
   - Verify encryption in database

5. **File Sharing**:
   - `alice` uploads file
   - `bob` downloads and decrypts
   - Verify file integrity

6. **Security Testing**:
   - Test replay attack detection
   - Test signature verification
   - Check security logs

7. **Verification**:
   - Check all logs
   - Verify no plaintext in database
   - Verify compliance

---

## Expected Test Results Summary

| Requirement | Test | Expected Result |
|------------|------|----------------|
| Authentication | Registration | ✅ User created, keys generated |
| Authentication | Login | ✅ Login successful, keys loaded |
| Key Generation | On Registration | ✅ Keys generated client-side |
| Key Storage | IndexedDB | ✅ Private keys stored locally |
| Key Exchange | Initiation | ✅ Key exchange starts |
| Key Exchange | Completion | ✅ Session key established |
| Message Encryption | Send | ✅ Message encrypted before send |
| Message Encryption | Receive | ✅ Message decrypted client-side |
| File Encryption | Upload | ✅ File encrypted before upload |
| File Encryption | Download | ✅ File decrypted after download |
| Replay Protection | Detection | ✅ Replay attacks detected |
| MITM Protection | Signature | ✅ Invalid signatures rejected |
| Logging | All Events | ✅ All events logged |

---

## Troubleshooting

### Issue: MongoDB Connection Error
**Solution**: Ensure MongoDB is running
```bash
net start MongoDB  # Windows
sudo systemctl start mongod  # Linux
```

### Issue: Port Already in Use
**Solution**: Change PORT in `server/.env`

### Issue: Keys Not Generated
**Solution**: 
- Check browser console for errors
- Ensure Web Crypto API is supported (modern browser)
- Check IndexedDB permissions

### Issue: Key Exchange Fails
**Solution**:
- Check browser console
- Verify both users are registered
- Check security logs for errors

### Issue: Messages Not Decrypting
**Solution**:
- Verify key exchange completed
- Check session key is established
- Verify correct user selected

---

## Test Checklist

Use this checklist to verify all requirements:

- [ ] User registration works
- [ ] User login works
- [ ] Passwords hashed with bcrypt
- [ ] Keys generated on registration
- [ ] Private keys stored in IndexedDB
- [ ] Private keys NOT on server
- [ ] Key exchange initiates
- [ ] Key exchange completes
- [ ] Session key established
- [ ] Messages encrypt before send
- [ ] Messages decrypt after receive
- [ ] Server stores only ciphertext
- [ ] Files encrypt before upload
- [ ] Files decrypt after download
- [ ] Replay attacks detected
- [ ] Invalid signatures rejected
- [ ] All events logged
- [ ] Logs retrievable via API
- [ ] No forbidden libraries
- [ ] Web Crypto API used
- [ ] AES-GCM only
- [ ] ECC P-256 used
- [ ] IVs are random
- [ ] Timestamps in signatures

---

## Quick Test Script

Save this as `test-quick.sh`:

```bash
#!/bin/bash

echo "=== Quick Test Script ==="

# Test 1: Server Health
echo "1. Testing server health..."
curl http://localhost:5000/api/health

# Test 2: Check logs endpoint
echo -e "\n2. Testing logs endpoint..."
curl http://localhost:5000/api/logs?limit=5

# Test 3: Check attack logs
echo -e "\n3. Testing attack logs..."
curl http://localhost:5000/api/logs/attacks

echo -e "\n=== Tests Complete ==="
```

Run with: `bash test-quick.sh`

---

## Conclusion

Follow this guide to systematically test all functional requirements. Each test verifies a specific requirement and provides evidence of compliance.

For detailed test results, check:
- Browser console for client-side errors
- Server logs for server-side errors
- MongoDB for data verification
- Security logs for audit trail


