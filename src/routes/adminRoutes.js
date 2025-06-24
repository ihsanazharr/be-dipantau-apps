const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.use(auth);
router.use(authorize('super_admin')); // Hanya super_admin yang bisa akses
router.get('/', adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.get('/:id', adminController.getAdmin);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

// Admin roles & permissions
router.get('/roles', adminController.getAdminRoles);
router.post('/roles', adminController.createAdminRole);
router.put('/roles/:id', adminController.updateAdminRole);
router.delete('/roles/:id', adminController.deleteAdminRole);

// Admin logs
router.get('/logs', adminController.getAdminLogs);
router.get('/logs/:adminId', adminController.getAdminLogsByAdmin);

// Admin management
router.post('/reset-password/:id', adminController.resetAdminPassword);
router.post('/activate/:id', adminController.activateAdmin);
router.post('/deactivate/:id', adminController.deactivateAdmin);

// Di bawah route admin yang sudah ada
router.post('/assign-himpunan', auth, authorize('super_admin'),
  adminController.assignHimpunanToAdmin
);

module.exports = router;