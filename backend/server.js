// 
// Create JavaScript with:
// - Event listeners (express routing)
// - Form handling (via API endpoints)
// - Smooth scrolling/animations (not applicable for backend)
// - Mobile menu toggle (not applicable for backend)
// - Any interactive features (backend APIs are interactive features)

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { protect } = require('./middleware/auth'); // Import protect middleware

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Body parser for JSON
app.use(helmet()); // Basic security headers

// Serve static files from the 'public' and 'app' directories
// This is for development convenience. In production, a dedicated web server (Nginx/Apache) would typically serve these.
app.use(express.static('public'));
app.use('/app', protect, express.static('app')); // Protect app folder with auth middleware


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // User routes, including task management

// Basic error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));