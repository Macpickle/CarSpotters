require('dotenv').config(); // for environment variables

const getRoutes = require('./routes/getRoutes.js');
const postRoutes = require('./routes/postRoutes.js');
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
app.use(getRoutes);
app.use(postRoutes);

//sends all posts to request
app.post('/data', async (req,res) => {
    const posts = await Post.find({});
    res.send(posts);
});

app.listen((process.env.PORT) , () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
module.exports = app;
