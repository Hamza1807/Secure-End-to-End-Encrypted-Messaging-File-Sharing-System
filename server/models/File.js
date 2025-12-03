const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  encryptedChunks: [{
    ciphertext: String,
    iv: String,
    authTag: String,
    chunkIndex: Number
  }],
  totalChunks: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  signature: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
fileSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
fileSchema.index({ receiverId: 1 });

module.exports = mongoose.model('File', fileSchema);

