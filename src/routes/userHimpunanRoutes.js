// src/routes/userHimpunanRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Protect all routes
router.use(auth);

// Get all users in himpunan
router.get('/', authorize('super_admin', 'admin'), (req, res, next) => {
  // Gunakan himpunanId dari parameter URL
  req.params.himpunanId = req.himpunanId;
  userController.getUsersByHimpunan(req, res, next);
});

// Update user score in himpunan - gunakan put untuk kompatibilitas
router.put('/:userId/score', authorize('super_admin', 'admin'), userController.updateUserScore);

module.exports = router;