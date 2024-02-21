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
    res.render('index');
});

router.get('/login', function(req, res) {
    res.render('login');
});

router.get('/register', function(req, res) {
    res.render('register', { error: '' });
});

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.render('register', { error: 'Please fill in all fields...' });
        }

        const existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] });
        if (existingUser) {
            return res.redirect('/register', { error: 'User already exists.' });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({
                id: Date.now().toString(),
                username,
                email,
                password: hashedPassword
            });
            user.save();
            return res.redirect('/login');
        }
    } catch (error) {
        return res.redirect('/register');
    }
});

router.post('/login',  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}) );

router.delete('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

module.exports = router;