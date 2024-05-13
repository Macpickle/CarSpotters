
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
    var userPhoto = "";
    fetch('/getUserPhoto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: randomData.username })
    })
    .then(response => response.json())
    .then(data => {
      userPhoto = data;
      if (userID){
        isLiked = randomData.likeArray.includes(JSON.parse(userID).username);
        isFavourited = randomData.favouriteArray.includes(JSON.parse(userID).username);
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
                  <img src="${userPhoto}" alt="">
                </div>

                <div class = "post-header-content">
                  <div class = "stack">
                    <div class = "profile-name">
                      <h5>${randomData.username}</h5>
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
                  <p class = "likeCount">${randomData.likes}</p>
                </label>
              </button>
            </div>
            <div class = "item">
              <button class = "favourite-button">
                <label for = "favourite-button">
                  <i class="fas fa-star"></i>
                  <p class = "favouriteCount">${randomData.favourites}</p>
                </label>
              </button>
              </div>
          </div>
      </div>
      `;      

      //append the post to the container
      cardContainer.appendChild(post);

        if(isLiked){
          document.getElementsByClassName("like-button")[index-1].children[0].children[0].style.color = "red";
        } 

        if(isFavourited){
          document.getElementsByClassName("favourite-button")[index-1].children[0].children[0].style.color = "blue";
        }

        // add event listener to the like button
        const likeButton = post.querySelector(".like-button");
          likeButton.addEventListener("click", (event) => {
            event.preventDefault();
            likePost(randomData._id, userID, randomData);
        });

        // add event listener to follow button
        const favouriteButton = post.querySelector(".favourite-button");
        favouriteButton.addEventListener("click", (event) => {
          event.preventDefault();
          favouritePost(randomData._id, userID, randomData);
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

function followUser(user,userID) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/followUser", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ user, userID }));

  xhr.onload = function() {
    if (xhr.status == 200) {
      followingCount = JSON.parse(xhr.responseText).followingCount;
      isFollowing = JSON.parse(xhr.responseText).isFollowing;

      document.getElementById("followerCount").innerHTML = followingCount;

      if(isFollowing){
        document.getElementById("followButton").innerHTML = "<i class='fa-solid fa-check'></i>"
      } else {
        document.getElementById("followButton").innerHTML = "<i class='fa-solid fa-plus'></i>"
      }

    } else {
      console.log("Error: " + xhr.status);
    }
  }
}

function likePost(postID, userID, post) {
  if (!userID || userID == "Guest") {
    window.location.href = "/login";
    return;
  }
  user = JSON.parse(userID)._id;
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/likePost", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ postID, user }));

  xhr.onload = function() {
    if (xhr.status == 200) {
      console.log(xhr.responseText);
      likes = JSON.parse(xhr.responseText).likes;
      postLikeId = JSON.parse(xhr.responseText).postLikeId;
      if (JSON.parse(xhr.responseText).isLiked) {
          updateLikes("red", post);
      } else {
          updateLikes("black", post);
      }
    } else {
      console.log("Error: " + xhr.status);
    }
  }
}

function updateLikes(colour, post){
  for (let i = 0; i < document.getElementsByClassName("like-button").length; i++) {
    var imageSRC = document.getElementsByClassName("image-container")[i].children[0].getAttribute("src");

    if (post.photo == imageSRC) {
      document.getElementsByClassName("like-button")[i].style.color = colour;
      document.getElementsByClassName("likeCount")[i].innerHTML = likes;
    }
  }
}

function favouritePost(postID, userID, post) {
  if (!userID || userID == "Guest") {
    window.location.href = "/login";
  }
  user = JSON.parse(userID)._id;
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/favouritePost", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({ postID, user }));

  xhr.onload = function() {
    if (xhr.status == 200) {
      favourites = JSON.parse(xhr.responseText).favourites;
      postFavouriteId = JSON.parse(xhr.responseText).postFavouriteId;
      if (JSON.parse(xhr.responseText).isFavourited) {
          updateFavourites("blue", post);
      } else {
          updateFavourites("black", post);
      }
      
    } else {
      console.log("Error: " + xhr.status);
    }
  }
}

function updateFavourites(colour, post){
  for (let i = 0; i < document.getElementsByClassName("favourite-button").length; i++) {
    var imageSRC = document.getElementsByClassName("image-container")[i].children[0].getAttribute("src");

    if (post.photo == imageSRC) {
      document.getElementsByClassName("favourite-button")[i].style.color = colour;
      document.getElementsByClassName("favouriteCount")[i].innerHTML = favourites;
    }
  }
}