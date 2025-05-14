// src/routes/taskRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/taskController'); // IMPORT CONTROLLER YANG BENAR
const { auth, authorize } = require('../middleware/authMiddleware');

// HAPUS DUMMY CONTROLLER INI:
// const taskController = {
//   getAllTasks: (req, res) => { ... },
//   ...
// };

// Protect all routes
router.use(auth);

// Get all tasks - admin only
router.get('/', authorize('super_admin', 'admin'), taskController.getAllTasks);

// Get tasks for specific himpunan
router.get('/himpunan/:himpunanId', taskController.getHimpunanTasks);

// Get current user tasks
router.get('/user', taskController.getCurrentUserTasks);
// Get specific user tasks
router.get('/user/:userId', taskController.getUserTasks);

// CRUD operations for tasks
router.post('/', authorize('super_admin', 'admin'), taskController.createTask);
router.get('/:id', taskController.getTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;