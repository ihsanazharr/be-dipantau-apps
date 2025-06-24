const express = require('express');
const router = express.Router();
const himpunanController = require('../controllers/himpunanController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', himpunanController.getAllHimpunan);

// Auth required for all routes below
router.use(auth);

// Route khusus untuk join-requests HARUS didefinisikan SEBELUM :id
router.get('/join-requests', authorize('admin'), himpunanController.getJoinRequests);

// Route dengan parameter harus setelah route statis
router.get('/:id', himpunanController.getHimpunanById);
router.get('/user/me', himpunanController.getMyHimpunan);
router.post('/join', himpunanController.joinHimpunan);
router.delete('/leave', himpunanController.leaveHimpunan);

// Admin-only routes
router.use(authorize('super_admin', 'admin'));

router.post('/', himpunanController.createHimpunan);
router.put('/:id', himpunanController.updateHimpunan);
router.delete('/:id', himpunanController.deleteHimpunan);
router.patch('/:id/admin', himpunanController.changeHimpunanAdmin);
router.patch('/member/:userId/status', himpunanController.updateMembershipStatus);

module.exports = router;