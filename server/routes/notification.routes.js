const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/:id/read')
  .put(markAsRead);

module.exports = router;
