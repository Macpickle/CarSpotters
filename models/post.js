const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    owner: {
        type: Object,
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
        type: Array,
        required: true
    },
    favourites: {
        type: Array,
        required: false,
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

module.exports = mongoose.model('Post', postSchema);