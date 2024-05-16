const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    ownerPhoto: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    postID: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        required: true
    }, 
    date: {
        type: String,
        timestamps: true
    },
    commentID: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Comment', commentSchema);