require('dotenv').config(); // for environment variables

const getRoutes = require('./routes/getRoutes.js');
const postRoutes = require('./routes/postRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');

const express = require('express');
const session = require('express-session'); 
const path = require('path');
const passport = require('passport');
const initpassport = require('./passport-config.js');
const User = require('./models/user.js');
const Post = require('./models/post.js');
const Message = require('./models/message.js');
const flash = require('express-flash');
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const { createServer } = require('node:http');

const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler.js');
const message = require('./models/message.js');

const app = express();
const server = createServer(app);
const io = new Server(server,
    {
        connectionStateRecovery: {}
    }
);

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

app.use(flash());

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

//get current date formatted as dd mm time
app.use((req, res, next) => {
    const day = (new Date().getDate() + "/" + new Date().getMonth());
    const time = new Date().toLocaleTimeString();

    res.locals.formattedDate = day + " " + time;

    next();
});

//routes
app.use(adminRoutes);
app.use(getRoutes);
app.use(postRoutes);

//error handling
app.use(errorHandler);

//sends all posts to request
app.post('/data', async (req,res) => {
    const posts = await Post.find({});
    res.send(posts);
});

//live server updates for messages
io.on('connection', (socket) => {
    socket.on('chat message', async(data) => {
        //store message in database
        const chatLog = await Message.findOne({_id: data.chatID});
        const sender = await User.findOne({username: data.sender});

        const day = (new Date().getDate() + "/" + new Date().getMonth());
        const time = new Date().toLocaleTimeString();

        date = day + " " + time;

        const newMessage = ({
            sender: data.sender,
            message: data.message,
            date: date
        });

        const senderInformation = ({
            username: sender.username,
            photo: sender.photo,
            _id: sender._id,
            message: data.message  
        });

        chatLog.messages.push(newMessage);
        chatLog.save();
        io.emit('chat message', senderInformation);
    });
});

server.listen((process.env.PORT) , () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
module.exports = app;
