const router = require('express').Router();
const passport = require('passport');
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const Message = require('../models/message');
const Notification = require('../models/notification');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const appError = require('../appError');
const autoModerate = require('../automoderation');
const { tryCatch } = require('../utils/tryCatch');
const { SAME_USER } = require('../constants/errorCodes');
const { EXISTING_MESSAGE } = require('../constants/errorCodes');
const { MESSAGE_NOT_FOUND } = require('../constants/errorCodes');
const { EXISTING_USER } = require('../constants/errorCodes');
const { INAPPROPRIATE_MESSAGE } = require('../constants/errorCodes');
const { IMAGE_UPLOAD_FAILED } = require('../constants/errorCodes');
const { INVALID_PASSWORD } = require('../constants/errorCodes');
const { INVALID_EMAIL } = require('../constants/errorCodes');
const { UNEXPECTED_ERROR } = require('../constants/errorCodes');
const { INVALID_INPUT } = require('../constants/errorCodes');

router.post('/login', passport.authenticate('local', {
    failureRedirect:  '/failureLogin',
    failureMessage: true,
    failureFlash: true
}), (req, res) => {
    // If the user is authenticated, redirect to the home page, session is saved
    res.redirect('/');
});

async function checkDuplicateNotification(originalPost, type) {
    const isNotificationFound = await Notification.findOne({ reference: originalPost, type: type }) !== null;
    return isNotificationFound;
}

router.post('/createNotification', tryCatch(async (req,res) => {
    const post = await Post.findOne({_id: req.body.uniquePostID});
    const sender = await User.findOne({_id: req.body.sender});
    var postOwner = ""
    var previewPhoto = ""
    var message = ""
    var duplicate = false;
    var link = ""

    //change message based on type of notification
    if (req.body.type == "post") {
        message = sender.username + " has liked or favourited your post!";
        link = `/viewPost/${post._id}`;
        duplicate = await checkDuplicateNotification(link, "post");
        postOwner = post.owner.username;
        previewPhoto = post.photo;
    }

    else if (req.body.type == "comment") {
        message = sender.username + " has commented on your post!";
        link = `/viewPost/${post._id}`;
        duplicate = await checkDuplicateNotification(link, "comment");
        postOwner = post.owner.username;
        previewPhoto = post.photo;
    }

    else if (req.body.type == "message") {
        message = sender.username + " has sent you a message!";
        link = `/viewMessage/${req.body.chatID}`;
        duplicate = await checkDuplicateNotification(link, "message");
        postOwner = req.body.receiver;
        previewPhoto = sender.photo;
    }

    else if (req.body.type == "follow") {
        message = sender.username + " has followed you!";
        link = `/account/${req.body.ownerID}`;
        duplicate = await checkDuplicateNotification(link, "follow");
        const owner = await User.findOne({ _id: req.body.ownerID });
        postOwner = owner.username;
        previewPhoto = sender.photo;
    }

    //create new notification if no duplicates
    if (duplicate) {
        const notification = await Notification.findOne({ reference: link, type: req.body.type });
        notification.count += 1;
        if (req.body.type != "message") {
            notification.message = "Multiple users have interacted with your account/post!";
            notification.sender = "Multiple users";
        } else {
            notification.message = sender.username + " has sent multiple messages!";
            notification.sender = sender.username;
        }
        notification.date = res.locals.formattedDate;
        notification.save();
        return res.json({"ok": true});
    }

    //else, create new notification
    const notify = new Notification({
        user: postOwner,
        sender: sender.username,
        message: message,
        date: res.locals.formattedDate,
        reference: link,
        photo: previewPhoto,
        count: 1,
        type: req.body.type,
    })

    notify.save();
    return res.json({"ok": true})

}));

router.post('/deleteNotification', tryCatch(async (req,res) => {
    const notification = await Notification.deleteOne({ _id: req.body.ID });
    // for unexpected errors
    if (!notification) {
        throw new appError("Notification not found!", 404, MESSAGE_NOT_FOUND, "/notify");
    }

    return res.json({"ok": true});
}));

router.post('/logout', (req,res) => {
    req.logout(() => {
        req.session.destroy();
        res.clearCookie('sid'); // sid: name of cookie, change to secret later
        res.redirect('/');
    });
});

router.post('/commentPost', tryCatch(async (req,res) => {
    const post = await Post.findOne({ _id: req.body.postID });
    const sessionUser = req.user;
    if (!req.body.comment) {
        throw new appError("Comment cannot be empty!", 404, MESSAGE_NOT_FOUND, `/viewPost/${post._id}`);
    }

    //replaces swear words with asterisks
    const cleanedText = autoModerate(req.body.comment, true);

    const newComment = new Comment({
        username: sessionUser.username,
        ownerPhoto: sessionUser.photo,
        ownerID: sessionUser._id,
        comment: cleanedText,
        postID: post._id,
        likes: 0,
        date: res.locals.formattedDate,
    });

    post.comments.push(newComment);
    newComment.save();
    post.save();
    return res.status(200).redirect(`/viewPost/${post._id}`);
}));

router.post("/appendMessage/:id", tryCatch(async (req,res) => {
    const currentChat = await Message.findOne({ _id: req.params.id });
    const sender = req.user;

    if (!req.body.message) {
        throw new appError("Message cannot be empty!", 404, MESSAGE_NOT_FOUND, `/viewMessage/${currentChat._id}`);
    }
    if (!currentChat) {
        throw new appError("Message not found!", 404, MESSAGE_NOT_FOUND, `/viewMessage/${currentChat._id}`);
    }

    const newMessage = {
        sender: sender.username,
        message: req.body.message,
        date: res.locals.formattedDate,
    };

    currentChat.messages.push(newMessage);
    currentChat.save();
    return res.status(200).redirect('/viewMessage/' + currentChat._id);
}));

router.post('/sendMessage', tryCatch(async (req,res) => {
    const sender =  await User.findOne({ username: req.body.sender });
    const receiver = await User.findOne({ username: req.body.receiver });
    if (!sender || !receiver) {
        throw new appError("User not found!", 404, MESSAGE_NOT_FOUND, "/messages");
    }

    const isExistingMessage = await Message.findOne({ members: { $all: [sender.username, receiver.username] } });
    const message = req.body.message;

    if (sender.username == receiver.username) {
        throw new appError("Cannot message yourself!", 400, SAME_USER, "/messages");
    } 
    if (isExistingMessage) {
        throw new appError("Message already exists!", 400, EXISTING_MESSAGE, "/messages");
    }
    if (message.length <= 0 || message == null) {
        throw new appError("Message cannot be empty!", 404, MESSAGE_NOT_FOUND, "/messages");
    }

    //checks recipient's message privacy settings
    if (receiver.settings.messagePrivacy == "noone") {
        throw new appError("User has disabled messages!", 400, "MESSAGES_DISABLED", "/messages");
    } else if (receiver.settings.messagePrivacy == "friends") {
        if (!receiver.following.includes(sender.username)) {
            throw new appError("User has disabled messages!", 400, "MESSAGES_DISABLED", "/messages");
        }
    }
    
    const newMessage = new Message({
        members: [sender.username, receiver.username],
        messages: [
            {
                sender: sender.username,
                message: message,
                date: res.locals.formattedDate,
            }
        ]
    });

    newMessage.save();
    return res.status(200).redirect('/messages');
}));

router.post('/favouritePost', tryCatch(async (req,res) => {
    const post = await Post.findOne({ _id: req.body.postID });
    const sessionUser = req.user;

    if (post.username == sessionUser.username) {
        //if user tries to favourite their own post
        return res.json({"ok":false, "isClicked": false, "value": post.favourites.length});
    }

}));

router.post('/favouritePost', async (req,res) => {
    console.log("Favourite post");
    try {
        const post = await Post.findOne({_id: req.body.postID});
        const sessionUser = req.user;

        if (post.username == sessionUser.username) {
            res.json({"ok":false, "isClicked": false, "value": post.favourites.length});
            
        } else {
            if (post.favourites.includes(sessionUser.username)) {
                const index = post.favourites.indexOf(sessionUser.username);
                sessionUser.favouritePosts.splice(index, 1);
                post.favourites.splice(index, 1);

            } else {
                post.favourites.push(sessionUser.username);
                sessionUser.favouritePosts.push(post._id);
            }
                
            sessionUser.save();
            post.save();
            res.json({"ok":true, "isClicked": post.favourites.includes(sessionUser.username), "value": post.favourites.length});
        }

    } catch (error) {
        console.log(error);
        res.json({"ok":false});
    }
});

router.post('/likePost', async (req,res) => {
    try {
        const post = await Post.findOne({_id: req.body.postID});
        const sessionUser = await User.findOne({ _id: req.body.userID });

        if (post.username == sessionUser.username) {
            res.json({"ok":false, "isClicked": false, "value": post.likes.length});
        } else {
            if (post.likes.includes(sessionUser.username)) {
                const index = post.likes.indexOf(sessionUser.username);
                post.likes.splice(index, 1);
            } else {
                post.likes.push(sessionUser.username);
            } 

            post.save();
            res.json({"ok":true, "isClicked": post.likes.includes(sessionUser.username), "value": post.likes.length});
        }
    } catch (error) {
        res.json({"ok":false});
    }
});

router.post('/followUser', tryCatch(async (req,res) => {
    const accountUser = await User.findOne({ _id: req.body.accountUser });
    const sessionUser = await User.findOne({ _id: req.body.sessionUser });

    var isFollowing = sessionUser.following.includes(accountUser.username);

    if (isFollowing) {
        //remove following of session user
        const index = sessionUser.following.indexOf(accountUser.username);
        sessionUser.following.splice(index, 1);
        //remove followers of account user
        const index2 = accountUser.followers.indexOf(sessionUser.username);
        accountUser.followers.splice(index2, 1);
    } else {
        //add following of session user
        sessionUser.following.push(accountUser.username);
        //add followers of account user
        accountUser.followers.push(sessionUser.username);
    }
    sessionUser.save();
    accountUser.save();
    res.status(200).json({"followingCount": accountUser.followers.length, "isFollowing": !isFollowing});
}));

//makes IMGUR post request, returns link to image
function fetchImage(img, defaultURL) {
    if (!img || img == null) {
        return new appError("Image required!", 400, "IMAGE_REQUIRED", defaultURL);
    }

    const formData = new FormData();
    formData.append('image', img.data.toString('base64'));

    return fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
            Authorization: "Client-ID " + process.env.IMGUR_CLIENT_ID,
        },
        body: formData
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        return data.data.link;
    })
    .catch(err => {
        return new appError("Image upload failed!", 400, IMAGE_UPLOAD_FAILED, defaultURL);
    });
}

router.post('/changeProfilePicture', tryCatch(async (req,res) => {
    const user = await User.findOne({ _id: req.body.userID });
    const posts = await Post.find({ username: user.username });
    const img = req.files.photo;
    const photoLink = await fetchImage(img, "/account/" + user._id);

    if (photoLink instanceof appError) {
        throw photoLink;
    }

    user.photo = photoLink;
    user.save();

    posts.forEach(post => {
        post.owner = {
            _id: user._id,
            username: user.username,
            photo: user.photo,
        };
        post.save();
    });
    
    res.status(200).json({"ok":true});
}));

async function geoCode(location) {
    const baseURL = 'https://geocode.maps.co/search?q=' + location + '&api_key=' + process.env.API_KEY;

    return await fetch(baseURL)
        .then(response => {
            return response.json();
        })
        .then(data => {
            const lon = data[0].lon;
            const lat = data[0].lat;
            return { lat: lat, lng: lon };
        })
        .catch(err => {
            return null;
        });
}

router.post('/geoCode', tryCatch(async (req,res) => {
    geoCode(req.body.location)
        .then(data => {
            res.json(data);
        });
}));

async function reverseGeoCode(location) {
    var [lat, lng] = location.split(",");
    lng = lng.trim();
    const baseURL = 'https://geocode.maps.co/reverse?lat=' + lat + '&lon=' + lng + '&api_key=' + process.env.API_KEY;
    
    return await fetch(baseURL)
        .then(response => {
            return response.json();
        })
        .then(data => {
            const location = data.address.city + ", " + data.address.state + ", " + data.address.country;
            return location;
        })
        .catch(err => {
            return null;
        });
};

router.post('/createNewPost', tryCatch(async (req,res) => {
    const img = req.files.img;
    //post image required, default URL to be redirected to if image upload fails
    const imageLink = await fetchImage(img, "/create");
    
    if (imageLink instanceof appError) {
        throw imageLink;
    }

    const postOwner = {
        _id: req.user._id,
        username: req.user.username,
        photo: req.user.photo,
    }

    //geocode user's location, if possible
    var location = await geoCode(req.body.location);
    if (!location) {
        throw new appError("Invalid location!", 400, "INVALID_LOCATION", "/create");
    }
    
    //if location is a number, reverse geocode it
    if (/\d/.test(req.body.location)) {
        req.body.location = await reverseGeoCode(req.body.location);
    }

    if (!req.body.location) {
        throw new appError("Location cannot be empty!", 404, MESSAGE_NOT_FOUND, "/create");
    }

    const formattedLocation = location.lat + "," + location.lng;

    const newPost = new Post({
        username: req.user.username,
        owner: postOwner,
        locationName: req.body.location,
        location: formattedLocation,
        description: req.body.description,
        photo: imageLink,
        allowComments: true,
        likes: [],
        favourites: [],
        comments: [],
        date: res.locals.formattedDate,
        carModel: req.body.carModel,
        carTitle: req.body.carName,
    }); 

    req.user.postCount += 1;
    req.user.save();
    newPost.save();
    res.status(200).redirect('/');
}));

router.post("/register", tryCatch(async (req,res) => {
    const existingUser = await User.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] });

    if (existingUser) {
        throw new appError("User already exists!", 400, EXISTING_USER, "/register");
    }

    const isCleanUsername = autoModerate(req.body.username, false);
    if (!isCleanUsername) {
        throw new appError("Username contains inappropriate language!", 400, INAPPROPRIATE_MESSAGE, "/register");
    }

    //hash the password
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
    res.status(200).redirect(`/login?username=${req.body.username}`);

}));

// CHANGE ACCOUNT SETTINGS

router.post("/change-bio", tryCatch(async (req,res) => {
    if (!req.body.bio) {
        throw new appError("Bio cannot be empty!", 404, MESSAGE_NOT_FOUND, `/settings/${req.user._id}`);
    }

    //checks for profanity in bio
    const isCleanBio = autoModerate(req.body.bio, true);
    if (!isCleanBio) {
        throw new appError("Bio contains inappropriate language!", 400, INAPPROPRIATE_MESSAGE, `/settings/${req.user._id}`);
    }

    req.user.bio = req.body.bio;
    req.user.save();
    res.status(200).redirect(`/settings/${req.user._id}?success=true`);
}));

router.post("/change-username", tryCatch(async (req,res) => {
    if (!req.body.username) {
        throw new appError("Username cannot be empty!", 404, MESSAGE_NOT_FOUND, `/settings/${req.user._id}`);
    }

    //check if username is already taken
    const usernameInUsage = await User.findOne({ username: req.body.username });
    if (usernameInUsage) {
        throw new appError("Username already in use!", 400, EXISTING_USER, `/settings/${req.user._id}`);
    }

    //checks for profanity in username
    const isCleanUsername = autoModerate(req.body.username, false);
    if (!isCleanUsername) {
        throw new appError("Username contains inappropriate language!", 400, INAPPROPRIATE_MESSAGE, `/settings/${req.user._id}`);
    }

    req.user.username = req.body.username;
    req.user.save();
    res.status(200).redirect(`/settings/${req.user._id}?success=true`);
}));

router.post("/change-password", tryCatch(async (req,res) => {
    if (!req.body.password || !req.body.newPassword) {
        throw new appError("Password cannot be empty!", 404, MESSAGE_NOT_FOUND, `/settings/${req.user._id}`);
    }

    //checks the input the user put in, compares the two passwords
    const validPassword = await bcrypt.compare(req.body.password, req.user.password);

    if (!validPassword || req.body.newPassword === req.body.password) {
        throw new appError("Incorrect password or same password!", 400, INVALID_PASSWORD, `/settings/${req.user._id}`);
    }

    //hash the new password
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
    req.user.password = hashedPassword;
    req.user.save();
    res.status(200).redirect(`/settings/${req.user._id}?success=true`);
}));

router.post("/change-email", tryCatch(async (req,res) => {
    if (!req.body.email || !req.body.newEmail) {
        throw new appError("Email cannot be empty!", 404, MESSAGE_NOT_FOUND, `/settings/${req.user._id}`);
    }

    //check if email is already taken
    const emailInUsage = await User.findOne({ email: req.body.newEmail });
    if (emailInUsage) {
        throw new appError("Email already in use!", 400, EXISTING_USER, `/settings/${req.user._id}`);
    }

    //checks the input the user put in, compares the two emails
    if (req.body.email !== req.user.email) {
        throw new appError("Incorrect email!", 400, INVALID_EMAIL, `/settings/${req.user._id}`);
    }

    req.user.email = req.body.newEmail;
    req.user.save();
    res.status(200).redirect(`/settings/${req.user._id}?success=true`);
}));

//deletes the user's account, all posts and messages associated with the user
router.post('/delete-account', tryCatch(async (req,res) => {
    const validPassword = await bcrypt.compare(req.body.password, req.user.password);
    if (!validPassword) {
        throw new appError("Incorrect password!", 400, INVALID_PASSWORD, `/settings/${req.user._id}`);
    }

    await User.deleteOne({ _id: req.user._id });
    await Post.deleteMany({ username: req.user.username });
    await Message.deleteMany({ members: { $in: [req.user.username] } });

    //log out the user using logout POST request above
    req.logout(() => {
        req.session.destroy();
        res.clearCookie('sid'); // sid: name of cookie, change to secret later
        res.redirect('/');
    });
}));

//handing settings changes, updates the user's settings in the database
function updateSetting(req, res, settingType, settingValue) {
    const update = { $set: {} };
    update.$set[`settings.${settingType}`] = settingValue;

    if (!settingValue || settingValue == null) {
        throw new appError("Setting cannot be empty!", 400, INVALID_INPUT, `/settings/${req.user._id}`);
    }   

    User.findOneAndUpdate({ _id: req.user._id }, update, { new: true })
        .then(doc => {
            res.status(200).redirect(`/settings/${req.user._id}?success=true`);
        })
        .catch(err => {
            //unexpected error
            throw new appError("Error updating settings!", 500, UNEXPECTED_ERROR, `/settings/${req.user._id}`);
        });
}

router.post('/change-theme', async (req,res) => {
    const theme = req.body.theme;
    updateSetting(req, res, 'appearence', theme);
});

router.post('/change-message-privacy', async (req,res) => {
    const messagePrivacy = req.body.messagePrivacy;
    updateSetting(req, res, 'messagePrivacy', messagePrivacy);
});

router.post('/change-post-privacy', async (req,res) => {
    const postPrivacy = req.body.postPrivacy;
    updateSetting(req, res, 'postPrivacy', postPrivacy);
});

router.post('/change-following-privacy', async (req,res) => {
    const postPrivacy = req.body.followingPrivacy;
    updateSetting(req, res, 'followingPrivacy', postPrivacy);
});

router.post('/change-account-privacy', async (req,res) => {
    const postPrivacy = req.body.accountPrivacy;
    updateSetting(req, res, 'accountPrivacy', postPrivacy);
});

//handle if user tries to access a page that doesnt exist
router.get('*', (req,res) => {
    const theme = req.user ? req.user.settings.appearence : "light";
    res.render('404', { theme: theme });
});

module.exports = router;