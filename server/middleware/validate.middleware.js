const { validationResult, body } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware factory: runs express-validator results and throws ApiError if invalid.
 * Usage: validate([...rules])
 */
const validate = (rules) => {
  return async (req, res, next) => {
    // Run all rules
    await Promise.all(rules.map((rule) => rule.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const messages = errors.array().map((e) => e.msg).join(', ');
    return next(new ApiError(422, messages));
  };
};

/* ─────────────────────────────────────────────
   Reusable rule sets
───────────────────────────────────────────── */

/** POST /api/auth/register */
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .isIn(['client', 'student']).withMessage('Role must be client or student'),
];

/** POST /api/auth/login */
const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

/** POST /api/gigs */
const createGigRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 10, max: 120 }).withMessage('Title must be 10–120 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 30 }).withMessage('Description must be at least 30 characters'),

  body('basePrice')
    .notEmpty().withMessage('Base price is required')
    .isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),

  body('deliveryDays')
    .notEmpty().withMessage('Delivery days is required')
    .isInt({ min: 1 }).withMessage('Delivery days must be at least 1'),
];

/** POST /api/wallet/withdraw */
const withdrawRules = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  createGigRules,
  withdrawRules,
};
