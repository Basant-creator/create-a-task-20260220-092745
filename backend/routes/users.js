// 
// Create user and task management JavaScript routes with:
// - API calls to backend (this IS the backend)
// - Token storage (not applicable here)
// - Redirect after login/signup (handled by frontend)
// - Error handling (via middleware and responses)
// - Loading states (handled by frontend)

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { updateUserValidation, changePasswordValidation, createTaskValidation, updateTaskValidation } = require('../utils/validation');
const bcrypt = require('bcryptjs');

// Helper to check if task belongs to user
const checkTaskOwnership = (user, taskId) => {
    return user.tasks.id(taskId); // Mongoose subdocument method
};

/**
 * @route GET /api/users/:id
 * @desc Get user profile by ID
 * @access Private
 */
router.get('/:id', protect, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                settings: user.settings || {} // Include settings if available
            }
        });

    } catch (err) {
        console.error(err.message);
        next(err);
    }
});

/**
 * @route PUT /api/users/:id
 * @desc Update user profile (name, email, settings)
 * @access Private
 */
router.put('/:id', protect, updateUserValidation, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const { name, email, settings } = req.body;
        const updateFields = { name, email };

        // Handle settings update if provided
        if (settings) {
            updateFields.settings = settings;
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true }).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                settings: user.settings
            }
        });

    } catch (err) {
        // Handle duplicate email error specifically
        if (err.code === 11000) { // MongoDB duplicate key error
            return res.status(400).json({ success: false, message: 'Email is already in use.' });
        }
        console.error(err.message);
        next(err);
    }
});

/**
 * @route PUT /api/users/:id/password
 * @desc Change user password
 * @access Private
 */
router.put('/:id/password', protect, changePasswordValidation, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Set new password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save(); // This will trigger the pre-save hook to hash

        res.status(200).json({ success: true, message: 'Password updated successfully' });

    } catch (err) {
        console.error(err.message);
        next(err);
    }
});


/**
 * @route DELETE /api/users/:id
 * @desc Delete user account
 * @access Private
 */
router.delete('/:id', protect, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'Account deleted successfully' });

    } catch (err) {
        console.error(err.message);
        next(err);
    }
});


// ------------------------------------
// Task Management for a User
// Tasks are embedded as subdocuments in the User model
// ------------------------------------

/**
 * @route GET /api/users/:id/tasks
 * @desc Get all tasks for a specific user
 * @access Private
 */
router.get('/:id/tasks', protect, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, tasks: user.tasks });

    } catch (err) {
        console.error(err.message);
        next(err);
    }
});

/**
 * @route POST /api/users/:id/tasks
 * @desc Create a new task for a specific user
 * @access Private
 */
router.post('/:id/tasks', protect, createTaskValidation, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { title, description, dueDate, status } = req.body;

        user.tasks.push({ title, description, dueDate, status });
        await user.save();

        const newTask = user.tasks[user.tasks.length - 1]; // Get the newly added task

        res.status(201).json({ success: true, message: 'Task created successfully', task: newTask });

    } catch (err) {
        console.error(err.message);
        next(err);
    }
});

/**
 * @route PUT /api/users/:id/tasks/:taskId
 * @desc Update a specific task for a user
 * @access Private
 */
router.put('/:id/tasks/:taskId', protect, updateTaskValidation, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const task = checkTaskOwnership(user, req.params.taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found or not owned by user' });
        }

        // Update task fields
        Object.assign(task, req.body);
        task.updatedAt = Date.now(); // Manually update updatedAt for subdocuments

        await user.save(); // Save the parent document

        res.status(200).json({ success: true, message: 'Task updated successfully', task });

    } catch (err) {
        console.error(err.message);
        next(err);
    }
});

/**
 * @route DELETE /api/users/:id/tasks/:taskId
 * @desc Delete a specific task for a user
 * @access Private
 */
router.delete('/:id/tasks/:taskId', protect, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const task = checkTaskOwnership(user, req.params.taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found or not owned by user' });
        }

        task.remove(); // Remove subdocument
        await user.save();

        res.status(200).json({ success: true, message: 'Task deleted successfully' });

    } catch (err) {
        console.error(err.message);
        next(err);
    }
});


module.exports = router;