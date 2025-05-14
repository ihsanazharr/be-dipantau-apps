// src/routes/himpunanMemberRoutes.js
const express = require('express');
const router = express.Router();
const himpunanMemberController = require('../controllers/himpunanMemberController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Auth required routes
router.post('/', auth, himpunanMemberController.joinHimpunan);
router.get('/my-memberships', auth, himpunanMemberController.getMyMemberships);
router.delete('/:himpunanId/leave', auth, himpunanMemberController.leaveHimpunan);

// Admin or super_admin only routes
router.put('/:id/status', auth, authorize('super_admin', 'admin'), himpunanMemberController.updateMembershipStatus);
router.put('/:id/role', auth, authorize('super_admin', 'admin'), himpunanMemberController.updateMemberRole);
router.delete('/:id', auth, authorize('super_admin', 'admin'), himpunanMemberController.removeMember);

module.exports = router;