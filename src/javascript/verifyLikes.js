function checkLiked(post, user, button) {
    if (post.includes(user)) {
        button.style.color = 'firebrick';
    } else {
        button.style.color = '';
    }
}

function checkFavourited(post, user, button) {
    if (post.includes(user)) {
        button.style.color = 'skyblue';
    } else {
        button.style.color = '';
    }
}

// on page load, check if the user has liked or favourited the post
window.onload = function() {
    if (user) {
        const likeButton = document.getElementById('post-like-button');
        const favouriteButton = document.getElementById('post-favourite-button');
        checkLiked(postLikeData, user, likeButton);
        checkFavourited(postFavouriteData, user, favouriteButton);
    }
}
