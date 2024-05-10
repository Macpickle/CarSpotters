const mongoose = require('mongoose');
const post = require('./post');

//user model (add more later)
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: false,
        default: "https://i.imgur.com/jNNT4LE.png"
    },
    bio: {
        type: String,
        required: false,
        default: "Hello, welcome to my profile!"
    },
    followers: {
        type: Array,
        required: false
    },
    following: {
        type: Array,
        required: false
    },
    followersCount: {
        type: Number,
        required: false,
        default: 0
    },
    followingCount: {
        type: Number,
        required: false,
        default: 0
    },
    postCount: {
        type: Number,
        required: false,
        default: 0
    },
    postIDs: {
        type: Array,
        required: false
    },
    postPhotos: {
        type: Array,
        required: false
    },
    admin: {
        type: Boolean,
        required: false,
        default: false
    },
    settings:{
        type: Object,
        required: false,
    default: {
        appearence: "light", 
        messagePrivacy: "everyone", 
        postPrivacy: "everyone", 
        followingPrivacy: "everyone", 
        accountPrivacy: "everyone"
        }
    }
    
});

module.exports = mongoose.model('User', userSchema);