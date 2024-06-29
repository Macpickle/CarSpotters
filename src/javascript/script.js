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
          <button id = "post-button">
              <div class = "view-post">
                <div class = "post-header">
                  <div class = "tooltip">
                    <div class = "profile-picture">
                      <img class="profile-clickable" src="${randomData.owner.photo}" alt="" data-form-id="${randomData.owner._id}">
                    </div>
                    <span class = "tooltiptext">View Profile</span>
                  </div>
                  <div class = "post-header-content">
                    <div class = "stack">
                      <div class = "tooltip">
                        <div class = "profile-name">
                          <h2 class="profile-clickable" data-form-id="${randomData.owner._id}">${randomData.owner.username}</h2> 
                      </div>
                      <span class = "tooltiptext">View Profile</span>
                    </div>
                      <div class = "post-information">
                        <p>- ${randomData.carModel}, ${randomData.carTitle}</p>
                      </div>
                      <p class = "location"> Found in ${randomData.locationName}</p>
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
              <div class = "tooltip">
                <button class = "like-button">
                  <label for = "like-button">
                    <i class="fas fa-heart" id = "likeIcon"></i>
                    <p class = "likeCount">${randomData.likes.length}</p>
                  </label>
                </button>
                <span class = "tooltiptext">Like</span>
              </div>
            </div>
            <div class = "item">
              <div class = "tooltip">
                <button class = "favourite-button">
                  <label for = "favourite-button">
                    <i class="fas fa-star"></i>
                    <p class = "favouriteCount">${randomData.favourites.length}</p>
                  </label>
                </button>
                <span class = "tooltiptext">Favourite</span>
              </div>
            </div>
            <div class = "item">
              <div class = "tooltip">
                <form action = "/viewPost/${randomData._id}" method = "GET">
                  <button class = "comment-button">
                    <label for = "comment-button">
                      <i class="fas fa-comment"></i>
                      <p class = "commentCount">${randomData.comments.length}</p>
                    </label>
                  </button>
                </form>
                <span class = "tooltiptext">View Comments</span>
              </div>
            </div>
        </div>
    </div>
    `;      
    //append the post to the container
    cardContainer.appendChild(post);
      if(isLiked){
        updateLikes("firebrick", randomData.photo, randomData.likes.length)
      }
      
      if(isFavourited){
        updateFavourites("skyblue", randomData.photo, randomData.favourites.length)
      }

      // add event listener to the like button
      const likeButton = post.querySelector(".like-button");
        likeButton.addEventListener("click", (event) => {
          event.preventDefault();
          updatePost(JSON.parse(userID)._id, randomData.photo, randomData._id, "likePost");
      });
      // add event listener to follow button
      const favouriteButton = post.querySelector(".favourite-button");
        favouriteButton.addEventListener("click", (event) => {
          event.preventDefault();
          updatePost(JSON.parse(userID)._id, randomData.photo, randomData._id, "favouritePost");
      });

      // change length of description based on size of screen
      const description = post.querySelector(".description");
      if (window.innerWidth < 1000 && randomData.description.length > 50) {
        description.innerHTML = `<p>${randomData.description.substring(0, 50)}...</p>`;
      } else {
        description.innerHTML = `<p>${randomData.description}</p>`;
      }

      // Get all elements with the class 'profile-name-clickable'
      var profileNameClickable = document.querySelectorAll(".profile-clickable");

      // Add click event listeners to each clickable profile name
      profileNameClickable.forEach(function(element) {
          element.addEventListener("click", function(event) {
          event.preventDefault(); // Prevent form submission

          // Get the form ID associated with the clicked profile name
          var formId = element.dataset.formId;

          window.location.href = "/account/" + formId;            
          });
      });

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
    
    if (post == imageSRC) {
      document.getElementsByClassName("like-button")[i].style.color = colour;
      document.getElementsByClassName("likeCount")[i].innerHTML = currentValue;
    }
  }
}

function updateFavourites(colour, post, currentValue){
  for (let i = 0; i < document.getElementsByClassName("favourite-button").length; i++) {
    var imageSRC = document.getElementsByClassName("image-container")[i].children[0].getAttribute("src");

    if (post == imageSRC) {
      document.getElementsByClassName("favourite-button")[i].style.color = colour;
      document.getElementsByClassName("favouriteCount")[i].innerHTML = currentValue;
    }
  }
}

function notifyUser(postID, userID){
  const body = {
    uniquePostID: postID,
    sender: userID,
    type: "post"
  }

  fetch('/createNotification/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
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
function validUser(userID) {
  if (!userID || userID == "") {
    window.location.href = "/login";
  }
}

//updates likes and favourites of a post
function updatePost(userID, postPhoto, postID, POSTurl) {
  //determines if user is logged in
  validUser(userID);

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
      document.getElementById("error").innerHTML = "Error: " + error;
    }
    const isClicked = response.isClicked;
    const value = response.value

    if (POSTurl == "likePost") {
      if (isClicked) {
        updateLikes("firebrick", postPhoto, value);
        notifyUser(postID, userID);
      } else {
        updateLikes("", postPhoto, value);
      }
    } else if (POSTurl == "favouritePost") {
      if (isClicked) {
        updateFavourites("skyblue", postPhoto, value);
        notifyUser(postID, userID);
      } else {
        updateFavourites("", postPhoto, value);
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

    document.getElementById("followerCount").children[0].innerHTML = followingCount;

    if(isFollowing){
      document.getElementById("followButton").innerHTML =
       `<div class = "tooltip">
            <i class="fa-solid fa-check"></i>
            <span class = "tooltiptext">Following</span>
        </div>`

        fetch('/createNotification', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              type: "follow",
              sender: sessionUser,
              ownerID: accountUser
          })
          });
          
    } else {
      document.getElementById("followButton").innerHTML = 
      `
      <div class = "tooltip">
          <i class="fa-solid fa-plus"></i>
          <span class = "tooltiptext">Follow</span>
      </div>`
    }
  });
}