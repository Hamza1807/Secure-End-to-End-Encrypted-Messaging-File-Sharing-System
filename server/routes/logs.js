const express = require('express');
const { body, validationResult } = require('express-validator');
const SecurityLog = require('../models/SecurityLog');
const router = express.Router();

// Get security logs (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const { eventType, userId, severity, startDate, endDate } = req.query;

    const query = {};
    if (eventType) query.eventType = eventType;
    if (userId) query.userId = userId;
    if (severity) query.severity = severity;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await SecurityLog.find(query)
      .populate('userId', 'username')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    const total = await SecurityLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Log security event from client
router.post('/log', [
  body('eventType').notEmpty(),
  body('userId').optional(),
  body('details').optional()
], async (req, res) => {
  try {
    const { eventType, userId, details } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Determine severity based on event type
    let severity = 'INFO';
    if (['REPLAY_ATTACK_DETECTED', 'INVALID_SIGNATURE', 'KEY_EXCHANGE_FAILED'].includes(eventType)) {
      severity = 'CRITICAL';
    } else if (['MESSAGE_DECRYPTION_FAILED'].includes(eventType)) {
      severity = 'ERROR';
    } else if (['AUTH_FAILURE'].includes(eventType)) {
      severity = 'WARNING';
    }

    const log = await SecurityLog.create({
      eventType,
      userId: userId || null,
      ipAddress,
      details: details || {},
      severity
    });

    res.status(201).json({ message: 'Security event logged', logId: log._id });
  } catch (error) {
    console.error('Error logging security event:', error);
    res.status(500).json({ error: 'Failed to log security event' });
  }
});

// Get logs for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const logs = await SecurityLog.find({ userId: req.params.userId })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching user logs:', error);
    res.status(500).json({ error: 'Failed to fetch user logs' });
  }
});

// Get attack-related logs
router.get('/attacks', async (req, res) => {
  try {
    const logs = await SecurityLog.find({
      eventType: {
        $in: ['REPLAY_ATTACK_DETECTED', 'INVALID_SIGNATURE', 'MESSAGE_DECRYPTION_FAILED', 'KEY_EXCHANGE_FAILED']
      }
    })
      .populate('userId', 'username')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching attack logs:', error);
    res.status(500).json({ error: 'Failed to fetch attack logs' });
  }
});

module.exports = router;
