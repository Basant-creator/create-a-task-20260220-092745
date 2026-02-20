// 
// Create JavaScript with: (Should be Mongoose Schema definition)
// - Event listeners (Mongoose hooks)
// - Form handling (via API endpoints)
// - Smooth scrolling/animations (not applicable for backend)
// - Mobile menu toggle (not applicable for backend)
// - Any interactive features (Mongoose methods)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Subdocument Schema for Tasks
const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [100, 'Task title cannot be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Task description cannot be more than 500 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    dueDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Main User Schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Do not return password by default
    },
    // Tasks embedded as an array of subdocuments
    tasks: [TaskSchema], 
    settings: {
        notificationEmail: {
            type: String,
            enum: ['immediate', 'daily', 'weekly', 'none'],
            default: 'daily'
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        defaultTaskStatus: {
            type: String,
            enum: ['pending', 'in-progress'],
            default: 'pending'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Mongoose Hooks
// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Update `updatedAt` field on save
UserSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});


// Mongoose Methods
// Compare user entered password to hashed password in DB
UserSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);