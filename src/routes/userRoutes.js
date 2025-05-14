// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Protected routes
router.get('/profile', auth, userController.getUserProfile);
router.put('/profile', auth, userController.updateUserProfile);

// Admin only routes
router.get('/', auth, authorize('super_admin', 'admin'), userController.getAllUsers);
router.get('/:id', auth, authorize('super_admin', 'admin'), userController.getUserById);
router.put('/:id', auth, authorize('super_admin', 'admin'), userController.updateUser);
router.delete('/:id', auth, authorize('super_admin', 'admin'), userController.deleteUser);

// Route untuk mendapatkan user berdasarkan himpunan
router.get('/himpunan/:himpunanId', auth, authorize('super_admin', 'admin'), userController.getUsersByHimpunan);

// Route untuk update skor user - gunakan put daripada patch untuk kompatibilitas lebih baik
router.put('/:userId/score', auth, authorize('super_admin', 'admin'), userController.updateUserScore);

// Membership routes
router.post('/join-himpunan', auth, userController.joinHimpunan);
router.delete('/leave-himpunan', auth, userController.leaveHimpunan);
router.get('/my-membership', auth, userController.getMyMembership);

// Admin membership management
router.put('/:userId/membership-status', auth, authorize('super_admin', 'admin'), userController.updateMembershipStatus);
router.delete('/:userId/remove-member', auth, authorize('super_admin', 'admin'), userController.removeMember);

// ATAU gunakan router.route() untuk HTTP methods
// router.route('/:userId/score')
//   .put(auth, authorize('super_admin', 'admin'), userController.updateUserScore);

module.exports = router;