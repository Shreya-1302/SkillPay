const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  createMilestone,
  submitMilestone,
  approveMilestone,
  requestRevision,
  getMilestonesByOrder,
} = require('../controllers/milestone.controller');

const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Multer for deliverable uploads — allow any file type (images, PDFs, ZIPs, etc.)
// Max 20 MB per file
const deliverableUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
}).single('deliverable');

// All milestone routes require authentication
router.use(protect);

// POST /api/milestones            — Create a new milestone (student only)
router.post('/', requireRole('student'), createMilestone);

// POST /api/milestones/:id/submit — Submit work (student only, optional file upload)
router.post('/:id/submit', requireRole('student'), deliverableUpload, submitMilestone);

// PATCH /api/milestones/:id/approve  — Approve milestone, credit student (client only)
router.patch('/:id/approve', requireRole('client'), approveMilestone);

// PATCH /api/milestones/:id/revision — Request revision (client only)
router.patch('/:id/revision', requireRole('client'), requestRevision);

// GET /api/milestones/order/:orderId — Get all milestones for an order
router.get('/order/:orderId', getMilestonesByOrder);

module.exports = router;
