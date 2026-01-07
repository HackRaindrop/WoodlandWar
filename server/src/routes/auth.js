const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username taken' 
      });
    }
    
    // Create user
    const user = new User({ username, email, password });
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'woodland-jwt-secret',
      { expiresIn: '7d' }
    );
    
    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'woodland-jwt-secret',
      { expiresIn: '7d' }
    );
    
    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    // Check for token in header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try session
      if (req.session.userId) {
        const user = await User.findById(req.session.userId);
        if (user) {
          return res.json({ user });
        }
      }
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'woodland-jwt-secret');
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update user avatar
router.patch('/avatar', async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar },
      { new: true }
    );
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Guest login (for quick play)
router.post('/guest', async (req, res) => {
  try {
    const guestNum = Math.floor(Math.random() * 10000);
    const timestamp = Date.now();
    const guestId = `guest_${timestamp}_${guestNum}`;
    const username = `Guest${guestNum}`;
    
    // Create temporary guest token
    const token = jwt.sign(
      { 
        isGuest: true, 
        username,
        guestId
      },
      process.env.JWT_SECRET || 'woodland-jwt-secret',
      { expiresIn: '24h' }
    );
    
    // Store guest info in session
    req.session.isGuest = true;
    req.session.guestId = guestId;
    req.session.username = username;
    
    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
    });
    
    res.json({
      message: 'Guest session created',
      token,
      user: {
        id: guestId,
        username,
        isGuest: true
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Guest login failed' });
  }
});

module.exports = router;
