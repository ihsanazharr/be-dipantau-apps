const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.use(auth);

// Ganti getCurrentUserTasks dengan getUserTasks
router.get('/user/me', taskController.getUserTasks);
router.post('/:id/take', taskController.takeTask);
router.patch('/:id/complete', taskController.completeTask);

router.use(authorize('super_admin', 'admin'));

router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTask);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;