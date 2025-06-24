// middleware/validateAdmin.js
exports.validateCreateAdmin = (req, res, next) => {
  const { name, email, password, himpunanId } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nama, email, dan password wajib diisi'
    });
  }

  if (himpunanId && isNaN(parseInt(himpunanId))) {
    return res.status(400).json({
      success: false,
      message: 'himpunanId harus berupa angka'
    });
  }

  next();
};