window.onload = function() {
    const likeContainer = document.querySelectorAll('#postLikes');
    const favouriteContainer = document.querySelectorAll('#postFavourites');
    const user = document.querySelector('#username').value;
    const postID = document.querySelector('#postID').value;

    likeContainer.forEach((container) => {
        const likeUsernames = container.value;
        const likeButton = container.parentElement.querySelector('.like-button');
        
        if (likeUsernames.includes(user)) {
            likeButton.style.color = 'firebrick';
        } else {
            likeButton.style.color = '';
        }

        likeButton.addEventListener('click', () => {
            location.href = '/viewPost/' + postID;
        });
    });

    favouriteContainer.forEach((container) => {
        const favouriteUsernames = container.value;
        const favouriteButton = container.parentElement.querySelector('.favourite-button');

        if (favouriteUsernames.includes(user)) {
            favouriteButton.style.color = 'skyblue';
        } else {
            favouriteButton.style.color = '';
        }

        favouriteButton.addEventListener('click', () => {
            location.href = '/viewPost/' + postID;
        });
    });


}