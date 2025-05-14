// src/routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.get('/', auth, activityController.getAllActivities);
router.get('/:id', auth, activityController.getActivityById);

router.post('/', auth, authorize('super_admin', 'admin'), activityController.createActivity);
router.put('/:id', auth, authorize('super_admin', 'admin'), activityController.updateActivity);
router.delete('/:id', auth, authorize('super_admin', 'admin'), activityController.deleteActivity);
router.put('/:id/status', auth, authorize('super_admin', 'admin'), activityController.updateActivityStatus);

module.exports = router;