const jwt = require('jsonwebtoken');
const { User, Himpunan } = require('../models');
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Missing token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Himpunan,
        as: 'himpunan'
      }]
    });
    if (!user || !user.isActive) throw new Error('Invalid user');
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed: ' + error.message 
    });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') roles = [roles];
  
  return async (req, res, next) => {
    try {
      // Super admin always passes
      if (req.user.role === 'super_admin') return next();
      
      // Role-based authorization
      if (roles.length > 0 && !roles.includes(req.user.role)) {
        throw new Error('Insufficient permissions');
      }
      
      // Himpunan admin authorization
      if (req.params.himpunanId) {
        const isAdmin = await User.findOne({
          where: {
            id: req.user.id,
            himpunanId: req.params.himpunanId,
            isHimpunanAdmin: true
          }
        });

        if (!isAdmin) throw new Error('Not himpunan admin');
      }
      
      next();
    } catch (error) {
      res.status(403).json({ 
        success: false, 
        message: 'Authorization failed: ' + error.message 
      });
    }
  };
};
module.exports = { auth, authorize };