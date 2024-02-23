// handles all pages, encryption and authentication
const express = require('express');
const router = express.Router();
const User = require('../models/users');
const app = express();
const methodOverride = require('method-override');
const passport = require('passport');
const initpassport = require('../passport-config');
const bcrypt = require('bcrypt');

//initalize passport
initpassport(
    passport,
    async username => await User.findOne({ username: username }),
    async id => await User.findOne({ id: id })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

//routes
router.get('/', function(req, res) {
    res.render('index.ejs', {user: req.user});
});

router.get('/login', function(req, res) {
    res.render('login', { error: '' });
});  

router.get('/register', function(req, res) {
    res.render('register', { error: '' });
});

router.post('/register', async (req, res) => {
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
            password: hashedPassword
        });

        // Save the user to the database
        newUser.save();
        res.redirect('/login');
    } catch {
        // catches any unexpected errors
        res.render('register', { error: 'Error registering user' });
    }
});

router.get('/error', (req, res) => {
    res.render('login', { error: 'Invalid username or password'});
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/error',
    failureMessage: true,
    failureFlash: true,
}), (req, res) => {
    // If the user is authenticated, redirect to the home page
    res.render('index.ejs', { user: req.user.username });
});

router.post('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

module.exports = router;