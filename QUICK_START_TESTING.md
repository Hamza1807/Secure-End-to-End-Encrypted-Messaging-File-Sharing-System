# Quick Start Testing Guide

## Step 1: Start the Application

### Terminal 1: Start MongoDB
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Terminal 2: Start Backend
```bash
cd server
npm install
npm start
```
✅ Should see: `Server running on port 5000`

### Terminal 3: Start Frontend
```bash
cd client
npm install
npm start
```
✅ Browser should open at `http://localhost:3000`

---

## Step 2: Basic Functionality Test

### Test 1: Register Two Users

**User 1 (Alice)**:
1. Click "Register"
2. Username: `alice`
3. Password: `password123`
4. Click "Register"
✅ Should register and show chat interface

**User 2 (Bob)**:
1. Open incognito/private window
2. Go to `http://localhost:3000`
3. Click "Register"
4. Username: `bob`
5. Password: `password123`
6. Click "Register"
✅ Should register successfully

### Test 2: Send Encrypted Message

**From Alice**:
1. Select `bob` from user list
2. Wait for "Key exchange completed" status
3. Type message: `Hello Bob!`
4. Click "Send"
✅ Message should send

**From Bob**:
1. Select `alice` from user list
2. Wait for key exchange
3. Check if message received
✅ Message should appear decrypted

### Test 3: Verify Encryption

**Check Database**:
```bash
mongosh
use secure_messaging
db.messages.findOne()
```

✅ Should show:
- `ciphertext`: base64 string
- `iv`: base64 string
- `authTag`: base64 string
- NO `plaintext` or `message` field

### Test 4: Check Security Logs

**In Browser**:
```javascript
// Open browser console
fetch('http://localhost:5000/api/logs?limit=10')
  .then(r => r.json())
  .then(console.log)
```

✅ Should show:
- `AUTH_ATTEMPT` events
- `AUTH_SUCCESS` events
- `KEY_EXCHANGE_INITIATED` events
- `KEY_EXCHANGE_COMPLETED` events
- `METADATA_ACCESS` events

---

## Step 3: Advanced Testing

### Test Replay Attack Detection

1. Send a message from Alice to Bob
2. Try to send the same message again
3. Check security logs:
```bash
curl http://localhost:5000/api/logs/attacks
```

✅ Should show `REPLAY_ATTACK_DETECTED` if replay attempted

### Test File Sharing

1. Alice selects Bob
2. Go to "Files" tab
3. Upload a test file
4. Bob downloads the file
✅ File should decrypt correctly

### Test MITM Attack Script

```bash
node scripts/mitm-attacker.js
```

✅ Should demonstrate:
- Vulnerable protocol (without signatures)
- Secure protocol (with signatures)

---

## Step 4: Verification Checklist

Quick verification:

- [ ] Two users registered
- [ ] Keys generated (check IndexedDB)
- [ ] Key exchange completed
- [ ] Messages sent and received
- [ ] Messages encrypted in database
- [ ] Files uploaded and downloaded
- [ ] Security logs generated
- [ ] No plaintext in database
- [ ] Private keys NOT on server

---

## Common Issues

### "Cannot connect to server"
- Check server is running on port 5000
- Check MongoDB is running

### "Key exchange failed"
- Ensure both users are registered
- Check browser console for errors

### "Messages not decrypting"
- Verify key exchange completed
- Check session key is established

---

## Success Indicators

✅ All tests pass if:
- Users can register and login
- Messages encrypt/decrypt correctly
- Files encrypt/decrypt correctly
- Security logs are generated
- No plaintext in database
- Private keys only in IndexedDB

For detailed testing, see `docs/TESTING_GUIDE.md`


