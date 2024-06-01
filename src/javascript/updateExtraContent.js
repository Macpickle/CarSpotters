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
      callback(xhr.status, null)
    }
  }
} 

//checks if user is logged in
function validUser(user) {
  if (!user || user == "Guest") {
    window.location.href = "/login";
  }
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
    if (error) {
      console.log("Error: " + error);
      window.location.href = "/";
    }

    const isClicked = response.isClicked;
    const value = response.value

    if (POSTurl == "likePost") {
      if (isClicked) {
        updateLikes("red", post, value);
      } else {
        updateLikes("black", post, value);
      }
    } else if (POSTurl == "favouritePost") {
      if (isClicked) {
        updateFavourites("blue", post, value);
      } else {
        updateFavourites("black", post, value);
      }
    }
  });
}

module.exports = updatePost;