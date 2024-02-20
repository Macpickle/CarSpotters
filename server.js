require('dotenv').config(); // Load environment variables from .env file

// Initialize express router
const express = require('express');
const app = express();
const flash = require('express-flash');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');

// Set up mongoose connection
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection

db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))

// Set up express app
app.use(express.json());
app.use(flash());
app.use(session
    ({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    }));

// view ports (styling)
app.use(express.static(path.join(__dirname, 'views')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, 'src')));

var index = require('./routes/index');
app.use('/', index);

app.listen(3000);