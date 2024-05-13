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
    ownerPhoto: {
        type: String,
        required: true,
        default: "https://i.imgur.com/jNNT4LE.png"
    },
    allowComments: {
        type: Boolean,
        required: true
    },
    likes: {
        type: Number,
        required: true
    },
    likeArray: {
        type: Array,
        required: false,
    },
    favourites: {
        type: Number,
        required: false,
        default: 0
    },
    favouriteArray: {
        type: Array,
        required: false
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