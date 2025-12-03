# Visual Testing Guide

## 🚀 Quick Start (5 Minutes)

### 1️⃣ Start Everything
```bash
# Terminal 1: MongoDB (if not running)
net start MongoDB  # Windows

# Terminal 2: Backend
cd server && npm start

# Terminal 3: Frontend  
cd client && npm start
```

### 2️⃣ Register Two Users

**Browser 1 (Alice)**:
```
1. Open http://localhost:3000
2. Click "Register"
3. Username: alice
4. Password: password123
5. Click "Register"
✅ Should see chat interface
```

**Browser 2 (Bob)** - Incognito Window:
```
1. Open http://localhost:3000
2. Click "Register"  
3. Username: bob
4. Password: password123
5. Click "Register"
✅ Should see chat interface
```

### 3️⃣ Test Messaging

**From Alice**:
```
1. Click "bob" in user list
2. Wait for "Key exchange completed"
3. Type: "Hello Bob!"
4. Press Enter or Click "Send"
✅ Message sent
```

**From Bob**:
```
1. Click "alice" in user list
2. Wait for key exchange
3. See message from Alice
✅ Message decrypted and displayed
```

### 4️⃣ Verify Encryption

**Check Database**:
```bash
mongosh
use secure_messaging
db.messages.findOne()
```

**What You Should See**:
```json
{
  "ciphertext": "base64_encoded_string...",
  "iv": "base64_encoded_string...",
  "authTag": "base64_encoded_string...",
  "senderId": "...",
  "receiverId": "...",
  "timestamp": "..."
  // NO "message" or "plaintext" field!
}
```

### 5️⃣ Check Security Logs

**In Browser Console**:
```javascript
fetch('http://localhost:5000/api/logs?limit=5')
  .then(r => r.json())
  .then(data => console.table(data.logs))
```

**What You Should See**:
- `AUTH_ATTEMPT` events
- `AUTH_SUCCESS` events  
- `KEY_EXCHANGE_INITIATED` events
- `KEY_EXCHANGE_COMPLETED` events
- `METADATA_ACCESS` events

---

## ✅ Functional Requirements Test Matrix

| # | Requirement | Test | Expected Result |
|---|-------------|------|-----------------|
| 1 | User Auth | Register user | ✅ User created, keys generated |
| 1 | User Auth | Login user | ✅ Login successful |
| 1 | User Auth | Check password hash | ✅ bcrypt hash in DB |
| 2 | Key Generation | Check IndexedDB | ✅ Private keys stored |
| 2 | Key Storage | Check MongoDB | ✅ Only public key, NO private key |
| 3 | Key Exchange | Select user | ✅ Key exchange starts |
| 3 | Key Exchange | Wait for completion | ✅ Session key established |
| 4 | Message Encrypt | Send message | ✅ Encrypted before send |
| 4 | Message Decrypt | Receive message | ✅ Decrypted client-side |
| 4 | Message Storage | Check DB | ✅ Only ciphertext stored |
| 5 | File Encrypt | Upload file | ✅ Encrypted before upload |
| 5 | File Decrypt | Download file | ✅ Decrypted after download |
| 6 | Replay Protection | Send duplicate | ✅ Attack detected |
| 7 | MITM Protection | Run script | ✅ Attack demonstrated |
| 8 | Logging | Check logs API | ✅ All events logged |

---

## 🔍 Detailed Verification Steps

### Verify Requirement 1: Authentication

**Test**:
1. Register → Login → Check logs

**Verify**:
```bash
# Check user in database
mongosh
use secure_messaging
db.users.findOne({username: "alice"})
# ✅ Should have: username, passwordHash, publicKey
# ❌ Should NOT have: password (plaintext), privateKey
```

**Check Logs**:
```bash
curl http://localhost:5000/api/logs?eventType=AUTH_SUCCESS
# ✅ Should show login events
```

### Verify Requirement 2: Key Storage

**Test**:
1. Register user
2. Check IndexedDB
3. Check MongoDB

**Verify IndexedDB** (Browser DevTools):
```
Application > IndexedDB > SecureMessagingDB > keys
✅ Should see: privateKey, publicKey, signingPrivateKey
```

**Verify MongoDB**:
```bash
db.users.findOne({username: "alice"})
# ✅ Should have: publicKey
# ❌ Should NOT have: privateKey field
```

### Verify Requirement 3: Key Exchange

**Test**:
1. Select user
2. Wait for key exchange
3. Check logs

**Verify**:
```bash
curl http://localhost:5000/api/logs?eventType=KEY_EXCHANGE_COMPLETED
# ✅ Should show key exchange events
```

### Verify Requirement 4: Message Encryption

**Test**:
1. Send message
2. Check database

**Verify**:
```bash
db.messages.findOne()
# ✅ Should have: ciphertext, iv, authTag
# ❌ Should NOT have: message, plaintext, content
```

### Verify Requirement 5: File Encryption

**Test**:
1. Upload file
2. Check database

**Verify**:
```bash
db.files.findOne()
# ✅ Should have: encryptedChunks (array)
# ✅ Each chunk: ciphertext, iv, authTag
# ❌ Should NOT have: fileContent, plaintext
```

### Verify Requirement 6: Replay Protection

**Test**:
1. Send message
2. Try to resend same message
3. Check logs

**Verify**:
```bash
curl http://localhost:5000/api/logs/attacks
# ✅ Should show: REPLAY_ATTACK_DETECTED
```

### Verify Requirement 7: MITM Protection

**Test**:
```bash
node scripts/mitm-attacker.js
```

**Verify**:
- ✅ Script runs
- ✅ Shows vulnerable protocol
- ✅ Shows secure protocol

### Verify Requirement 8: Logging

**Test**:
```bash
# Get all logs
curl http://localhost:5000/api/logs

# Get attack logs
curl http://localhost:5000/api/logs/attacks

# Get auth logs
curl http://localhost:5000/api/logs?eventType=AUTH_ATTEMPT
```

**Verify**:
- ✅ All event types logged
- ✅ Logs retrievable
- ✅ Proper severity levels

---

## 🎯 Success Criteria

All requirements pass if:

- ✅ Can register and login users
- ✅ Keys generated and stored securely
- ✅ Key exchange works
- ✅ Messages encrypt/decrypt
- ✅ Files encrypt/decrypt
- ✅ Replay attacks detected
- ✅ MITM attacks prevented
- ✅ All events logged
- ✅ No plaintext anywhere
- ✅ Private keys never on server

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

[ ] Requirement 1: User Authentication - PASS/FAIL
[ ] Requirement 2: Key Generation & Storage - PASS/FAIL
[ ] Requirement 3: Key Exchange Protocol - PASS/FAIL
[ ] Requirement 4: Message Encryption - PASS/FAIL
[ ] Requirement 5: File Encryption - PASS/FAIL
[ ] Requirement 6: Replay Protection - PASS/FAIL
[ ] Requirement 7: MITM Protection - PASS/FAIL
[ ] Requirement 8: Security Logging - PASS/FAIL

Overall: [ ] ALL PASS  [ ] ISSUES FOUND

Notes:
_______________________________________
_______________________________________
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Server won't start | Check MongoDB is running |
| Can't register | Check server is running on port 5000 |
| Keys not generated | Use modern browser (Chrome/Firefox) |
| Key exchange fails | Check browser console for errors |
| Messages not decrypting | Verify key exchange completed |
| Logs not showing | Check MongoDB connection |

---

For complete testing instructions, see `docs/TESTING_GUIDE.md`


