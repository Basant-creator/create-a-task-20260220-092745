// 
// Create JavaScript with: (Should be MongoDB connection setup)
// - Event listeners (Mongoose connection events)
// - Form handling (not applicable)
// - Smooth scrolling/animations (not applicable)
// - Mobile menu toggle (not applicable)
// - Any interactive features (MongoDB connection)

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // useNewUrlParser: true, // Deprecated in Mongoose 6+
            // useUnifiedTopology: true, // Deprecated in Mongoose 6+
            // useCreateIndex: true // Deprecated in Mongoose 6+
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;