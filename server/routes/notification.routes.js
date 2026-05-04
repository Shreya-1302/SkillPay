const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllRead,
  clearAll,
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications)
  .delete(clearAll);                // DELETE /api/notifications

router.patch('/read-all', markAllRead); // PATCH /api/notifications/read-all

router.route('/:id/read')
  .put(markAsRead);

module.exports = router;
