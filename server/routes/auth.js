const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const router = express.Router();

// Helper function to log security events
const logSecurityEvent = async (eventType, userId, ipAddress, details, severity = 'INFO') => {
  try {
    await SecurityLog.create({
      eventType,
      userId,
      ipAddress,
      details,
      severity
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

// Register new user
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('password').isLength({ min: 8 }),
  body('publicKey').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, publicKey } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      await logSecurityEvent('AUTH_FAILURE', null, ipAddress, { reason: 'Username already exists' }, 'WARNING');
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      username,
      passwordHash,
      publicKey
    });

    await logSecurityEvent('AUTH_SUCCESS', user._id, ipAddress, { action: 'Registration' }, 'INFO');

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id,
      username: user.username
    });
  } catch (error) {
    console.error('Registration error:', error);
    await logSecurityEvent('AUTH_FAILURE', null, req.ip, { error: error.message }, 'ERROR');
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    await logSecurityEvent('AUTH_ATTEMPT', null, ipAddress, { username }, 'INFO');

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      await logSecurityEvent('AUTH_FAILURE', null, ipAddress, { reason: 'User not found' }, 'WARNING');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      await logSecurityEvent('AUTH_FAILURE', user._id, ipAddress, { reason: 'Invalid password' }, 'WARNING');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    await logSecurityEvent('AUTH_SUCCESS', user._id, ipAddress, { action: 'Login' }, 'INFO');

    res.json({
      message: 'Login successful',
      userId: user._id,
      username: user.username,
      publicKey: user.publicKey
    });
  } catch (error) {
    console.error('Login error:', error);
    await logSecurityEvent('AUTH_FAILURE', null, req.ip, { error: error.message }, 'ERROR');
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user public key
router.get('/public-key/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('publicKey username');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ publicKey: user.publicKey, username: user.username });
  } catch (error) {
    console.error('Error fetching public key:', error);
    res.status(500).json({ error: 'Failed to fetch public key' });
  }
});

module.exports = router;

