const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// GET /api/activity
router.get(
  '/',
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('action')
      .optional()
      .isIn(['login', 'logout', 'register', 'task_created', 'task_edited', 'task_deleted'])
      .withMessage('Invalid action filter'),
  ],
  validate,
  async (req, res) => {
    const userId = req.user.id;
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const action = req.query.action;
    const offset = (page - 1) * limit;

    try {
      let countQuery = 'SELECT COUNT(*) FROM activity_logs WHERE user_id = $1';
      let logsQuery = `
        SELECT id, action, details, ip_address, created_at
        FROM activity_logs
        WHERE user_id = $1
      `;
      const countParams = [userId];
      const logsParams = [userId];

      if (action) {
        countQuery += ' AND action = $2';
        logsQuery += ' AND action = $2';
        countParams.push(action);
        logsParams.push(action);
        logsParams.push(limit, offset);
        logsQuery += ` ORDER BY created_at DESC LIMIT $3 OFFSET $4`;
      } else {
        logsParams.push(limit, offset);
        logsQuery += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      }

      const [countResult, logsResult] = await Promise.all([
        db.query(countQuery, countParams),
        db.query(logsQuery, logsParams),
      ]);

      const total = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        activities: logsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (err) {
      console.error('Get activity logs error:', err);
      return res.status(500).json({ error: 'Failed to retrieve activity logs.' });
    }
  }
);

module.exports = router;
