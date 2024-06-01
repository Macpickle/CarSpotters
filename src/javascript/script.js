//infinite scroll posts
const cardCountElem = 1;
const cardTotalElem = 3;
const cardContainer = document.getElementById("post-container");
const loader = document.getElementById("loader");

const cardLimit = 99;
const cardIncrease = 10;
const pageCount = Math.ceil(cardLimit / cardIncrease);
let currentPage = 1;

cardTotalElem.innerHTML = cardLimit;

var throttleTimer;
//throttle function, enforces a minimum time interval between function calls (aka cant spam server to continue scrolling)
const throttle = (callback, time) => {
  if (throttleTimer) return;

  throttleTimer = true;

  setTimeout(() => {
    callback();
    throttleTimer = false;
  }, time);
};


//creates an element with the post data
const createCard = (index) => {
  fetch('/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ index })
  })
  .then(response => response.json())
  .then(data => {
    //get a random post in the data base (possible algorithm later on)
    const randomNumber = Math.floor(Math.random() * data.length);
    const randomData = data[randomNumber];

    //get the post's user's photo
    userPhoto = randomData.ownerPhoto;
    if (userID){
      isLiked = randomData.likes.includes(JSON.parse(userID).username);
      isFavourited = randomData.favourites.includes(JSON.parse(userID).username);
    } else {
      isLiked = false;
      isFavourited = false;
    }
    const post = document.createElement("div");

    post.innerHTML = `
    <div class = "post">
      <form action = "/viewPost/${randomData._id}" method = "GET">
        <button>
          <div class = "view-post">
            <div class = "post-header">
            
              <div class = "profile-picture">
                <img src="${randomData.owner.photo}" alt="">
              </div>
              <div class = "post-header-content">
                <div class = "stack">
                  <div class = "profile-name">
                    <h2>${randomData.owner.username}</h2>
                  </div>
                  <div class = "post-information">
                    <p>- ${randomData.carModel}, ${randomData.carTitle}</p>
                  </div>
                </div>
                <div class = "stack">
                    <div class = "description">
                      <p>${randomData.description}</p>
                    </div>
                </div>
              </div>
              <div class = "post-date">
                <p>${randomData.date}</p>
              </div>
            </div>
              <div class = "image-container">
                <img src="${randomData.photo}" alt="" id = "photo">
              </div>
          </div>
        </button>
      </form>
        <div class = "extras-content">
            <div class = "item">
              <button class = "like-button">
                <label for = "like-button">
                  <i class="fas fa-heart" id = "likeIcon"></i>
                  <p class = "likeCount">${randomData.likes.length}</p>
                </label>
              </button>
            </div>
            <div class = "item">
              <button class = "favourite-button">
                <label for = "favourite-button">
                  <i class="fas fa-star"></i>
                  <p class = "favouriteCount">${randomData.favourites.length}</p>
                </label>
              </button>
            </div>
            <div class = "item">
              <form action = "/viewPost/${randomData._id}" method = "GET">
                <button class = "comment-button"'>
                  <label for = "comment-button">
                    <i class="fas fa-comment" style="color: slategrey"></i>
                    <p class = "commentCount">${randomData.comments.length}</p>
                  </label>
                </button>
              </form>
            </div>
        </div>
    </div>
    `;      
    //append the post to the container
    cardContainer.appendChild(post);
      if(isLiked){
        updateLikes("red", randomData, randomData.likes.length)
      } else {
        updateLikes("slategrey", randomData, randomData.likes.length)
      }
      
      if(isFavourited){
        updateFavourites("blue", randomData, randomData.favourites.length)
      } else {
        updateFavourites("slategrey", randomData, randomData.favourites.length)
      }

      // add event listener to the like button
      const likeButton = post.querySelector(".like-button");
        likeButton.addEventListener("click", (event) => {
          event.preventDefault();
          updatePost(userID, randomData, "likePost");
      });
      // add event listener to follow button
      const favouriteButton = post.querySelector(".favourite-button");
        favouriteButton.addEventListener("click", (event) => {
          event.preventDefault();
          updatePost(userID, randomData, "favouritePost");
      });

      // change length of description based on size of screen
      const description = post.querySelector(".description");
      if (window.innerWidth < 1000 && randomData.description.length > 50) {
        description.innerHTML = `<p>${randomData.description.substring(0, 50)}...</p>`;
      } else {
        description.innerHTML = `<p>${randomData.description}</p>`;
      }
  })
  .catch(error => {
    console.error('Error:', error);
  });
};
// responsible for checking if the user has reached the end of the page, then creating a post 
const addCards = (pageIndex) => {
  currentPage = pageIndex;

  const startRange = (pageIndex - 1) * cardIncrease;
  const endRange =
    currentPage == pageCount ? cardLimit : pageIndex * cardIncrease;

  cardCountElem.innerHTML = endRange;

  for (let i = startRange + 1; i <= endRange; i++) {
      createCard(i);
  }
};

//responsible for checking if the user has reached the end of the page
const handleInfiniteScroll = () => {
  throttle(() => {
    const endOfPage =
      window.innerHeight + window.scrollY >= document.body.offsetHeight;

    if (endOfPage) {
      addCards(currentPage + 1);
    }

    if (currentPage === pageCount) {
      removeInfiniteScroll();
    }
  }, 1000);
};

const removeInfiniteScroll = () => {
  loader.remove();
  window.removeEventListener("scroll", handleInfiniteScroll);
};

window.onload = function () {
    addCards(currentPage);
};

window.addEventListener("scroll", handleInfiniteScroll);

var loadFile = function(event) {
  var userID = event.target.baseURI.substring(30);
  var data = new FormData()
  data.append('photo', event.target.files[0])
  data.append('userID', userID)

  //send the image to the server
  fetch('/changeProfilePicture', {
    method: 'POST',
    body: data
  }).then(response => response.json()).then(data => {
    if (data.ok){
      window.location.reload();
    }
  })
};

function updateLikes(colour, post, currentValue){
  for (let i = 0; i < document.getElementsByClassName("like-button").length; i++) {
    var imageSRC = document.getElementsByClassName("image-container")[i].children[0].getAttribute("src");

    if (post.photo == imageSRC) {
      document.getElementsByClassName("like-button")[i].style.color = colour;
      document.getElementsByClassName("likeCount")[i].innerHTML = currentValue;
    }
  }
}

function updateFavourites(colour, post, currentValue){
  for (let i = 0; i < document.getElementsByClassName("favourite-button").length; i++) {
    var imageSRC = document.getElementsByClassName("image-container")[i].children[0].getAttribute("src");

    if (post.photo == imageSRC) {
      document.getElementsByClassName("favourite-button")[i].style.color = colour;
      document.getElementsByClassName("favouriteCount")[i].innerHTML = currentValue;
    }
  }
}

//creates a new post request to URL using XHR
function newPostRequest(data, postURL, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", postURL, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(data));

  xhr.onload = function() {
    if (xhr.status == 200) {
      response = JSON.parse(xhr.responseText);
      callback(null, response)
    } else {
      callback(xhr.status, null);
    }
  }
} 

//checks if user is logged in
function validUser(user) {
  if (!user || user == "Guest") {
    window.location.href = "/login";
  }
}

//updates likes and favourites of a post
function updatePost(user,post,POSTurl) {
  //determines if user is logged in
  validUser(user);

  //used on the request to find the user and post
  const parsedUser = JSON.parse(user);
  const postID = post._id;
  const userID = parsedUser._id;

  //full URL for post request
  const postRequestURL = "/" + POSTurl;

  //body for XHR request
  const body = {
    postID: postID,
    userID: userID
  }
  
  //create new post request
  newPostRequest(body, postRequestURL, function(error, response) { 
    if (response.ok == false) {
      console.log("Error: " + error);
      console.log(document.getElementById("error"));
      document.getElementById("error").innerHTML = "Error: " + error;
    }

    const isClicked = response.isClicked;
    const value = response.value

    if (POSTurl == "likePost") {
      if (isClicked) {
        updateLikes("red", post, value);
      } else {
        updateLikes("slategrey", post, value);
      }
    } else if (POSTurl == "favouritePost") {
      if (isClicked) {
        updateFavourites("blue", post, value);
      } else {
        updateFavourites("slategrey", post, value);
      }
    }
  });

}

//follow user 
function followUser(sessionUser,accountUser) {
  //determines if user is logged in
  validUser(sessionUser);

  //full URL for post request
  const postRequestURL = "/followUser";

  //body for XHR request
  const body = {
    sessionUser: sessionUser,
    accountUser: accountUser
  }

  //create new post request
  newPostRequest(body, postRequestURL, function(error, response) {
    if (error) {
      console.log("Error: " + error);
      window.location.href = "/";
    }

    const followingCount = response.followingCount;
    const isFollowing = response.isFollowing;

    document.getElementById("followerCount").innerHTML = followingCount;

    if(isFollowing){
      document.getElementById("followButton").innerHTML = "<i class='fa-solid fa-check'></i>"
    } else {
      document.getElementById("followButton").innerHTML = "<i class='fa-solid fa-plus'></i>"
    }

  });
}