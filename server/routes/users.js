const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get all users (for selecting chat partners)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('username _id createdAt').sort({ username: 1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('username _id createdAt publicKey');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;

