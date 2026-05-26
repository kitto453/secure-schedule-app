const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

const SALT_ROUNDS = 12;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

const logActivity = async (userId, action, details, ipAddress) => {
  try {
    await db.query(
      'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [userId, action, JSON.stringify(details), ipAddress]
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// POST /api/auth/register
router.post(
  '/register',
  registerLimiter,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email must not exceed 255 characters'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .isLength({ max: 128 })
      .withMessage('Password must not exceed 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  validate,
  async (req, res) => {
    const { name, email, password } = req.body;

    try {
      // Check if email already exists
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert new user
      const result = await db.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
        [name, email, passwordHash]
      );

      const user = result.rows[0];

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Set cookie
      res.cookie('token', token, COOKIE_OPTIONS);

      // Log activity
      await logActivity(user.id, 'register', { email: user.email }, req.ip);

      return res.status(201).json({
        message: 'Account created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;

    try {
      // Find user by email
      const result = await db.query(
        'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        // Use same error message to prevent email enumeration
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = result.rows[0];

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Set cookie
      res.cookie('token', token, COOKIE_OPTIONS);

      // Log login activity
      await logActivity(user.id, 'login', { email: user.email }, req.ip);

      return res.status(200).json({
        message: 'Logged in successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Failed to log in. Please try again.' });
    }
  }
);

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    await logActivity(req.user.id, 'logout', { email: req.user.email }, req.ip);
    res.clearCookie('token', { path: '/' });
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    // Clear cookie even on error
    res.clearCookie('token', { path: '/' });
    return res.status(200).json({ message: 'Logged out successfully' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      created_at: req.user.created_at,
    },
  });
});

module.exports = router;
