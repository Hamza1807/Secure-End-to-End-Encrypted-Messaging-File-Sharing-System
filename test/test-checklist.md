# Functional Requirements Test Checklist

Use this checklist to verify all functional requirements are working.

## 1. User Authentication ✅

- [ ] **Registration**
  - [ ] User can register with username and password
  - [ ] Password is hashed (bcrypt)
  - [ ] Keys generated automatically
  - [ ] Registration logged in security logs

- [ ] **Login**
  - [ ] User can login with username and password
  - [ ] Login attempts logged
  - [ ] Successful login logged
  - [ ] Failed login logged

- [ ] **Password Security**
  - [ ] Passwords hashed with bcrypt (12 rounds)
  - [ ] No plaintext passwords in database
  - [ ] Password verification works

**Verification Command**:
```bash
# Check user in database
mongosh
use secure_messaging
db.users.findOne({username: "testuser"})
# Verify: passwordHash exists, NO plaintext password
```

---

## 2. Key Generation & Secure Storage ✅

- [ ] **Key Generation**
  - [ ] Keys generated on registration
  - [ ] ECDH key pair generated (P-256)
  - [ ] ECDSA key pair generated (P-256)
  - [ ] Keys generated client-side

- [ ] **Key Storage**
  - [ ] Private keys stored in IndexedDB
  - [ ] Private keys NOT on server
  - [ ] Only public key sent to server
  - [ ] Keys persist across sessions

**Verification Steps**:
1. Register a user
2. Open DevTools > Application > IndexedDB
3. Check `SecureMessagingDB` > `keys`
4. Verify private keys are stored
5. Check MongoDB - verify NO privateKey field

---

## 3. Secure Key Exchange Protocol ✅

- [ ] **Key Exchange Initiation**
  - [ ] Key exchange starts when user selected
  - [ ] Initiation logged: `KEY_EXCHANGE_INITIATED`
  - [ ] Public key sent with signature

- [ ] **Key Exchange Response**
  - [ ] Response received and verified
  - [ ] Signature verified
  - [ ] Timestamp validated

- [ ] **Session Key Derivation**
  - [ ] Shared secret derived (ECDH)
  - [ ] Session key derived (HKDF)
  - [ ] Key exchange completed: `KEY_EXCHANGE_COMPLETED`

- [ ] **Key Confirmation**
  - [ ] Key confirmation message sent
  - [ ] Confirmation verified

**Verification**:
```bash
# Check key exchange logs
GET http://localhost:5000/api/logs?eventType=KEY_EXCHANGE_INITIATED
GET http://localhost:5000/api/logs?eventType=KEY_EXCHANGE_COMPLETED
```

---

## 4. End-to-End Message Encryption ✅

- [ ] **Message Encryption**
  - [ ] Messages encrypted before sending
  - [ ] AES-256-GCM used
  - [ ] Random IV per message
  - [ ] Authentication tag included

- [ ] **Server Storage**
  - [ ] Server stores only ciphertext
  - [ ] Server stores IV and authTag
  - [ ] NO plaintext in database

- [ ] **Message Decryption**
  - [ ] Messages decrypted client-side
  - [ ] Decryption successful
  - [ ] Plaintext displayed correctly

**Verification**:
```bash
# Check message in database
mongosh
use secure_messaging
db.messages.findOne()
# Verify: ciphertext, iv, authTag exist
# Verify: NO plaintext or message field
```

---

## 5. End-to-End Encrypted File Sharing ✅

- [ ] **File Encryption**
  - [ ] Files encrypted before upload
  - [ ] Files split into chunks (64KB)
  - [ ] Each chunk encrypted with AES-256-GCM
  - [ ] Random IV per chunk

- [ ] **Server Storage**
  - [ ] Server stores only encrypted chunks
  - [ ] NO plaintext file content

- [ ] **File Decryption**
  - [ ] Files decrypted client-side
  - [ ] Chunks reassembled correctly
  - [ ] Original file recovered

**Verification**:
```bash
# Check file in database
mongosh
use secure_messaging
db.files.findOne()
# Verify: encryptedChunks array
# Verify: Each chunk has ciphertext, iv, authTag
# Verify: NO plaintext file content
```

---

## 6. Replay Attack Protection ✅

- [ ] **Nonce Generation**
  - [ ] Unique nonce per message
  - [ ] Nonces are random
  - [ ] Nonces stored for verification

- [ ] **Sequence Numbers**
  - [ ] Sequence numbers increment
  - [ ] Sequence numbers tracked per user

- [ ] **Timestamp Validation**
  - [ ] Timestamps included in messages
  - [ ] Old messages rejected
  - [ ] Timestamp tolerance: 5 minutes

- [ ] **Replay Detection**
  - [ ] Duplicate nonces detected
  - [ ] Replay attacks logged: `REPLAY_ATTACK_DETECTED`
  - [ ] Replayed messages rejected

**Test Replay Attack**:
1. Send a message
2. Try to resend same message (same nonce)
3. Verify attack detected and logged

---

## 7. MITM Attack Demonstration ✅

- [ ] **Attacker Script**
  - [ ] Script runs: `node scripts/mitm-attacker.js`
  - [ ] Shows vulnerable protocol
  - [ ] Shows secure protocol

- [ ] **Signature Verification**
  - [ ] Invalid signatures detected
  - [ ] Attacks logged: `INVALID_SIGNATURE`
  - [ ] Key exchange aborted on invalid signature

- [ ] **BurpSuite Test**
  - [ ] Can intercept messages
  - [ ] Modified signatures fail verification
  - [ ] Attacks logged

**Verification**:
```bash
# Run attacker script
node scripts/mitm-attacker.js

# Check attack logs
GET http://localhost:5000/api/logs/attacks
```

---

## 8. Logging & Security Auditing ✅

- [ ] **Authentication Logging**
  - [ ] `AUTH_ATTEMPT` logged
  - [ ] `AUTH_SUCCESS` logged
  - [ ] `AUTH_FAILURE` logged

- [ ] **Key Exchange Logging**
  - [ ] `KEY_EXCHANGE_INITIATED` logged
  - [ ] `KEY_EXCHANGE_COMPLETED` logged
  - [ ] `KEY_EXCHANGE_FAILED` logged

- [ ] **Attack Detection Logging**
  - [ ] `REPLAY_ATTACK_DETECTED` logged
  - [ ] `INVALID_SIGNATURE` logged
  - [ ] `MESSAGE_DECRYPTION_FAILED` logged

- [ ] **Metadata Access Logging**
  - [ ] `METADATA_ACCESS` logged
  - [ ] File operations logged

- [ ] **Log Retrieval**
  - [ ] Can get all logs: `GET /api/logs`
  - [ ] Can filter by event type
  - [ ] Can get attack logs: `GET /api/logs/attacks`
  - [ ] Can get user logs: `GET /api/logs/user/:userId`

**Verification**:
```bash
# Test all log endpoints
curl http://localhost:5000/api/logs
curl http://localhost:5000/api/logs?eventType=AUTH_ATTEMPT
curl http://localhost:5000/api/logs/attacks
curl http://localhost:5000/api/logs/user/USER_ID
```

---

## 9. Compliance Verification ✅

- [ ] **Forbidden Technologies**
  - [ ] No Firebase
  - [ ] No third-party E2EE libraries
  - [ ] No CryptoJS/NodeForge
  - [ ] No copied apps
  - [ ] No crypto templates

- [ ] **Allowed Crypto Sources**
  - [ ] Web Crypto API used (client-side)
  - [ ] Node crypto module (optional, not used)
  - [ ] Custom implementations

- [ ] **Development Constraints**
  - [ ] All encryption client-side
  - [ ] Private keys never leave client
  - [ ] No plaintext logged/stored/transmitted
  - [ ] 70%+ custom crypto logic
  - [ ] HTTPS in production (HTTP for dev OK)

- [ ] **Security Constraints**
  - [ ] AES-GCM only (no CBC/ECB)
  - [ ] ECC P-256 (NIST curve)
  - [ ] Random IVs (getRandomValues)
  - [ ] Timestamp checks in signatures

---

## Quick Verification Commands

### Check Database
```bash
mongosh
use secure_messaging

# Check users (should have publicKey, NO privateKey)
db.users.find().pretty()

# Check messages (should have ciphertext, NO plaintext)
db.messages.find().pretty()

# Check files (should have encryptedChunks, NO plaintext)
db.files.find().pretty()

# Check security logs
db.securitylogs.find().sort({timestamp: -1}).limit(10).pretty()
```

### Check API Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Get all logs
curl http://localhost:5000/api/logs?limit=10

# Get attack logs
curl http://localhost:5000/api/logs/attacks

# Get authentication logs
curl http://localhost:5000/api/logs?eventType=AUTH_ATTEMPT
```

### Check Browser
1. Open DevTools > Console
2. Check for errors
3. Open DevTools > Application > IndexedDB
4. Verify keys stored
5. Open DevTools > Network
6. Verify encrypted data sent (ciphertext, not plaintext)

---

## Test Results Template

```
Test Date: ___________
Tester: ___________

Requirement 1: User Authentication
[ ] Pass  [ ] Fail  Notes: ___________

Requirement 2: Key Generation & Storage
[ ] Pass  [ ] Fail  Notes: ___________

Requirement 3: Key Exchange Protocol
[ ] Pass  [ ] Fail  Notes: ___________

Requirement 4: Message Encryption
[ ] Pass  [ ] Fail  Notes: ___________

Requirement 5: File Encryption
[ ] Pass  [ ] Fail  Notes: ___________

Requirement 6: Replay Protection
[ ] Pass  [ ] Fail  Notes: ___________

Requirement 7: MITM Protection
[ ] Pass  [ ] Fail  Notes: ___________

Requirement 8: Security Logging
[ ] Pass  [ ] Fail  Notes: ___________

Requirement 9: Compliance
[ ] Pass  [ ] Fail  Notes: ___________

Overall: [ ] All Pass  [ ] Issues Found
```

---

## Common Issues & Solutions

### Issue: Keys Not Generated
- **Check**: Browser console for errors
- **Solution**: Use modern browser (Chrome, Firefox, Edge)
- **Verify**: Web Crypto API supported

### Issue: Key Exchange Fails
- **Check**: Security logs for errors
- **Solution**: Ensure both users registered
- **Verify**: Public keys in database

### Issue: Messages Not Decrypting
- **Check**: Key exchange completed
- **Solution**: Re-select user to restart key exchange
- **Verify**: Session key established

### Issue: Replay Attack Not Detected
- **Check**: Replay protection implementation
- **Solution**: Verify nonces and sequence numbers
- **Test**: Try sending duplicate message

---

## Success Criteria

All tests pass if:
- ✅ All 8 functional requirements work
- ✅ All security constraints followed
- ✅ All forbidden technologies avoided
- ✅ All logs generated correctly
- ✅ No plaintext in database
- ✅ Private keys never on server
- ✅ Encryption works end-to-end


