const express = require('express');
const { body, validationResult } = require('express-validator');
const File = require('../models/File');
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

// Upload encrypted file
router.post('/upload', [
  body('senderId').notEmpty(),
  body('receiverId').notEmpty(),
  body('fileName').notEmpty(),
  body('fileType').notEmpty(),
  body('fileSize').isInt({ min: 1 }),
  body('encryptedChunks').isArray().notEmpty(),
  body('totalChunks').isInt({ min: 1 }),
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
      fileName,
      fileType,
      fileSize,
      encryptedChunks,
      totalChunks,
      signature
    } = req.body;

    const ipAddress = req.ip || req.connection.remoteAddress;

    const file = await File.create({
      senderId,
      receiverId,
      fileName,
      fileType,
      fileSize,
      encryptedChunks,
      totalChunks,
      signature,
      timestamp: new Date()
    });

    await logSecurityEvent('FILE_UPLOAD', senderId, ipAddress, {
      fileId: file._id,
      fileName,
      fileSize,
      receiverId
    }, 'INFO');

    res.status(201).json({
      message: 'File uploaded successfully',
      fileId: file._id,
      timestamp: file.timestamp
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get file metadata
router.get('/:fileId', async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId)
      .select('fileName fileType fileSize encryptedChunks totalChunks signature timestamp senderId receiverId');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    await logSecurityEvent('FILE_DOWNLOAD', file.receiverId, ipAddress, {
      fileId: file._id,
      fileName: file.fileName
    }, 'INFO');

    res.json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Get files for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const files = await File.find({
      $or: [
        { senderId: req.params.userId },
        { receiverId: req.params.userId }
      ]
    })
    .sort({ timestamp: -1 })
    .select('fileName fileType fileSize timestamp senderId receiverId _id');

    res.json(files);
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

module.exports = router;

