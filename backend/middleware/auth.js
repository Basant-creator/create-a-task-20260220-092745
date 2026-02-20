// 
// Create authentication JavaScript with: (Should be Express Middleware)
// - Form validation (not here)
// - API calls to backend (not here)
// - Token storage (not here)
// - Redirect after login/signup (frontend responsibility)
// - Error handling (here, for token validation)
// - Loading states (frontend responsibility)

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user from token payload to request
            req.user = await User.findById(decoded.id).select('-password'); // Exclude password
            
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }

            next();
        } catch (err) {
            console.error(err);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

module.exports = { protect };