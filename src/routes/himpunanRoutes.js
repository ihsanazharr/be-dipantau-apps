// src/routes/himpunanRoutes.js
const express = require('express');
const router = express.Router();
const himpunanController = require('../controllers/himpunanController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', himpunanController.getAllHimpunan);
router.get('/:id', himpunanController.getHimpunanById);

// Auth required routes
router.get('/my-himpunan', auth, himpunanController.getMyHimpunan);

// Admin only routes
router.post('/', auth, authorize('super_admin', 'admin'), himpunanController.createHimpunan);
router.put('/:id', auth, authorize('super_admin', 'admin'), himpunanController.updateHimpunan);
router.delete('/:id', auth, authorize('super_admin', 'admin'), himpunanController.deleteHimpunan);
router.put('/:id/change-admin', auth, authorize('super_admin', 'admin'), himpunanController.changeHimpunanAdmin);

module.exports = router;