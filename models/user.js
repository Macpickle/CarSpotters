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
    favouritePosts: {
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
        appearence: "system", 
        messagePrivacy: "everyone", 
        postPrivacy: "everyone", 
        followingPrivacy: "everyone", 
        accountPrivacy: "everyone"
        }
    }, 
});

module.exports = mongoose.model('User', userSchema);