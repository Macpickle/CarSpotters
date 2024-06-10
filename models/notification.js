const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { 
        type: String,
        required: true
    },
    sender: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    reference: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Notification', notificationSchema);