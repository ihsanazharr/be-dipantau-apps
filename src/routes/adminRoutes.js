const express = require('express');
const adminController = require('../controllers/adminController');
// Ubah import middleware sesuai dengan yang sudah Anda buat sebelumnya
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes - gunakan middleware auth yang sudah ada
router.use(auth);

// Admin & Super Admin routes - gunakan middleware authorize yang sudah ada
router.use(authorize('admin', 'super_admin'));

router.route('/')
  .get(adminController.getAllAdmins)
  .post(authorize('super_admin'), adminController.createAdmin);

router.route('/:id')
  .get(adminController.getAdmin)
  .put(adminController.updateAdmin)
  .delete(authorize('super_admin'), adminController.deleteAdmin);

// Admin roles & permissions
router.get('/roles', adminController.getAdminRoles);

// Perbaiki baris ini - pastikan adminController.createAdminRole adalah fungsi
// Pastikan fungsi ini didefinisikan di adminController.js
router.route('/roles')
  .post(authorize('super_admin'), adminController.createAdminRole);

router.route('/roles/:id')
  .put(authorize('super_admin'), adminController.updateAdminRole)
  .delete(authorize('super_admin'), adminController.deleteAdminRole);

// Admin logs
router.get('/logs', adminController.getAdminLogs);
router.get('/logs/:adminId', adminController.getAdminLogsByAdmin);

// Admin settings
router.post('/reset-password/:id', authorize('super_admin'), adminController.resetAdminPassword);
router.post('/activate/:id', authorize('super_admin'), adminController.activateAdmin);
router.post('/deactivate/:id', authorize('super_admin'), adminController.deactivateAdmin);

module.exports = router;