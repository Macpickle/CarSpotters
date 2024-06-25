const router = require('express').Router();
const User = require('../models/user');
const Post = require('../models/post');
const Message = require('../models/message');
const Comment = require('../models/comment');

const appError = require('../appError');
const { tryCatch } = require('../utils/tryCatch');

router.post('/deleteComment/:id', async (req,res) => {
    try {
        const post = await Post.findOne({ _id: req.body.postID });
        for (let i = 0; i < post.comments.length; i++) {
            if (post.comments[i]._id == req.params.id) {
                post.comments.splice(i, 1);
                break;
            }
            
            if (i == post.comments.length - 1) {
                throw new appError("Comment not found!", 404, MESSAGE_NOT_FOUND, `/viewPost/${post._id}`);
            }
        }

        await Comment.deleteOne({ _id: req.params.id });

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

module.exports = router;