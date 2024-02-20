// handles all pages, encryption and authentication
const express = require('express');
const router = express.Router();
const User = require('../models/users');
const bcrypt = require('bcrypt');
const app = express();
const methodOverride = require('method-override');
const passport = require('passport');
const initpassport = require('../passport-config');

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
// homepage
router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/login', function(req, res, next) {
    res.render('login');
});

router.get('/register', function(req, res, next) {
    res.render('register');
});

router.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            id: Date.now().toString(),
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        });
        user.save();
        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
});

router.post('/login',  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

router.delete('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

module.exports = router;