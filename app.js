require('dotenv').config();

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

const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');

const app = express();

mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const store = new MongoDBStore({
    mongooseConnection: process.env.DATABASE_URL,
    databaseName: 'CarSpotters_DB',
    collection: 'sessions'
});

app.use(express.static(path.join(__dirname, 'src')));
app.use(flash());
app.use(fileUpload())


// Catch errors
store.on('error', function(error) {
    console.log(error);
});

// Set the view engine to ejs
app.set('view engine', 'ejs');

const IN_PRODUCTION = process.env.NODE_ENV === 'production';

// Middleware
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

const isLoggedIn = (req, res, next) => {
    const userID = req.user;
    if (userID) {
        return next();
    }
    res.redirect('/login');
}

initpassport(
    passport,
    async username => await User.findOne({ username: username }),
    async id => await User.findOne({ _id: id })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended: false}));

//routes
app.get('/', async (req,res) => {
    const userID = req.user;
    res.render('index', { userID });
});

app.get("/map", async (req,res) => {
    const userID = req.user;
    res.render('map', { userID });
});

app.get('/data', async (req,res) => {
    const posts = await Post.find({});
    res.send(posts);
});

app.post('/data', async (req,res) => {
    const posts = await Post.find({});
    res.send(posts);
});

app.get('/account/:id', isLoggedIn, async (req,res) => {
    const user = await User.findOne({ _id: req.params.id });
    res.render('account', {user});
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
    const userID = req.user;
    const post = await Post.findOne({ _id: req.params.id });
    res.render('viewPost', {post});
});

app.get('/settings/:id', isLoggedIn, async (req,res) => {
    const userID = req.user;
    res.render('settings', {userID});
});

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureMessage: true,
    failureFlash: true,
}), (req, res) => {
    // If the user is authenticated, redirect to the home page
    app.use(function(req, res, next){
        next();
    });
    const userID = req.user;
    res.render('index', {userID});
});

app.post('/logout', (req,res) => {
    req.logout(() => {
        req.session.destroy();
        res.clearCookie('sid')
        res.redirect('/');
    });
});

app.post('/create', async (req,res) => {
    try{
        const newPost = new Post({
            username: req.user.username,
            location:  req.body.location,
            description: req.body.description,
            photo: req.body.img,  
            allowComments: true,
            likes: 0,
            comments: [],
            date: (new Date()).toDateString().substring(0,10),
            carModel: req.body.carModel,
            carTitle: req.body.carName,
            _id: new mongoose.Types.ObjectId().value
        });
            req.user.postIDs.push(newPost); // should probably be post ID's instead of creating a copy of post, fix later
            req.user.postCount += 1;
            req.user.save();
            newPost.save();

            console.log("Post created successfully!")
            res.redirect('/');
    } catch {
        const userID = req.user; 
        console.log("Error creating post")
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
        res.redirect('/login');
    } catch {
        // catches any unexpected errors
        res.render('register', { error: 'Error registering user' });
    }
});

app.post('/change-bio', async (req,res) => {
    req.user.bio = req.body.bio;
    req.user.save();
    res.redirect(`/account/${req.user._id}`);
});

app.post('/change-username', async (req,res) => {
    req.user.username = req.body.username;
    req.user.save();
    res.redirect(`/account/${req.user._id}`);
});

app.post('/change-password', async (req,res) => {
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
});

app.post('/change-email', async (req,res) => {
    const validEmail = (req.body.email === req.user.email)
    if (!validEmail || req.body.newEmail === req.user.email) {
        res.redirect(`/settings/${req.user._id}`);
    } else {
        req.user.email = req.body.email;
        req.user.save();
        res.redirect(`/account/${req.user._id}`);
    }
});

app.post('/delete-account', async (req,res) => {
    const validPassword = await bcrypt.compare(req.body.password, req.user.password);
    if (!validPassword) {
        res.redirect(`/settings/${req.user._id}`);
    } else {
        await User.deleteOne({ _id: req.user._id });
        req.logout(() => {
            req.session.destroy();
            res.clearCookie('sid')
            res.redirect('/');
        });
    }
});

//handing settings changes 
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

module.exports = app;
