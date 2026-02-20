// 
// Create JavaScript with: (Should be backend input validation)
// - Event listeners (Express-validator middleware)
// - Form handling (validating forms)
// - Smooth scrolling/animations (not applicable)
// - Mobile menu toggle (not applicable)
// - Any interactive features (validation logic)

const { body, validationResult } = require('express-validator');

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const extractedErrors = errors.array().map(err => ({ [err.param]: err.msg }));
        return res.status(400).json({ success: false, message: 'Validation failed', errors: extractedErrors });
    }
    next();
};

// --- Auth Validations ---
const registerValidation = [
    body('name', 'Name is required').notEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    handleValidationErrors
];

const loginValidation = [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').notEmpty(),
    handleValidationErrors
];

// --- User Profile Validations ---
const updateUserValidation = [
    body('name', 'Name is required').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
    body('email', 'Please include a valid email').optional().isEmail(),
    // Validate optional settings object
    body('settings.notificationEmail', 'Invalid notification email preference').optional().isIn(['immediate', 'daily', 'weekly', 'none']),
    body('settings.theme', 'Invalid theme preference').optional().isIn(['light', 'dark']),
    body('settings.defaultTaskStatus', 'Invalid default task status').optional().isIn(['pending', 'in-progress']),
    handleValidationErrors
];

const changePasswordValidation = [
    body('currentPassword', 'Current password is required').notEmpty(),
    body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 }),
    handleValidationErrors
];

// --- Task Validations ---
const createTaskValidation = [
    body('title', 'Task title is required').notEmpty().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('description', 'Description cannot exceed 500 characters').optional().isLength({ max: 500 }),
    body('status', 'Invalid task status').optional().isIn(['pending', 'in-progress', 'completed']),
    body('dueDate', 'Invalid due date format').optional().isISO8601().toDate(),
    handleValidationErrors
];

const updateTaskValidation = [
    body('title', 'Task title cannot be empty').optional().isLength({ min: 1 }).withMessage('Title cannot be empty').isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('description', 'Description cannot exceed 500 characters').optional().isLength({ max: 500 }),
    body('status', 'Invalid task status').optional().isIn(['pending', 'in-progress', 'completed']),
    body('dueDate', 'Invalid due date format').optional().isISO8601().toDate(),
    handleValidationErrors
];


module.exports = {
    registerValidation,
    loginValidation,
    updateUserValidation,
    changePasswordValidation,
    createTaskValidation,
    updateTaskValidation
};