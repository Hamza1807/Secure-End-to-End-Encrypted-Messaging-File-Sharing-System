# Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. MongoDB Setup

1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/Mac
   sudo systemctl start mongod
   ```
3. MongoDB will run on `mongodb://localhost:27017` by default

### 3. Environment Configuration

#### Server Environment

Create `server/.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure_messaging
NODE_ENV=development
JWT_SECRET=your-secret-key-here-change-in-production
CORS_ORIGIN=http://localhost:3000
```

#### Client Environment

Create `client/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run the Application

#### Option 1: Run Both Servers Separately

Terminal 1 (Backend):
```bash
cd server
npm start
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

#### Option 2: Run Both with Concurrently

From root directory:
```bash
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## First Time Setup

1. **Register a User**:
   - Open http://localhost:3000
   - Click "Register"
   - Enter username and password
   - Keys will be generated automatically

2. **Register Another User** (for testing):
   - Open in incognito/private window
   - Register a second user
   - This allows you to test messaging between users

3. **Start Messaging**:
   - Login with first user
   - Select second user from sidebar
   - Key exchange will happen automatically
   - Start sending encrypted messages!

## Testing the Security Features

### Test Replay Attack Protection

1. Send a message
2. Try to resend the same message (should be rejected)
3. Check security logs for replay attack detection

### Test MITM Protection

1. Use BurpSuite to intercept key exchange
2. Try to modify public key
3. Signature verification should fail
4. Check security logs for invalid signature

### View Security Logs

Access logs via API:
```bash
curl http://localhost:5000/api/logs
```

Or check MongoDB:
```bash
mongosh
use secure_messaging
db.securitylogs.find().pretty()
```

## Troubleshooting

### MongoDB Connection Error

- Ensure MongoDB is running
- Check connection string in `server/.env`
- Verify MongoDB is accessible on port 27017

### Port Already in Use

- Change PORT in `server/.env`
- Update `REACT_APP_API_URL` in `client/.env` accordingly

### Key Generation Fails

- Ensure you're using a modern browser (Chrome, Firefox, Edge)
- Web Crypto API requires HTTPS in production
- For development, localhost is allowed

### CORS Errors

- Check `CORS_ORIGIN` in `server/.env`
- Ensure it matches your frontend URL

## Production Deployment

### Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use HTTPS for all communications
- [ ] Enable MongoDB authentication
- [ ] Set up rate limiting
- [ ] Configure proper CORS origins
- [ ] Enable security headers (Helmet)
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Backup strategy for MongoDB

### Environment Variables for Production

```env
PORT=5000
MONGODB_URI=mongodb://user:password@host:27017/secure_messaging?authSource=admin
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
CORS_ORIGIN=https://yourdomain.com
```

## Development Tools

### Useful Commands

```bash
# Run server in development mode (with auto-reload)
cd server
npm run dev

# Run client in development mode
cd client
npm start

# Build client for production
cd client
npm run build

# Run tests (if implemented)
npm test
```

### Database Management

```bash
# Connect to MongoDB
mongosh

# Use database
use secure_messaging

# View collections
show collections

# View users
db.users.find().pretty()

# View messages
db.messages.find().pretty()

# View security logs
db.securitylogs.find().sort({timestamp: -1}).limit(10).pretty()
```

## Next Steps

1. Review the documentation:
   - `KEY_EXCHANGE_PROTOCOL.md` - Protocol details
   - `THREAT_MODELING.md` - Security analysis
   - `MITM_ATTACK_DEMONSTRATION.md` - Attack demos

2. Test all features:
   - User registration/login
   - Key exchange
   - Encrypted messaging
   - File sharing
   - Security logging

3. Customize for your needs:
   - Add additional features
   - Enhance UI/UX
   - Implement rate limiting
   - Add forward secrecy

## Support

For issues or questions:
1. Check the documentation in `docs/` folder
2. Review error logs in console
3. Check MongoDB logs
4. Review security logs in database

