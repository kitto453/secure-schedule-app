const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

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

const scheduleValidationRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional({ nullable: true, checkFalsy: false })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['class', 'work', 'gym', 'study', 'other'])
    .withMessage('Category must be one of: class, work, gym, study, other'),
  body('start_time')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('Start time must be in HH:MM format'),
  body('end_time')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('End time must be in HH:MM format'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('priority')
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('deadline')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 datetime'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean value'),
];

// GET /api/schedules
router.get(
  '/',
  authenticate,
  [
    query('date')
      .optional()
      .isDate({ format: 'YYYY-MM-DD' })
      .withMessage('Date query param must be in YYYY-MM-DD format'),
    query('week')
      .optional()
      .isDate({ format: 'YYYY-MM-DD' })
      .withMessage('Week query param must be in YYYY-MM-DD format (start of week)'),
  ],
  validate,
  async (req, res) => {
    const userId = req.user.id;
    const { date, week } = req.query;

    try {
      let queryText;
      let queryParams;

      if (date) {
        // Get items for a specific date
        queryText = `
          SELECT id, user_id, title, description, category, start_time, end_time,
                 date, priority, deadline, completed, created_at, updated_at
          FROM schedule_items
          WHERE user_id = $1 AND date = $2
          ORDER BY start_time ASC
        `;
        queryParams = [userId, date];
      } else if (week) {
        // Get items for a full week starting from the given date
        queryText = `
          SELECT id, user_id, title, description, category, start_time, end_time,
                 date, priority, deadline, completed, created_at, updated_at
          FROM schedule_items
          WHERE user_id = $1 AND date >= $2 AND date < ($2::date + INTERVAL '7 days')
          ORDER BY date ASC, start_time ASC
        `;
        queryParams = [userId, week];
      } else {
        // Get all items for the user, ordered by date and time
        queryText = `
          SELECT id, user_id, title, description, category, start_time, end_time,
                 date, priority, deadline, completed, created_at, updated_at
          FROM schedule_items
          WHERE user_id = $1
          ORDER BY date ASC, start_time ASC
        `;
        queryParams = [userId];
      }

      const result = await db.query(queryText, queryParams);
      return res.status(200).json({ schedules: result.rows });
    } catch (err) {
      console.error('Get schedules error:', err);
      return res.status(500).json({ error: 'Failed to retrieve schedule items.' });
    }
  }
);

// POST /api/schedules
router.post(
  '/',
  authenticate,
  scheduleValidationRules,
  validate,
  async (req, res) => {
    const userId = req.user.id;
    const { title, description, category, start_time, end_time, date, priority, deadline, completed } = req.body;

    // Validate that end_time is after start_time
    if (start_time >= end_time) {
      return res.status(400).json({ error: 'End time must be after start time.' });
    }

    try {
      const result = await db.query(
        `INSERT INTO schedule_items
          (user_id, title, description, category, start_time, end_time, date, priority, deadline, completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userId,
          title,
          description || null,
          category,
          start_time,
          end_time,
          date,
          priority,
          deadline || null,
          completed !== undefined ? completed : false,
        ]
      );

      const newItem = result.rows[0];

      await logActivity(userId, 'task_created', {
        schedule_id: newItem.id,
        title: newItem.title,
        date: newItem.date,
        category: newItem.category,
      }, req.ip);

      return res.status(201).json({ schedule: newItem });
    } catch (err) {
      console.error('Create schedule error:', err);
      return res.status(500).json({ error: 'Failed to create schedule item.' });
    }
  }
);

// PUT /api/schedules/:id
router.put(
  '/:id',
  authenticate,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid schedule item ID'),
    ...scheduleValidationRules,
  ],
  validate,
  async (req, res) => {
    const userId = req.user.id;
    const scheduleId = parseInt(req.params.id, 10);
    const { title, description, category, start_time, end_time, date, priority, deadline, completed } = req.body;

    // Validate that end_time is after start_time
    if (start_time >= end_time) {
      return res.status(400).json({ error: 'End time must be after start time.' });
    }

    try {
      // Check ownership
      const ownerCheck = await db.query(
        'SELECT id FROM schedule_items WHERE id = $1 AND user_id = $2',
        [scheduleId, userId]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Schedule item not found or access denied.' });
      }

      const result = await db.query(
        `UPDATE schedule_items
         SET title = $1, description = $2, category = $3, start_time = $4, end_time = $5,
             date = $6, priority = $7, deadline = $8, completed = $9
         WHERE id = $10 AND user_id = $11
         RETURNING *`,
        [
          title,
          description || null,
          category,
          start_time,
          end_time,
          date,
          priority,
          deadline || null,
          completed !== undefined ? completed : false,
          scheduleId,
          userId,
        ]
      );

      const updatedItem = result.rows[0];

      await logActivity(userId, 'task_edited', {
        schedule_id: updatedItem.id,
        title: updatedItem.title,
        date: updatedItem.date,
        category: updatedItem.category,
        completed: updatedItem.completed,
      }, req.ip);

      return res.status(200).json({ schedule: updatedItem });
    } catch (err) {
      console.error('Update schedule error:', err);
      return res.status(500).json({ error: 'Failed to update schedule item.' });
    }
  }
);

// DELETE /api/schedules/:id
router.delete(
  '/:id',
  authenticate,
  [param('id').isInt({ min: 1 }).withMessage('Invalid schedule item ID')],
  validate,
  async (req, res) => {
    const userId = req.user.id;
    const scheduleId = parseInt(req.params.id, 10);

    try {
      const result = await db.query(
        'DELETE FROM schedule_items WHERE id = $1 AND user_id = $2 RETURNING id, title, date, category',
        [scheduleId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Schedule item not found or access denied.' });
      }

      const deletedItem = result.rows[0];

      await logActivity(userId, 'task_deleted', {
        schedule_id: deletedItem.id,
        title: deletedItem.title,
        date: deletedItem.date,
        category: deletedItem.category,
      }, req.ip);

      return res.status(200).json({ message: 'Schedule item deleted successfully.' });
    } catch (err) {
      console.error('Delete schedule error:', err);
      return res.status(500).json({ error: 'Failed to delete schedule item.' });
    }
  }
);

module.exports = router;
