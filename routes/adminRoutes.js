//post requests for admin functions such as deleting posts, comments, and messages, etc...

const router = require('express').Router();

const User = require('../models/user');
const Post = require('../models/post');
const Message = require('../models/message');
const Comment = require('../models/comment');

const appError = require('../appError');
const { tryCatch } = require('../utils/tryCatch');

//error codes
const { USER_NOT_FOUND } = require('../constants/errorCodes');
const { UNAUTHORIZED } = require('../constants/errorCodes');

//determine if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.admin) {
        return next();
    }
    return res.status(403).send("You are not authorized to view this page");
}

router.get("/admin", isAdmin , tryCatch(async (req, res) => {
    const user = req.user;
    res.render("admin", { user });
}));

router.post("/admin/deleteUser/:id", isAdmin, tryCatch(async (req, res) => {
    const user = req.user;
    const accountID = req.params.id;

    if (!accountID || !user) {
        throw new appError("User was not found", 404, USER_NOT_FOUND, "/admin");
    }

    const accountOwner = await User.findOne({ _id: accountID });

    //for documentation to admin
    const accountOwnerUsername = accountOwner.username;

    //delete all data associated with the user
    await Post.deleteMany({username: accountOwner.username});
    await Comment.deleteMany({username: accountOwner.username});
    await Message.deleteMany({members: accountOwner.username});
    await User.deleteOne({ _id: accountID });

    res.status(200).send(accountOwnerUsername + "'s account has been deleted");
}));

router.post("/admin/deletePost/:id", isAdmin, tryCatch(async (req, res) => {
    const user = req.user;
    const postID = req.params.id;

    if (!postID || !user) {
        throw new appError("Post was not found", 404, USER_NOT_FOUND, "/admin");
    }

    await Post.deleteOne({ _id: postID });

    res.status(200).send("Post has been deleted");
}));

module.exports = router;