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
                  <img src="${randomData.photo}" alt="">
                </div>
            </div>
          </button>
        </form>
          <div class = "extras-content">
            <div class = "item" id = "item">
              <input class = "like-button" id = "like-button" type = "checkbox"></input>
                <label for = "like-button">
                  <i class="fas fa-heart"></i>
                  <p>${randomData.likes}</p>
                </label>
            </div>
            <div class = "item" id = "item">
              <input class = "favourite-button" id = "favourite-button" type = "checkbox"></input>
                <label for = "favourite-button">
                  <i class="fas fa-star"></i>
                  <p>3</p>
                </label>
              </div>
          </div>
      </div>
      `;

      //append the post to the container
      cardContainer.appendChild(post);
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