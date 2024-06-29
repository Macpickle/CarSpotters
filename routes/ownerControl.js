const router = require('express').Router();
const User = require('../models/user');
const Post = require('../models/post');
const Message = require('../models/message');
const Notification = require('../models/notification');
const Comment = require('../models/comment');

const appError = require('../appError');
const { tryCatch } = require('../utils/tryCatch');

router.post('/deleteComment', async (req,res) => {
    try {
        const post = await Post.findOne({ _id: req.body.postID });
        for (let i = 0; i < post.comments.length; i++) {
            if (post.comments[i]._id == req.body.commentID) {
                post.comments.splice(i, 1);
                break;
            }
            
            if (i == post.comments.length - 1) {
                throw new appError("Comment not found!", 404, MESSAGE_NOT_FOUND, `/viewPost/${post._id}`);
            }
        }

        await Comment.deleteOne({ _id: req.body.commentID });

        post.save();
        res.status(200).redirect(`/viewPost/${post._id}?alert=Comment was successfully deleted`);

    } catch (err) {
        console.log(err);
        res.redirect('/');
    }

});

router.post('/deletePost/:id', tryCatch(async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id });
    const postOwner = await User.findOne({ _id: post.owner._id });
    if (!post) {
        throw new appError("Post not found", 404, POST_NOT_FOUND, "/");
    }

    await Post.deleteOne({ _id: req.params.id });
    res.status(200).redirect('/?alert=Post was successfully deleted');
}
));

router.post('/deleteNotification', tryCatch(async (req,res) => {
    const notification = await Notification.deleteOne({ _id: req.body.ID });
    // for unexpected errors
    if (!notification) {
        throw new appError("Notification not found!", 404, MESSAGE_NOT_FOUND, "/notify");
    }

    return res.json({"ok": true});
}));

router.post('/deleteAllNotifications', tryCatch(async (req,res) => {
    const notifications = await Notification.deleteMany({ owner: req.body.ownerID });
    // for unexpected errors
    if (!notifications) {
        throw new appError("Notifications not found!", 404, MESSAGE_NOT_FOUND, "/notify");
    }

    return res.json({"ok": true});
}));

module.exports = router;