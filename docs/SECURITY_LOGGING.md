# Security Logging & Auditing

## Overview
This document describes the security logging and auditing system implemented in the Secure E2EE Messaging System. All security events are logged to the database and can be retrieved via API endpoints.

## Logged Events

### 1. Authentication Attempts

**Event Types**:
- `AUTH_ATTEMPT` - User attempts to login
- `AUTH_SUCCESS` - Successful authentication (login or registration)
- `AUTH_FAILURE` - Failed authentication attempt

**Implementation**: `server/routes/auth.js`

**Example Logs**:
```javascript
// Authentication attempt
{
  eventType: 'AUTH_ATTEMPT',
  userId: null,
  ipAddress: '192.168.1.100',
  details: { username: 'alice' },
  severity: 'INFO',
  timestamp: '2024-01-15T10:30:00Z'
}

// Successful login
{
  eventType: 'AUTH_SUCCESS',
  userId: ObjectId('...'),
  ipAddress: '192.168.1.100',
  details: { action: 'Login' },
  severity: 'INFO',
  timestamp: '2024-01-15T10:30:15Z'
}

// Failed login
{
  eventType: 'AUTH_FAILURE',
  userId: ObjectId('...'),
  ipAddress: '192.168.1.100',
  details: { reason: 'Invalid password' },
  severity: 'WARNING',
  timestamp: '2024-01-15T10:30:20Z'
}
```

### 2. Key Exchange Attempts

**Event Types**:
- `KEY_EXCHANGE_INITIATED` - Key exchange process started
- `KEY_EXCHANGE_COMPLETED` - Key exchange successfully completed
- `KEY_EXCHANGE_FAILED` - Key exchange failed (e.g., invalid signature)

**Implementation**: Should be logged when key exchange occurs (can be added to key exchange protocol)

**Example Logs**:
```javascript
// Key exchange initiated
{
  eventType: 'KEY_EXCHANGE_INITIATED',
  userId: ObjectId('alice_id'),
  ipAddress: '192.168.1.100',
  details: {
    receiverId: 'bob_id',
    messageType: 'KEY_EXCHANGE_INIT'
  },
  severity: 'INFO',
  timestamp: '2024-01-15T10:35:00Z'
}

// Key exchange completed
{
  eventType: 'KEY_EXCHANGE_COMPLETED',
  userId: ObjectId('alice_id'),
  ipAddress: '192.168.1.100',
  details: {
    receiverId: 'bob_id',
    sessionKeyEstablished: true
  },
  severity: 'INFO',
  timestamp: '2024-01-15T10:35:05Z'
}

// Key exchange failed
{
  eventType: 'KEY_EXCHANGE_FAILED',
  userId: ObjectId('alice_id'),
  ipAddress: '192.168.1.100',
  details: {
    receiverId: 'bob_id',
    reason: 'Invalid signature',
    messageType: 'KEY_EXCHANGE_RESPONSE'
  },
  severity: 'CRITICAL',
  timestamp: '2024-01-15T10:35:10Z'
}
```

### 3. Failed Message Decryptions

**Event Type**: `MESSAGE_DECRYPTION_FAILED`

**Implementation**: Should be logged when decryption fails (can be added to client-side decryption)

**Example Log**:
```javascript
{
  eventType: 'MESSAGE_DECRYPTION_FAILED',
  userId: ObjectId('bob_id'),
  ipAddress: '192.168.1.101',
  details: {
    messageId: ObjectId('...'),
    senderId: 'alice_id',
    reason: 'Invalid ciphertext or key',
    error: 'Decryption failed: Invalid ciphertext or key'
  },
  severity: 'ERROR',
  timestamp: '2024-01-15T10:40:00Z'
}
```

### 4. Detected Replay Attacks

**Event Type**: `REPLAY_ATTACK_DETECTED`

**Implementation**: Should be logged when replay attack is detected (can be added to replay protection)

**Example Log**:
```javascript
{
  eventType: 'REPLAY_ATTACK_DETECTED',
  userId: ObjectId('bob_id'),
  ipAddress: '192.168.1.101',
  details: {
    messageId: ObjectId('...'),
    senderId: 'alice_id',
    reason: 'Duplicate nonce detected (replay attack)',
    nonce: 'abc123...',
    sequenceNumber: 5,
    previousSequenceNumber: 6
  },
  severity: 'CRITICAL',
  timestamp: '2024-01-15T10:45:00Z'
}
```

### 5. Invalid Signatures

**Event Type**: `INVALID_SIGNATURE`

**Implementation**: Should be logged when signature verification fails

**Example Log**:
```javascript
{
  eventType: 'INVALID_SIGNATURE',
  userId: ObjectId('bob_id'),
  ipAddress: '192.168.1.101',
  details: {
    messageType: 'KEY_EXCHANGE_INIT',
    senderId: 'alice_id',
    reason: 'Signature verification failed',
    publicKeyHash: 'abc123...',
    attackType: 'MITM_ATTEMPT'
  },
  severity: 'CRITICAL',
  timestamp: '2024-01-15T10:50:00Z'
}
```

### 6. Server-Side Metadata Access

**Event Type**: `METADATA_ACCESS`

**Implementation**: `server/routes/messages.js` and `server/routes/files.js`

**Example Logs**:
```javascript
// Message sent
{
  eventType: 'METADATA_ACCESS',
  userId: ObjectId('alice_id'),
  ipAddress: '192.168.1.100',
  details: {
    action: 'Message sent',
    messageId: ObjectId('...'),
    receiverId: 'bob_id'
  },
  severity: 'INFO',
  timestamp: '2024-01-15T11:00:00Z'
}

// Conversation accessed
{
  eventType: 'METADATA_ACCESS',
  userId: ObjectId('alice_id'),
  ipAddress: '192.168.1.100',
  details: {
    action: 'Conversation accessed',
    otherUserId: 'bob_id',
    messageCount: 15
  },
  severity: 'INFO',
  timestamp: '2024-01-15T11:05:00Z'
}

// File uploaded
{
  eventType: 'FILE_UPLOAD',
  userId: ObjectId('alice_id'),
  ipAddress: '192.168.1.100',
  details: {
    fileId: ObjectId('...'),
    fileName: 'document.pdf',
    fileSize: 1024000,
    receiverId: 'bob_id'
  },
  severity: 'INFO',
  timestamp: '2024-01-15T11:10:00Z'
}

// File downloaded
{
  eventType: 'FILE_DOWNLOAD',
  userId: ObjectId('bob_id'),
  ipAddress: '192.168.1.101',
  details: {
    fileId: ObjectId('...'),
    fileName: 'document.pdf'
  },
  severity: 'INFO',
  timestamp: '2024-01-15T11:15:00Z'
}
```

## API Endpoints

### Get All Logs
```http
GET /api/logs?page=1&limit=50&eventType=AUTH_ATTEMPT&severity=WARNING
```

**Query Parameters**:
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)
- `eventType` - Filter by event type
- `userId` - Filter by user ID
- `severity` - Filter by severity (INFO, WARNING, ERROR, CRITICAL)
- `startDate` - Filter by start date
- `endDate` - Filter by end date

**Response**:
```json
{
  "logs": [
    {
      "_id": "...",
      "eventType": "AUTH_ATTEMPT",
      "userId": { "_id": "...", "username": "alice" },
      "ipAddress": "192.168.1.100",
      "details": { "username": "alice" },
      "severity": "INFO",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### Get User Logs
```http
GET /api/logs/user/:userId
```

**Response**: Array of logs for the specified user

### Get Attack Logs
```http
GET /api/logs/attacks
```

**Response**: Array of attack-related logs (REPLAY_ATTACK_DETECTED, INVALID_SIGNATURE, MESSAGE_DECRYPTION_FAILED, KEY_EXCHANGE_FAILED)

## Database Schema

**Collection**: `securitylogs`

**Schema**:
```javascript
{
  eventType: String (enum: [
    'AUTH_ATTEMPT',
    'AUTH_SUCCESS',
    'AUTH_FAILURE',
    'KEY_EXCHANGE_INITIATED',
    'KEY_EXCHANGE_COMPLETED',
    'KEY_EXCHANGE_FAILED',
    'MESSAGE_DECRYPTION_FAILED',
    'REPLAY_ATTACK_DETECTED',
    'INVALID_SIGNATURE',
    'METADATA_ACCESS',
    'FILE_UPLOAD',
    'FILE_DOWNLOAD'
  ]),
  userId: ObjectId (ref: 'User'),
  ipAddress: String,
  details: Mixed (JSON object),
  severity: String (enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL']),
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ timestamp: -1, eventType: 1 }` - For efficient querying by time and type
- `{ userId: 1, timestamp: -1 }` - For efficient querying by user
- `{ eventType: 1 }` - For filtering by event type
- `{ severity: 1 }` - For filtering by severity

## Example Log Queries

### Get all authentication failures
```javascript
db.securitylogs.find({
  eventType: 'AUTH_FAILURE'
}).sort({ timestamp: -1 })
```

### Get all critical security events
```javascript
db.securitylogs.find({
  severity: 'CRITICAL'
}).sort({ timestamp: -1 })
```

### Get attack attempts in last 24 hours
```javascript
db.securitylogs.find({
  eventType: {
    $in: ['REPLAY_ATTACK_DETECTED', 'INVALID_SIGNATURE', 'MESSAGE_DECRYPTION_FAILED']
  },
  timestamp: {
    $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
}).sort({ timestamp: -1 })
```

### Get user activity log
```javascript
db.securitylogs.find({
  userId: ObjectId('user_id')
}).sort({ timestamp: -1 }).limit(100)
```

## Log Analysis

### Security Metrics

1. **Failed Authentication Rate**
   - Count of `AUTH_FAILURE` events
   - Indicates potential brute force attacks

2. **Key Exchange Failure Rate**
   - Count of `KEY_EXCHANGE_FAILED` events
   - Indicates potential MITM attacks

3. **Replay Attack Frequency**
   - Count of `REPLAY_ATTACK_DETECTED` events
   - Indicates active attack attempts

4. **Invalid Signature Frequency**
   - Count of `INVALID_SIGNATURE` events
   - Indicates MITM or tampering attempts

5. **Decryption Failure Rate**
   - Count of `MESSAGE_DECRYPTION_FAILED` events
   - Indicates key mismatch or corruption

## Log Retention

**Recommendation**: 
- Keep logs for at least 90 days for security analysis
- Archive older logs for compliance
- Implement log rotation to manage storage

## Security Considerations

1. **Log Integrity**: Logs should be tamper-evident (consider signing logs)
2. **Access Control**: Only authorized administrators should access logs
3. **PII Protection**: Ensure logs don't contain sensitive plaintext data
4. **Log Encryption**: Consider encrypting logs at rest for sensitive environments

## Implementation Status

### ✅ Fully Implemented

All required logging is now fully implemented:

1. **Authentication Attempts** - Logged in `server/routes/auth.js`
   - `AUTH_ATTEMPT` - Every login attempt
   - `AUTH_SUCCESS` - Successful login/registration
   - `AUTH_FAILURE` - Failed authentication

2. **Key Exchange Attempts** - Logged via `SecurityLogger` utility
   - `KEY_EXCHANGE_INITIATED` - When key exchange starts
   - `KEY_EXCHANGE_COMPLETED` - When key exchange succeeds
   - `KEY_EXCHANGE_FAILED` - When key exchange fails

3. **Failed Message Decryptions** - Logged in `Chat.tsx`
   - `MESSAGE_DECRYPTION_FAILED` - When decryption fails

4. **Detected Replay Attacks** - Logged in `Chat.tsx` and replay protection
   - `REPLAY_ATTACK_DETECTED` - When replay attack is detected

5. **Invalid Signatures** - Logged in `keyExchange.ts`
   - `INVALID_SIGNATURE` - When signature verification fails

6. **Server-Side Metadata Access** - Logged in `server/routes/messages.js` and `files.js`
   - `METADATA_ACCESS` - When messages/files are accessed

## Example Log Report

### Sample Security Logs

```javascript
// Authentication Logs
[
  {
    eventType: 'AUTH_ATTEMPT',
    userId: null,
    ipAddress: '192.168.1.100',
    details: { username: 'alice' },
    severity: 'INFO',
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    eventType: 'AUTH_SUCCESS',
    userId: ObjectId('...'),
    ipAddress: '192.168.1.100',
    details: { action: 'Login' },
    severity: 'INFO',
    timestamp: '2024-01-15T10:30:15Z'
  }
]

// Key Exchange Logs
[
  {
    eventType: 'KEY_EXCHANGE_INITIATED',
    userId: ObjectId('alice_id'),
    ipAddress: '192.168.1.100',
    details: {
      receiverId: 'bob_id',
      receiverUsername: 'bob'
    },
    severity: 'INFO',
    timestamp: '2024-01-15T10:35:00Z'
  },
  {
    eventType: 'KEY_EXCHANGE_COMPLETED',
    userId: ObjectId('alice_id'),
    ipAddress: '192.168.1.100',
    details: {
      receiverId: 'bob_id',
      receiverUsername: 'bob'
    },
    severity: 'INFO',
    timestamp: '2024-01-15T10:35:05Z'
  }
]

// Attack Detection Logs
[
  {
    eventType: 'INVALID_SIGNATURE',
    userId: ObjectId('bob_id'),
    ipAddress: '192.168.1.101',
    details: {
      messageType: 'KEY_EXCHANGE_INIT',
      senderId: 'alice_id',
      reason: 'Signature verification failed in key exchange initiation',
      attackType: 'MITM_ATTEMPT'
    },
    severity: 'CRITICAL',
    timestamp: '2024-01-15T10:50:00Z'
  },
  {
    eventType: 'REPLAY_ATTACK_DETECTED',
    userId: ObjectId('bob_id'),
    ipAddress: '192.168.1.101',
    details: {
      messageId: ObjectId('...'),
      senderId: 'alice_id',
      reason: 'Duplicate nonce detected (replay attack)',
      nonce: 'abc123...',
      sequenceNumber: 5
    },
    severity: 'CRITICAL',
    timestamp: '2024-01-15T10:45:00Z'
  },
  {
    eventType: 'MESSAGE_DECRYPTION_FAILED',
    userId: ObjectId('bob_id'),
    ipAddress: '192.168.1.101',
    details: {
      messageId: ObjectId('...'),
      senderId: 'alice_id',
      reason: 'Decryption failed: Invalid ciphertext or key'
    },
    severity: 'ERROR',
    timestamp: '2024-01-15T10:40:00Z'
  }
]

// Metadata Access Logs
[
  {
    eventType: 'METADATA_ACCESS',
    userId: ObjectId('alice_id'),
    ipAddress: '192.168.1.100',
    details: {
      action: 'Message sent',
      messageId: ObjectId('...'),
      receiverId: 'bob_id'
    },
    severity: 'INFO',
    timestamp: '2024-01-15T11:00:00Z'
  },
  {
    eventType: 'METADATA_ACCESS',
    userId: ObjectId('alice_id'),
    ipAddress: '192.168.1.100',
    details: {
      action: 'Conversation accessed',
      otherUserId: 'bob_id',
      messageCount: 15
    },
    severity: 'INFO',
    timestamp: '2024-01-15T11:05:00Z'
  }
]
```

## Conclusion

The security logging system provides comprehensive audit trails for:
- ✅ Authentication attempts
- ✅ Key exchange attempts
- ✅ Failed message decryptions
- ✅ Detected replay attacks
- ✅ Invalid signatures
- ✅ Server-side metadata access

All logs are stored in MongoDB and can be retrieved via REST API endpoints for analysis and reporting. The system automatically logs all security events with appropriate severity levels and detailed information for forensic analysis.

