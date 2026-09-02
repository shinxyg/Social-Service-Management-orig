const db = require('../config/db');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const { userId, ref } = req.query;
    let query = `SELECT * FROM user_notifications ORDER BY created_at DESC LIMIT 50`;
    let params = [];

    if (ref) {
      query = `SELECT * FROM user_notifications WHERE application_ref = $1 ORDER BY created_at DESC LIMIT 50`;
      params = [ref];
    } else if (userId) {
      query = `SELECT * FROM user_notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 50`;
      params = [userId];
    }

    const result = await db.query(query, params);
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

// POST /api/notifications
exports.createNotification = async (req, res) => {
  try {
    const { userId, title, description, applicationRef } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }
    const result = await db.query(
      `INSERT INTO user_notifications (user_id, title, description, application_ref)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId || null, title, description, applicationRef || null]
    );
    res.status(201).json({ message: 'Notification created.', notification: result.rows[0] });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ error: 'Failed to create notification.' });
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`UPDATE user_notifications SET is_read = true WHERE id = $1`, [id]);
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
};
