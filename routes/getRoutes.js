const router = require('express').Router();
const User = require('../models/user');
const Post = require('../models/post');
const Message = require('../models/message');

//function to determine if the session has a logged in account
const isLoggedIn = (req, res, next) => {
    const userID = req.user;
    if (userID) {
        return next();
    }
    res.redirect('/login');
}

router.get('/', (req, res) => {
    const userID = req.user;
    res.render('index', { userID });
});

router.get('/map', (req, res) => { 
    const userID = req.user;
    res.render('map', { userID });
});

router.get('/login', (req,res) => {
    res.render('login', {"error":false});
});

router.get('/register', (req,res) => {
    const error = req.query.error || "";
    res.render('register', {error:error});
});

router.get('/create', isLoggedIn, (req,res) => {
    const userID = req.user;
    res.render('create', {userID});
});

router.get('/failureLogin', (req,res) => {
    res.render('login',{"error":"Invalid username or password"});
});

router.get('/settings/:id', isLoggedIn, async (req,res) => {
    const userID = req.user;
    const id = req.params.id;
    const sucess = req.query.success || false;

    if (id == userID._id) {
        res.render('settings', {userID, sucess});
    } else {
        res.redirect('/');
    }
});

router.get('/messages', isLoggedIn, async (req,res) => {
    try {
        const user = req.user;
        const allUsers = await User.find({});
        const usernames = allUsers.map(user => ({ username: user.username, photo: user.photo }));
        const otherUsers = usernames.filter(username => username.username !== user.username);
        const messageList = await Message.find({ members: { $in: [user.username] } });
        const error = req.query.error || false;

        res.render('messages', {user , usernames, otherUsers, messageList, error: error});
    } catch {
        res.redirect('/');
    }
});

router.get('/viewMessage/:id', async (req,res) => {
    try {
        const user = req.user;
        const message = await Message.findOne({ _id: req.params.id });
        const messageList = message.messages;
        const otherUser = await User.findOne({username: message.members.filter(member => member !== user.username)[0]});
        const otherUserInformation = { username: otherUser.username, photo: otherUser.photo };
        const error = req.query.error || "";
        res.render('viewMessage', {user, message, messageList, otherUserInformation, error: error});
    } catch {
        res.redirect('/messages');
    }
});

router.get('/account/:id', async (req,res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        const userID = req.user;
        if (userID){
            //determines if the user is viewing their own account
            const isAccountOwner = (JSON.stringify(userID._id) == JSON.stringify(user._id));
            res.render('account', {user, userID, isAccountOwner});

        } else {
            userID = {
                _id: "0",
                username: "Guest",
            }
            res.render('account', {user, userID, isAccountOwner: false});
        }
    } catch {
        res.redirect('/');
    }
});

router.get('/viewPost/:id', async (req,res) => {
    try {
        const userID = req.user;
        const post = await Post.findOne({ _id: req.params.id });
        const error = req.query.error || "";

        if (userID) {
            //determines authentication of user, if post owner or server admin
            const admin = userID.admin;
            const isOwner = (JSON.stringify(userID._id) == JSON.stringify(post.owner._id));

            res.render('viewPost', {post, admin, isOwner, userID, error: error});
        } else {
            const admin = false;
            const isOwner = false;

            res.render('viewPost', {post, admin, isOwner, userID, error: error});
        }
    } catch {
        res.redirect('/');
    }
});

router.get('/favourites', isLoggedIn, async (req,res) => {
    try {
        const userID = req.user;
        const posts = await Post.find({_id: userID.favouritePosts});
        // used since the viewAllPosts page is used for both viewing all posts and viewing favourite posts
        const isFavouritePage = true;

        res.render('viewAllPosts', {posts, userID, isFavouritePage});
    } catch {
        res.redirect('/');
    }
});

router.get('/viewAllPosts/:id', async (req,res) => {
    try{
        const userID = req.user;
        const posts = await Post.find({username: req.params.id});
        const isFavouritePage = false;
        res.render('viewAllPosts', {posts, userID,isFavouritePage});
    } catch {
        res.redirect('/');
    }
});

module.exports = router;