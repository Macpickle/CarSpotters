const mongoose = require('mongoose');

const messagesSchema = new mongoose.Schema({
    members: {
        type: Array,
        required: true
    },
    messages: {
        type: Array,
        required: false
    },
});

module.exports = mongoose.model('Message', messagesSchema);