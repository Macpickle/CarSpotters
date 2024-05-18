require('dotenv').config(); // for environment variables

const express = require('express');
const session = require('express-session'); 
const path = require('path');
const passport = require('passport');
const initpassport = require('./passport-config.js');
const User = require('./models/user.js');
const Post = require('./models/post.js');
const Message = require('./models/message.js');
const Comment = require('./models/comment.js');
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser');

const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');

const app = express();

//connects mongoose to the mongoDB database
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

//creates a new session store to store sessions from users
const store = new MongoDBStore({
    mongooseConnection: process.env.DATABASE_URL,
    databaseName: 'CarSpotters_DB',
    collection: 'sessions'
});

// allows the use of the ejs templating engine
app.use(express.static(path.join(__dirname, 'src')));
app.use(flash());
app.use(fileUpload())

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Parse JSON bodies
app.use(bodyParser.json());

// Catch errors
store.on('error', function(error) {
    console.log(error);
});

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Check if the app is in production
const IN_PRODUCTION = process.env.NODE_ENV === 'production';

// stores session data
app.use(session({
    name: 'sid',
    resave: true,
    saveUninitialized: false,
    secret: process.env.SECRET_KEY,
    store: store,
    cookie: {
        maxAge: parseInt(process.env.SESSION_LIFE),
        sameSite: true,
        secure: IN_PRODUCTION
        },
    }
));

//function to determine if the session has a logged in account
const isLoggedIn = (req, res, next) => {
    const userID = req.user;
    if (userID) {
        return next();
    }
    res.redirect('/login');
}

// passport middleware, used to authenticate users
initpassport(
    passport,
    async username => await User.findOne({ username: username }),
    async id => await User.findOne({ _id: id })
);

//passport initialization
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended: false}));

//get current user and colour scheme
app.use((req, res, next) => {
    res.locals.user = req.user;
    if (req.user) {
        res.locals.colourScheme = req.user.settings.appearence;
    }
    next();
});

//routes
app.get('/', async (req,res) => {
    const userID = req.user;
    res.render('index', { userID });
});

app.get("/map", async (req,res) => {
    try{
        const userID = req.user;
        res.render('map', { userID });
    } catch {
        res.redirect('/');
    }
});

app.get('/messages', isLoggedIn, async (req,res) => {
    try {
        const user = req.user;
        const allUsers = await User.find({});
        const usernames = allUsers.map(user => ({ username: user.username, photo: user.photo }));
        const otherUsers = usernames.filter(username => username.username !== user.username);
        const messageList = await Message.find({ members: { $in: [user.username] } });

        res.render('messages', {user , usernames, otherUsers, messageList});
    } catch {
        res.redirect('/');
    }
});

app.get('/viewMessage/:id', async (req,res) => {
    try {
        const user = req.user;
        const message = await Message.findOne({ _id: req.params.id });
        const messageList = message.messages;
        const otherUser = await User.findOne({username: message.members.filter(member => member !== user.username)[0]});
        const otherUserInformation = { username: otherUser.username, photo: otherUser.photo };
        res.render('viewMessage', {user, message, messageList, otherUserInformation});
    } catch {
        res.redirect('/messages');
    }
});

//sends all posts to request
app.get('/data', async (req,res) => {
    const posts = await Post.find({});
    res.send(posts);
});

app.post('/data', async (req,res) => {
    const posts = await Post.find({});
    res.send(posts);
});

app.get('/account/:id', async (req,res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        var userID = req.user;
        if (userID){
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

app.get('/login', (req,res) => {
    res.render('login',{"error":false});
});

app.get('/register', (req,res) => {
    res.render('register',{"error":false});
});

app.get('/create', isLoggedIn, (req,res) => {
    const userID = req.user;
    res.render('create', {userID});
});

app.get('/viewPost/:id', async (req,res) => {
    try {
        // finds post by id
        const userID = req.user;
        const post = await Post.findOne({ _id: req.params.id });
        if (userID) {
            const admin = userID.admin;
            const isOwner = (JSON.stringify(userID._id) == JSON.stringify(post.owner._id));

            res.render('viewPost', {post, admin, isOwner, userID});
        } else {
            const admin = false;
            const isOwner = false;

            res.render('viewPost', {post, admin, isOwner, userID});
        }
    } catch {
        res.redirect('/');
    }
});

app.get('/favourites', isLoggedIn, async (req,res) => {
    try {
        const userID = req.user;
        const posts = await Post.find({_id: userID.favouritePosts});
        const isFavouritePage = true;
        res.render('viewAllPosts', {posts, userID, isFavouritePage});
    } catch {
        res.redirect('/');
    }
});

app.get('/viewAllPosts/:id', async (req,res) => {
    try{
        const userID = req.user;
        const posts = await Post.find({username: req.params.id});
        const isFavouritePage = false;
        res.render('viewAllPosts', {posts, userID,isFavouritePage});
    } catch {
        res.redirect('/');
    }
});

app.get('/settings/:id', isLoggedIn, async (req,res) => {
    try {
        const userID = req.user;
        res.render('settings', {userID});
    } catch {
        res.redirect('/');
    }
});

//used if user fails to login, used for error messages
app.get('/failureLogin', (req,res) => {
    res.render('login',{"error":"Invalid username or password"});
});

app.post('/login', passport.authenticate('local', {
    failureRedirect:  '/failureLogin',
    failureMessage: true,
    failureFlash: true
}), (req, res) => {
    // If the user is authenticated, redirect to the home page, session is saved
    res.redirect('/');
});

app.post('/logout', (req,res) => {
    req.logout(() => {
        req.session.destroy();
        res.clearCookie('sid'); // sid: name of cookie, change to secret later
        res.redirect('/');
    });
});

app.post('/commentPost', async (req,res) => {
    try {
        const post = await Post.findOne({_id: req.body.postID});

        if (!req.body.comment) {
            res.redirect(`/viewPost/${post._id}`);
        } else {

        const sessionUser = req.user;
        const newComment = new Comment({
            username: sessionUser.username,
            ownerPhoto: sessionUser.photo,
            comment: req.body.comment,
            postID: post._id,
            likes: 0,
            date: (new Date()).toDateString().substring(0,10),
            commentID: new mongoose.Types.ObjectId()
        });
        
        post.comments.push(newComment);
        post.save();
        res.redirect(`/viewPost/${post._id}`);
        }
    } catch {
        res.redirect('/');
    }
});

app.post('/sendMessage', async (req,res) => {
    try {
        const sender =  await User.findOne({ username: req.body.sender });
        const receiver = await User.findOne({ username: req.body.receiver });
        const message = req.body.message;

        if (sender.username == receiver.username) {
            res.redirect('/messages');
        }

        const existingMessage = await Message.findOne({ members: { $all: [sender.username, receiver.username] } });

        if (existingMessage) {
            res.redirect('/messages');
        } else {

            const newMessage = new Message({
                members: [sender.username, receiver.username],
                messages: [
                    {
                        sender: sender.username,
                        message: message,
                        date: (new Date()).toDateString().substring(0,10),
                    }
                ]
            });
        
            newMessage.save();
            res.redirect('/messages');
        }
    } catch {
        res.redirect('/');
    }
});

app.post('/deleteComment/:id', async (req,res) => {
    try {
        const post = await Post.findOne({ _id: req.body.postID });
        for (let i = 0; i < post.comments.length; i++) {
            if (post.comments[i].commentID == req.params.id) {
                post.comments.splice(i, 1);
                break;
            }
        }
        post.save();
        res.redirect(`/viewPost/${post._id}`);

    } catch (err) {
        console.log(err);
        res.redirect('/');
    }

});

app.post('/favouritePost', async (req,res) => {
    try {
        const post = await Post.findOne({_id: req.body.postID});
        const sessionUser = await User.findOne({ _id: req.body.userID });

        if (post.username == sessionUser.username) {
            res.json({"ok":false, "isClicked": false, "value": post.favourites.length});
            
        } else {
            if (post.favourites.includes(sessionUser.username)) {
                const index = post.favourites.indexOf(sessionUser.username);
                sessionUser.favouritePosts.splice(index, 1);
                post.favourites.splice(index, 1);

            } else {
                post.favourites.push(sessionUser.username);
                sessionUser.favouritePosts.push(post._id);
            }
                
            sessionUser.save();
            post.save();
            res.json({"ok":true, "isClicked": post.favourites.includes(sessionUser.username), "value": post.favourites.length});
        }

    } catch (error) {
        res.json({"ok":false});
    }
});

app.post('/likePost', async (req,res) => {
    try {
        const post = await Post.findOne({_id: req.body.postID});
        const sessionUser = await User.findOne({ _id: req.body.userID });

        if (post.username == sessionUser.username) {
            res.json({"ok":false, "isClicked": false, "value": post.likes.length});
        } else {
            if (post.likes.includes(sessionUser.username)) {
                const index = post.likes.indexOf(sessionUser.username);
                post.likes.splice(index, 1);
            } else {
                post.likes.push(sessionUser.username);
            } 

            post.save();
            res.json({"ok":true, "isClicked": post.likes.includes(sessionUser.username), "value": post.likes.length});
        }
    } catch (error) {
        res.json({"ok":false});
    }
});

app.post('/followUser', async (req,res) => {
    try {
        const accountUser = await User.findOne({ _id: req.body.sessionUser });
        const sessionUser = await User.findOne({ _id: req.body.accountUser });
        if (accountUser.followers.includes(sessionUser.username)) {
            const index = sessionUser.following.indexOf(accountUser.username);
            sessionUser.following.splice(index, 1);
            const index2 = accountUser.followers.indexOf(sessionUser.username);
            accountUser.followers.splice(index2, 1);
            accountUser.followersCount -= 1;
            sessionUser.followingCount -= 1;
            sessionUser.save();
            accountUser.save();
        } else {
            sessionUser.following.push(accountUser.username);
            accountUser.followers.push(sessionUser.username);
            accountUser.followersCount += 1;
            sessionUser.followingCount += 1;
            sessionUser.save();
            accountUser.save();
        }
        res.json({"followingCount": accountUser.followers.length, "isFollowing": accountUser.followers.includes(sessionUser.username)});
    } catch {
        res.json({"ok":false, "followingCount": 0});
    }
});

app.post('/deletePost/:id', async (req,res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id });
        const user = await User.findOne({ _id: post.usernameID });
        const index = user.postIDs.indexOf(post.photo);
        user.postIDs.splice(index, 1);
        user.postPhotos.splice(index, 1);
        user.postCount -= 1;
        user.save();

        await Post.deleteOne({ _id: req.params.id });
        res.redirect('/');
    } catch {
        res.redirect('/');
    }
});

app.post('/changeProfilePicture', async (req,res) => {
    try{
        const user = await User.findOne({ _id: req.body.userID });
        const posts = await Post.find({ username: user.username });
        var photoData = req.files.photo.data.toString('base64');
        const formData = new FormData();
        formData.append('image', photoData);

        fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                Authorization: "Client-ID " + process.env.IMGUR_CLIENT_ID,
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            user.photo = data.data.link;
            user.save();
            
            posts.forEach(post => {
                post.owner = {
                    _id: user._id,
                    username: user.username,
                    photo: user.photo,
                };
                post.save();
            });
            
            res.json({"ok":true});
        }).catch(err => {
            console.log(err);
        });
    } catch {
        res.json({"ok":false});
    }
});

app.post('/create', async (req,res) => {
    try {
        //upload image to imgur
        const img = req.files.img;
        const formData = new FormData();
        formData.append('image', img.data.toString('base64'));

        fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                Authorization: "Client-ID " + process.env.IMGUR_CLIENT_ID,
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            //gets image link returned by JSON of imgur API
            const imageLink = data.data.link;

            //create owner information, only useful for the post schema
            const ownerInformation = {
                _id: req.user._id,
                username: req.user.username,
                photo: req.user.photo,
            }

            //create post via Schema
            const newPost = new Post({
                username: req.user.username,
                owner: ownerInformation,
                location: req.body.location,
                description: req.body.description,
                photo: imageLink,
                allowComments: true,
                likes: [],
                favourites: [],
                comments: [],
                date: (new Date()).toDateString().substring(0,10),
                carModel: req.body.carModel,
                carTitle: req.body.carName,
            });

            //update user's post cound, postIDs, and postPhotos, then saves into database.
            req.user.postPhotos.push(imageLink);
            req.user.postIDs.push(newPost._id);
            req.user.postCount += 1;
            req.user.save();
            newPost.save();

            res.redirect('/');
        });
    } catch {
        const userID = req.user; 
        res.render('create', {userID});
    }
});

app.post('/register', async (req, res) => {
    try {
        // Check if user already exists by username or email
        const existingUser = await User.findOne({ 
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ]
        });
        if (existingUser) {
            // User already exists
            res.render('register', { error: 'User already exists!' });
            return;
        }
        // Hash the password (bcrypt)
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        
        // Create a new user
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            _id: new mongoose.Types.ObjectId()
        });

        // Save the user to the database
        newUser.save();
        res.redirect(`/login?username=${req.body.username}`);
    } catch {
        // catches any unexpected errors
        res.render('register', {error: 'Error registering user' });
    }
});

app.post('/change-bio', async (req,res) => {
    try {
        req.user.bio = req.body.bio;
        req.user.save();
        res.redirect(`/account/${req.user._id}`);
    } catch {
        res.redirect(`/settings/${req.user._id}`);
    }
});

app.post('/change-username', async (req,res) => {
    try {
        req.user.username = req.body.username;

        const validUsername = await User.findOne({ username: req.body.username });

        if (validUsername) {
            res.redirect(`/settings/${req.user._id}`);
        } else {
            req.user.save();
            res.redirect(`/account/${req.user._id}`);
        }
    } catch {
        res.redirect(`/settings/${req.user._id}`);
    }
});

app.post('/change-password', async (req,res) => {
    try {
        const validPassword = await bcrypt.compare(req.body.password, req.user.password);
        if (!validPassword || req.body.newPassword === req.body.password) {
            console.log("Incorrect password or SAME password");
            res.redirect(`/settings/${req.user._id}`);
        } else {
            const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
            req.user.password = hashedPassword;
            req.user.save();
            console.log("Password changed successfully!");
            res.redirect(`/account/${req.user._id}`);
        }
    } catch {
        res.redirect(`/settings/${req.user._id}`);
    }
});

app.post('/change-email', async (req,res) => {
    try {
        const validEmail = (req.body.email === req.user.email)
        const existingEmail = await User.findOne({email: req.body.newEmail});

        if (!validEmail || req.body.newEmail === req.user.email || existingEmail) {
            res.redirect(`/settings/${req.user._id}`);
        } else {
            req.user.email = req.body.newEmail;
            req.user.save();
            res.redirect(`/account/${req.user._id}`);
        }
    } catch {
        res.redirect(`/settings/${req.user._id}`);
    }
});

app.post('/delete-account', async (req,res) => {
    try {
        const validPassword = await bcrypt.compare(req.body.password, req.user.password);
        if (!validPassword) {
            res.redirect(`/settings/${req.user._id}`);
        } else {
            await User.deleteOne({ _id: req.user._id });

            await Post.deleteMany({ username: req.user.username });

            req.logout(() => {
                req.session.destroy();
                res.clearCookie('sid')
                res.redirect('/');
            });
        }
    } catch {
        res.redirect(`/settings/${req.user._id}`);
    }
});

//handing settings changes, updates the user's settings in the database
function updateSetting(req, res, settingType, settingValue) {
    const update = { $set: {} };
    update.$set[`settings.${settingType}`] = settingValue;

    User.findOneAndUpdate({ _id: req.user._id }, update, { new: true })
        .then(doc => {
            res.redirect(`/account/${req.user._id}`);
        })
        .catch(err => {
            //unexpected error
            res.redirect(`/settings/${req.user._id}`);
        });
}

app.post('/change-theme', async (req,res) => {
    const theme = req.body.theme;
    updateSetting(req, res, 'appearence', theme);
});

app.post('/change-message-privacy', async (req,res) => {
    const messagePrivacy = req.body.messagePrivacy;
    updateSetting(req, res, 'messagePrivacy', messagePrivacy);
});

app.post('/change-post-privacy', async (req,res) => {
    const postPrivacy = req.body.postPrivacy;
    updateSetting(req, res, 'postPrivacy', postPrivacy);
});

app.post('/change-following-privacy', async (req,res) => {
    const postPrivacy = req.body.followingPrivacy;
    updateSetting(req, res, 'followingPrivacy', postPrivacy);
});

app.post('/change-account-privacy', async (req,res) => {
    const postPrivacy = req.body.accountPrivacy;
    updateSetting(req, res, 'accountPrivacy', postPrivacy);
});

//handle if user tries to access a page that doesnt exist
app.get('*', (req,res) => {
    res.render('404');
});

app.listen((process.env.PORT) , () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
module.exports = app;
