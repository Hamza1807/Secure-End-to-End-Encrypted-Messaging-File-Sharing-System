# Secure E2EE Messaging System

End-to-end encrypted messaging and file sharing system. All encryption happens client-side, ensuring the server never sees plaintext data.

## Quick Start

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Start MongoDB
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### 3. Run Application
```bash
npm run dev
```

Application opens at: `http://localhost:3000`

---

## Features

**End-to-End Encryption** (AES-256-GCM)  
**Secure Key Exchange** (ECDH + ECDSA signatures)  
**Encrypted File Sharing** (chunk-based encryption)  
**Replay Attack Protection** (nonce, timestamp, sequence)  
**MITM Attack Prevention** (digital signatures)  
**Security Logging** (comprehensive audit trail)

---

## Tech Stack

**Frontend:** React.js + TypeScript + Web Crypto API  
**Backend:** Node.js + Express + MongoDB  
**Real-time:** Socket.io  
**Crypto:** ECC P-256 (ECDH/ECDSA) + AES-256-GCM + HKDF-SHA256

---

## Project Structure

```
├── client/          # React frontend (TypeScript)
├── server/          # Node.js backend
├── scripts/         # Attack demonstration scripts
├── test/            # Security demonstration scripts
└── docs/            # Documentation
```

---
## Security

- Private keys stored client-side only (IndexedDB)
- Server is zero-knowledge (stores only ciphertext)
- All messages digitally signed (ECDSA)
- Replay protection using triple-layer defense
- MITM prevention through authenticated key exchange

---

