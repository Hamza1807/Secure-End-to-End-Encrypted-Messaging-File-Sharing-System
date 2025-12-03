const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
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

// Send encrypted message
router.post('/send', [
  body('senderId').notEmpty(),
  body('receiverId').notEmpty(),
  body('ciphertext').notEmpty(),
  body('iv').notEmpty(),
  body('authTag').notEmpty(),
  body('nonce').notEmpty(),
  body('sequenceNumber').isInt({ min: 0 }),
  body('signature').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      senderId,
      receiverId,
      ciphertext,
      iv,
      authTag,
      nonce,
      sequenceNumber,
      signature
    } = req.body;

    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check for replay attack (nonce + sequence number validation happens client-side)
    // Server stores the message
    const message = await Message.create({
      senderId,
      receiverId,
      ciphertext,
      iv,
      authTag,
      nonce,
      sequenceNumber,
      signature,
      timestamp: new Date()
    });

    await logSecurityEvent('METADATA_ACCESS', senderId, ipAddress, {
      action: 'Message sent',
      messageId: message._id,
      receiverId
    }, 'INFO');

    res.status(201).json({
      message: 'Message sent successfully',
      messageId: message._id,
      timestamp: message.timestamp
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get messages between two users
router.get('/conversation/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    })
    .sort({ timestamp: 1 })
    .select('ciphertext iv authTag nonce sequenceNumber signature timestamp senderId receiverId');

    await logSecurityEvent('METADATA_ACCESS', userId1, ipAddress, {
      action: 'Conversation accessed',
      otherUserId: userId2,
      messageCount: messages.length
    }, 'INFO');

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark message as read
router.patch('/:messageId/read', async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

module.exports = router;

