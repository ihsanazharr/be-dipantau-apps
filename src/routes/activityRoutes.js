// src/routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', activityController.getAllActivities);
router.get('/:id', activityController.getActivityById);
router.get('/himpunan/:himpunanId', activityController.getHimpunanActivities);

router.use(authorize('super_admin', 'admin'));

router.post('/', activityController.createActivity);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);
router.patch('/:id/status', activityController.updateActivityStatus);

module.exports = router;