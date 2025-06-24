const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Middleware otentikasi untuk semua route
router.use(auth);

// ======================
// USER NOTIFICATION ENDPOINTS
// ======================
router.get('/me', notificationController.getMyNotifications);
router.get('/me/unread-count', notificationController.getUnreadNotificationsCount);
router.put('/me/mark-all-read', notificationController.markAllNotificationsAsRead);

// Endpoint untuk notifikasi spesifik user
router.route('/me/:id')
  .get(notificationController.getMyNotificationById)
  .put(notificationController.markNotificationAsRead)
  .delete(notificationController.deleteMyNotification);

// ======================
// ADMIN NOTIFICATION ENDPOINTS
// ======================
router.use(authorize('super_admin', 'admin'));

// Buat notifikasi (admin only)
router.post('/', notificationController.createNotification);

// Broadcast notifikasi ke himpunan
router.post('/broadcast/himpunan/:himpunanId', 
  // Middleware tambahan untuk verifikasi admin himpunan
  async (req, res, next) => {
    const isAdmin = await User.findOne({
      where: { 
        id: req.user.id, 
        himpunanId: req.params.himpunanId,
        isHimpunanAdmin: true 
      }
    });
    
    if (!isAdmin && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
  },
  notificationController.sendHimpunanNotification
);

module.exports = router;