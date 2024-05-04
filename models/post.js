const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    usernameID: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    photo: {
        type: String,
        required: true
    },
    allowComments: {
        type: Boolean,
        required: true
    },
    likes: {
        type: Number,
        required: true
    },
    comments: {
        type: Array,
        required: false
    },
    date: {
        type: String,
        required: true
    },
    carModel: {
        type: String,
        required: true
    },
    carTitle: {
        type: String,
        required: true
    }
}); 

module.exports = mongoose.model('Post', userSchema);