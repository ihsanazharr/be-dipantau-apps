// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/password/forgot', userController.forgotPassword);
router.post('/password/reset/:token', userController.resetPassword);

// Middleware auth untuk semua route di bawah ini
router.use(auth);

// Authenticated user routes
router.get('/me', userController.getUserProfile);
router.put('/me', userController.updateUserProfile); // Pastikan ini adalah fungsi yang valid
router.put('/password', userController.changePassword);
router.get('/membership', userController.getMyMembership);

// Admin routes (hanya untuk admin dan super_admin)
router.use(authorize('super_admin', 'admin'));

router.get('/', userController.getAllUsers);
router.get('/himpunan/:himpunanId', userController.getUsersByHimpunan);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.put('/:id/score', userController.updateUserScore);
router.delete('/:id', userController.deleteUser);
router.put('/:id/membership/status', userController.updateMembershipStatus);
router.delete('/:id/membership', userController.removeMember);

// Endpoint khusus super_admin
router.get('/admins', authorize('super_admin'), userController.getAllAdmins);
router.post('/debug-admin', userController.debugCreateAdmin);

module.exports = router;