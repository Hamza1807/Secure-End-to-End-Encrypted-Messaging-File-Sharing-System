# Secure End-to-End Encrypted Messaging & File-Sharing System

## Project Summary

This project implements a complete secure messaging system with end-to-end encryption (E2EE) for both text messages and file sharing. The system ensures that messages and files never exist in plaintext outside the sender or receiver device.

## ✅ Completed Features

### 1. User Authentication
- ✅ User registration with username and password
- ✅ Secure password hashing using bcrypt (12 rounds)
- ✅ User login functionality
- ✅ Public key storage on server (private keys never leave client)

### 2. Key Generation & Storage
- ✅ ECC key pair generation (P-256 curve)
- ✅ Separate ECDH keys for key exchange
- ✅ Separate ECDSA keys for digital signatures
- ✅ Secure client-side key storage using IndexedDB
- ✅ Private keys never transmitted to server

### 3. Custom Key Exchange Protocol
- ✅ ECDH-based key exchange
- ✅ Digital signatures (ECDSA) for authentication
- ✅ HKDF for session key derivation
- ✅ Key confirmation mechanism
- ✅ MITM attack prevention

### 4. End-to-End Message Encryption
- ✅ AES-256-GCM encryption
- ✅ Random IV per message
- ✅ Authentication tags (MAC) for integrity
- ✅ Server stores only ciphertext
- ✅ No plaintext on server

### 5. End-to-End Encrypted File Sharing
- ✅ Client-side file encryption
- ✅ Chunked encryption (64KB chunks)
- ✅ Each chunk encrypted with AES-256-GCM
- ✅ Files stored only in encrypted form
- ✅ Client-side decryption

### 6. Replay Attack Protection
- ✅ Nonces for uniqueness
- ✅ Timestamps for freshness
- ✅ Sequence numbers for ordering
- ✅ Replay detection and rejection

### 7. Security Logging
- ✅ Authentication attempt logging
- ✅ Key exchange logging
- ✅ Failed decryption logging
- ✅ Replay attack detection logging
- ✅ Invalid signature logging
- ✅ Metadata access logging

### 8. Real-time Messaging
- ✅ Socket.io integration
- ✅ Real-time message delivery
- ✅ User presence tracking

### 9. Frontend UI
- ✅ Modern React interface
- ✅ User authentication UI
- ✅ Chat interface
- ✅ File sharing interface
- ✅ User selection

### 10. Documentation
- ✅ Key exchange protocol documentation
- ✅ Threat modeling (STRIDE analysis)
- ✅ MITM attack demonstration guide
- ✅ Setup guide

## Technology Stack

### Frontend
- **React.js** with TypeScript
- **Web Crypto API** (SubtleCrypto) for all cryptographic operations
- **IndexedDB** for secure key storage
- **Socket.io Client** for real-time communication
- **Axios** for HTTP requests

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.io** for real-time messaging
- **bcrypt** for password hashing
- **Helmet** for security headers
- **Morgan** for logging

## Security Features

### Cryptographic Algorithms
- **Key Exchange**: ECDH with P-256 curve
- **Digital Signatures**: ECDSA with P-256 curve, SHA-256
- **Key Derivation**: HKDF with SHA-256
- **Encryption**: AES-256-GCM
- **Password Hashing**: bcrypt (12 rounds)

### Security Guarantees
1. **End-to-End Encryption**: Messages encrypted before leaving client
2. **Server Cannot Decrypt**: Server has no access to plaintext
3. **MITM Protection**: Digital signatures prevent man-in-the-middle attacks
4. **Replay Protection**: Nonces, timestamps, and sequence numbers
5. **Key Security**: Private keys stored only client-side

## Project Structure

```
info_Project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context (Auth)
│   │   ├── services/      # API services
│   │   └── utils/         # Crypto utilities
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── index.js           # Server entry point
│   └── package.json
├── docs/                  # Documentation
│   ├── KEY_EXCHANGE_PROTOCOL.md
│   ├── THREAT_MODELING.md
│   ├── MITM_ATTACK_DEMONSTRATION.md
│   └── SETUP_GUIDE.md
└── README.md
```

## Key Implementation Details

### Key Exchange Protocol Flow
1. **Initiation**: Sender sends ECDH public key + signature
2. **Response**: Receiver sends ECDH public key + signature
3. **Derivation**: Both parties derive shared secret using ECDH
4. **Session Key**: HKDF used to derive AES-256-GCM session key
5. **Confirmation**: Optional key confirmation message

### Message Encryption Flow
1. Generate random nonce and IV
2. Encrypt message with AES-256-GCM using session key
3. Sign encrypted message with ECDSA
4. Send ciphertext, IV, auth tag, nonce, sequence number, signature
5. Server stores only encrypted data

### File Encryption Flow
1. Read file in chunks (64KB)
2. Encrypt each chunk with AES-256-GCM
3. Store encrypted chunks on server
4. Receiver downloads and decrypts chunks
5. Reassemble file from decrypted chunks

## Testing & Demonstration

### Attack Demonstrations
- **MITM Attack**: Documented in `docs/MITM_ATTACK_DEMONSTRATION.md`
- **Replay Attack**: Protection implemented and tested
- **Signature Verification**: All messages verified

### Security Analysis
- **STRIDE Threat Modeling**: Complete analysis in `docs/THREAT_MODELING.md`
- **Attack Vectors**: Documented and mitigated
- **Security Logs**: All security events logged

## Requirements Compliance

### ✅ Functional Requirements
- [x] User authentication with secure password storage
- [x] Key generation and secure storage
- [x] Custom key exchange protocol
- [x] End-to-end message encryption
- [x] End-to-end file encryption
- [x] Replay attack protection
- [x] MITM attack demonstration
- [x] Security logging
- [x] Threat modeling

### ✅ Technical Requirements
- [x] React.js frontend
- [x] Web Crypto API for cryptography
- [x] IndexedDB for key storage
- [x] Node.js + Express backend
- [x] MongoDB for metadata
- [x] Socket.io for real-time communication

### ✅ Security Constraints
- [x] AES-GCM only (no CBC, no ECB)
- [x] ECC P-256 curve
- [x] Unpredictable IVs
- [x] Timestamp checks
- [x] Client-side encryption only
- [x] Private keys never leave client

## Future Enhancements

1. **Forward Secrecy**: Implement ephemeral keys
2. **Key Rotation**: Periodic key rotation mechanism
3. **Rate Limiting**: Per-user rate limiting
4. **Two-Factor Authentication**: Add 2FA support
5. **Group Messaging**: Multi-party key exchange
6. **Message Deletion**: Secure message deletion
7. **Perfect Forward Secrecy**: PFS implementation

## Getting Started

See `docs/SETUP_GUIDE.md` for detailed installation and setup instructions.

## Documentation

- **Setup Guide**: `docs/SETUP_GUIDE.md`
- **Key Exchange Protocol**: `docs/KEY_EXCHANGE_PROTOCOL.md`
- **Threat Modeling**: `docs/THREAT_MODELING.md`
- **MITM Attack Demo**: `docs/MITM_ATTACK_DEMONSTRATION.md`

## License

This project is developed for educational purposes as part of the Information Security course.

## Authors

BSSE 7th Semester - Information Security Project

