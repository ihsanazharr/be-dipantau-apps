const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.get('/my-notifications', auth, notificationController.getMyNotifications);
router.get('/unread-count', auth, notificationController.getUnreadNotificationsCount);
router.get('/:id', auth, notificationController.getNotificationById);
router.put('/:id/mark-read', auth, notificationController.markNotificationAsRead);
router.put('/mark-all-read', auth, notificationController.markAllNotificationsAsRead);
router.delete('/:id', auth, notificationController.deleteNotification);

router.post('/', auth, authorize('super_admin', 'admin'), notificationController.createNotification);
router.post('/himpunan/:himpunanId', auth, authorize('super_admin', 'admin'), notificationController.sendHimpunanNotification);

module.exports = router;