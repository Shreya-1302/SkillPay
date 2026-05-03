const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized to access this route'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is not banned
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError(401, 'User no longer exists'));
    }
    if (user.isBanned) {
      return next(new ApiError(403, 'Account suspended'));
    }

    req.user = user; // attach full user document
    next();
  } catch (err) {
    return next(new ApiError(401, 'Not authorized to access this route'));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, `User role ${req.user ? req.user.role : 'undefined'} is not authorized`));
    }
    next();
  };
};

module.exports = { protect, authorize };