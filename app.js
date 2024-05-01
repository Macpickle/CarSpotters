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

app.get('/account', isLoggedIn, (req,res) => {
    const userID = req.user;
    res.render('account', { userID });
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
    console.log(post.description);
    console.log(post);
    res.render('viewPost', {post});
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
            _id: new mongoose.Types.ObjectId()
        });
            newPost.save();
            console.log(req.body.img);
            console.log("Post created successfully!")
            res.redirect('/');
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
        res.redirect('/login');
    } catch {
        // catches any unexpected errors
        res.render('register', { error: 'Error registering user' });
    }
});

app.listen((process.env.PORT) , () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

module.exports = app;
