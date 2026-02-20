// 
// Create authentication JavaScript with:
// - Form validation (using utils/validation)
// - API calls to backend (this IS the backend)
// - Token storage (JWT generation here)
// - Redirect after login/signup (handled by frontend)
// - Error handling (via middleware and responses)
// - Loading states (handled by frontend)

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../utils/validation');
const { protect } = require('../middleware/auth');

/**
 * @route POST /api/auth/signup
 * @desc Register new user
 * @access Public
 */
router.post('/signup', registerValidation, async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create new user
        user = new User({
            name,
            email,
            password // Password will be hashed by pre-save hook in User model
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err.message);
        next(err); // Pass error to global error handler
    }
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
router.post('/login', loginValidation, async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err.message);
        next(err); // Pass error to global error handler
    }
});

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user
 * @access Private
 */
router.get('/me', protect, async (req, res, next) => {
    try {
        // req.user.id is set by the protect middleware
        const user = await User.findById(req.user.id).select('-password -tasks'); // Exclude password and tasks for this route
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err.message);
        next(err);
    }
});

module.exports = router;