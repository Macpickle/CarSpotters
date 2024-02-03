if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

//constants
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const initpassport = require('./passport-config');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');

initpassport(passport,
    username => users.find(user => user.username === username),
    id => users.find(user => user.id === id)
);

//need to attach database
const users = [];

//middleware
app.use(function(req, res, next){
    res.locals.session = req.session;
    res.locals.isAuthenticated = req.isAuthenticated;
    next();
});

app.use(express.json());
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
   res.render('', { isAuthenticated: req.isAuthenticated() })
});

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register');
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login', { showLoginButton: true });
});

app.get('/users', checkAuthenticated, (req, res) => {
    res.json(users);
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: Date.now().toString(),
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        });
        res.redirect('/login')
    } catch {
        res.render('/register", {message: "username already exists!"}')
    }

    console.log(users);
});


app.post('/login', checkNotAuthenticated,  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.delete('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    next();
}

app.listen(3000);