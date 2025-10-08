const mongoose = require('mongoose');

async function connect() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ MongoDB connected:', process.env.MONGO_URI);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

module.exports = { connect };
