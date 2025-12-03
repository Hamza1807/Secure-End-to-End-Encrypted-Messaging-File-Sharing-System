# Key Exchange Protocol Documentation

## Overview
This document describes the custom key exchange protocol implemented in the Secure E2EE Messaging System.

## Protocol Design

### Cryptographic Primitives
- **Key Agreement**: Elliptic Curve Diffie-Hellman (ECDH) with P-256 curve
- **Digital Signatures**: Elliptic Curve Digital Signature Algorithm (ECDSA) with P-256 curve
- **Key Derivation**: HKDF (HMAC-based Key Derivation Function) with SHA-256
- **Session Encryption**: AES-256-GCM

## Protocol Flow

### Phase 1: Key Exchange Initiation

```
Alice (Sender)                          Bob (Receiver)
    |                                       |
    |--[1] KEY_EXCHANGE_INIT--------------->|
    |   - Alice's ECDH Public Key           |
    |   - Timestamp                          |
    |   - ECDSA Signature                    |
    |                                       |
```

**Message Structure**:
```typescript
{
  type: 'KEY_EXCHANGE_INIT',
  senderId: 'alice_id',
  receiverId: 'bob_id',
  publicKey: 'base64_encoded_ecdh_public_key',
  timestamp: 1234567890,
  signature: 'base64_encoded_ecdsa_signature'
}
```

**Signature Calculation**:
```
messageToSign = publicKey + ":" + timestamp + ":" + receiverId
signature = ECDSA_Sign(messageToSign, alice_signing_private_key)
```

### Phase 2: Key Exchange Response

```
Alice                                    Bob
    |                                       |
    |<--[2] KEY_EXCHANGE_RESPONSE-----------|
    |   - Bob's ECDH Public Key             |
    |   - Timestamp                         |
    |   - ECDSA Signature                   |
    |                                       |
```

**Message Structure**:
```typescript
{
  type: 'KEY_EXCHANGE_RESPONSE',
  senderId: 'bob_id',
  receiverId: 'alice_id',
  publicKey: 'base64_encoded_ecdh_public_key',
  timestamp: 1234567891,
  signature: 'base64_encoded_ecdsa_signature'
}
```

**Bob's Actions**:
1. Verify Alice's signature from Phase 1
2. Check timestamp (within 5-minute window)
3. Derive shared secret: `ECDH_Derive(alice_public_key, bob_private_key)`
4. Generate response with signature

**Alice's Actions**:
1. Verify Bob's signature
2. Check timestamp
3. Derive shared secret: `ECDH_Derive(bob_public_key, alice_private_key)`

### Phase 3: Session Key Derivation

Both parties now have the same shared secret. They derive the session key using HKDF:

```
sharedSecret = ECDH_Derive(partner_public_key, own_private_key)
salt = "SecureMessagingSessionKey" (UTF-8 encoded)
info = "SessionKey:" + partner_id + ":" + timestamp (UTF-8 encoded)
sessionKey = HKDF(sharedSecret, salt, info, AES-256-GCM)
```

### Phase 4: Key Confirmation (Optional but Recommended)

```
Alice                                    Bob
    |                                       |
    |--[3] KEY_CONFIRMATION---------------->|
    |   - Encrypted confirmation message    |
    |   - Timestamp                         |
    |   - ECDSA Signature                   |
    |                                       |
    |<--[4] KEY_CONFIRMATION_ACK------------|
    |                                       |
```

**Confirmation Message**:
```typescript
{
  type: 'KEY_CONFIRMATION',
  senderId: 'alice_id',
  receiverId: 'bob_id',
  encryptedSessionKey: 'aes_gcm_encrypted_confirmation',
  timestamp: 1234567892,
  signature: 'base64_encoded_ecdsa_signature'
}
```

**Confirmation Content**:
```
confirmationMessage = "KEY_CONFIRMED:" + timestamp + ":" + receiverId
encryptedConfirmation = AES_GCM_Encrypt(confirmationMessage, sessionKey)
```

## Security Properties

### 1. Authentication
- **Mechanism**: ECDSA digital signatures
- **Protection**: Prevents MITM attacks
- **Verification**: All messages verified before processing

### 2. Integrity
- **Mechanism**: Digital signatures + authenticated encryption
- **Protection**: Detects tampering
- **Verification**: Signature verification on every message

### 3. Freshness
- **Mechanism**: Timestamps
- **Protection**: Prevents replay attacks
- **Window**: 5-minute tolerance

### 4. Forward Secrecy
- **Status**: ⚠️ Not implemented (session keys are persistent)
- **Future Enhancement**: Implement ephemeral keys for PFS

## Message Sequence Diagram

```
Alice                Server                Bob
  |                    |                    |
  |--[Init]----------->|                    |
  |                    |--[Init]----------->|
  |                    |<--[Response]--------|
  |<--[Response]-------|                    |
  |                    |                    |
  |--[Confirm]-------->|                    |
  |                    |--[Confirm]-------->|
  |                    |<--[Confirm ACK]----|
  |<--[Confirm ACK]----|                    |
  |                    |                    |
  |======== Session Established ===========|
  |                    |                    |
  |--[Encrypted Msg]-->|                    |
  |                    |--[Encrypted Msg]-->|
  |                    |                    |
```

## Implementation Details

### Key Generation
```typescript
// Generate ECDH key pair for key exchange
const ecdhKeyPair = await crypto.subtle.generateKey(
  {
    name: 'ECDH',
    namedCurve: 'P-256'
  },
  true,
  ['deriveKey', 'deriveBits']
);

// Generate ECDSA key pair for signing
const signingKeyPair = await crypto.subtle.generateKey(
  {
    name: 'ECDSA',
    namedCurve: 'P-256'
  },
  true,
  ['sign', 'verify']
);
```

### Shared Secret Derivation
```typescript
const sharedSecret = await crypto.subtle.deriveBits(
  {
    name: 'ECDH',
    public: partnerPublicKey
  },
  ownPrivateKey,
  256 // 256 bits
);
```

### Session Key Derivation (HKDF)
```typescript
// Import shared secret as HKDF key
const baseKey = await crypto.subtle.importKey(
  'raw',
  sharedSecret,
  'HKDF',
  false,
  ['deriveKey']
);

// Derive AES-GCM key
const sessionKey = await crypto.subtle.deriveKey(
  {
    name: 'HKDF',
    hash: 'SHA-256',
    salt: saltBytes,
    info: infoBytes
  },
  baseKey,
  {
    name: 'AES-GCM',
    length: 256
  },
  false,
  ['encrypt', 'decrypt']
);
```

## Attack Resistance

### MITM Attack Prevention
1. **Digital Signatures**: All messages signed with ECDSA
2. **Public Key Verification**: Receivers verify signatures using registered public keys
3. **Key Confirmation**: Final confirmation ensures both parties have same key

### Replay Attack Prevention
1. **Timestamps**: Messages include timestamps
2. **Nonces**: Unique nonces for each message
3. **Sequence Numbers**: Prevent message reordering

### Key Compromise
- **Private Keys**: Never transmitted, stored only client-side
- **Session Keys**: Derived per conversation, not stored long-term
- **Forward Secrecy**: ⚠️ Not implemented (future enhancement)

## Protocol Variants

This implementation uses a **3-phase protocol**:
1. Initiation (with signature)
2. Response (with signature)
3. Confirmation (optional)

**Alternative variants** (for different groups):
- 2-phase protocol (without confirmation)
- 4-phase protocol (with explicit ACK)
- Group key exchange (for multi-party)

## Testing

### Test Cases

1. **Valid Key Exchange**
   - Both parties complete key exchange
   - Session key derived successfully
   - Messages encrypted/decrypted correctly

2. **Signature Verification Failure**
   - Modified signature detected
   - Key exchange aborted
   - Security log created

3. **Timestamp Validation**
   - Old messages rejected
   - Future-dated messages rejected
   - Only recent messages accepted

4. **MITM Attack Simulation**
   - Attacker modifies public key
   - Signature verification fails
   - Attack logged and prevented

## Conclusion

The key exchange protocol provides:
- ✅ Strong authentication through digital signatures
- ✅ Integrity protection through signatures and MAC
- ✅ Replay attack prevention through timestamps and nonces
- ✅ MITM attack resistance through signature verification
- ⚠️ Forward secrecy not implemented (future enhancement)

The protocol is secure against common attacks while maintaining efficiency and usability.

