require('dotenv').config(); // for environment variables

const express = require('express');
const session = require('express-session'); 
const path = require('path');
const passport = require('passport');
const initpassport = require('./passport-config.js');
const User = require('./models/user.js');
const Post = require('./models/post.js');
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
    resave: false,
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
            const isOwner = (userID._id == post.usernameID);
            const postOwner = await User.findOne({ _id: post.usernameID });
            const postOwnerPhoto = postOwner.photo;
            res.render('viewPost', {post, admin, isOwner, postOwnerPhoto});
        } else {
            const admin = false;
            const isOwner = false;
            const postOwner = await User.findOne({ _id: post.usernameID });
            const postOwnerPhoto = postOwner.photo;

            res.render('viewPost', {post, admin, isOwner, postOwnerPhoto});
        }
    } catch {
        res.redirect('/');
    }
});

app.get('/viewAllPosts/:id', async (req,res) => {
    try{
        const userID = req.user;
        const posts = await Post.find({username: req.params.id});
        res.render('viewAllPosts', {posts, userID});
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

app.post('/favouritePost', async (req,res) => {
    try {
        const post = await Post.findOne({_id: req.body.postID});
        const sessionUser = await User.findOne({ _id: req.body.user });

        if (post.username == sessionUser.username) {
            res.json({"ok":false, "isFavourited": false, "favourites": post.favourites});
        } else {
            if (post.favouriteArray.includes(sessionUser.username)) {
                const index = post.favouriteArray.indexOf(sessionUser.username);
                post.favouriteArray.splice(index, 1);
                post.favourites -= 1;
            } else {
                post.favouriteArray.push(sessionUser.username);
                post.favourites += 1;
            }
                
            post.save();
            res.json({"ok":true, "isFavourited": post.favouriteArray.includes(sessionUser.username), "favourites": post.favourites});
        }
    } catch (error) {
        console.log(error);
        res.json({"ok":false});
    }
});

app.post('/likePost', async (req,res) => {
    try {
        const post = await Post.findOne({_id: req.body.postID});
        const sessionUser = await User.findOne({ _id: req.body.user });

        if (post.username == sessionUser.username) {
            res.json({"ok":false, "isLiked": false, "likes": post.likes});
        } else {
            if (post.likeArray.includes(sessionUser.username)) {
                const index = post.likeArray.indexOf(sessionUser.username);
                post.likeArray.splice(index, 1);
                post.likes -= 1;
            } else {
                post.likeArray.push(sessionUser.username);
                post.likes += 1;
            } 

            post.save();
            res.json({"ok":true, "likes": post.likes, "isLiked": post.likeArray.includes(sessionUser.username)});
        }
    } catch (error) {
        console.log(error);
        res.json({"ok":false});
    }
});

app.post('/followUser', async (req,res) => {
    try {
        const accountUser = await User.findOne({ _id: req.body.user });
        const sessionUser = await User.findOne({ _id: req.body.userID });
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
        res.json({"followingCount": accountUser.followersCount, "isFollowing": accountUser.followers.includes(sessionUser.username)});
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

app.post('/getUserPhoto', async (req,res) => {
    const user = await User.findOne({username: req.body.username});
    res.json(user.photo);
});

app.post('/changeProfilePicture', async (req,res) => {
    try{
        const user = await User.findOne({ _id: req.body.userID });
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

            //create post via Schema
            const newPost = new Post({
                username: req.user.username,
                usernameID: req.user._id,
                location:  req.body.location,
                description: req.body.description,
                photo: imageLink, 
                allowComments: true,
                likes: 0,
                comments: [],
                date: (new Date()).toDateString().substring(0,10),
                carModel: req.body.carModel,
                carTitle: req.body.carName,
                _id: new mongoose.Types.ObjectId().value
            });

            //update user's post cound, postIDs, and postPhotos, then saves into database.
            req.user.postPhotos.push(newPost.photo); 
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

app.listen((process.env.PORT) , () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

//handle if user tries to access a page that doesnt exist
app.get('*', (req,res) => {
    res.render('404');
});

module.exports = app;
