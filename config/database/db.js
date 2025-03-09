const mongoose = require('mongoose');

async function connect(){
    try {
        await mongoose.connect('mongodb://localhost/quanlitiendo', {});
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = {connect};
