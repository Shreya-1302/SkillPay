const express = require('express');
const router = express.Router();
const {
  createGig,
  getGigs,
  getGigById,
  updateGig,
  deleteGig,
  getMyGigs
} = require('../controllers/gig.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadImages } = require('../middleware/upload.middleware');

// Public routes
router.get('/', getGigs);

// Protected route that needs to be before /:id to avoid ID matching conflict
router.get('/my/list', protect, getMyGigs);

// Generic public route
router.get('/:id', getGigById);

// Other protected routes
router.use(protect);
router.post('/', uploadImages, createGig);
router.put('/:id', uploadImages, updateGig);
router.delete('/:id', deleteGig);

module.exports = router;
