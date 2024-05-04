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
const throttle = (callback, time) => {
  if (throttleTimer) return;

  throttleTimer = true;

  setTimeout(() => {
    callback();
    throttleTimer = false;
  }, time);
};

console.log();

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
    const randomNumber = Math.floor(Math.random() * data.length);
    const randomData = data[randomNumber];
    const post = document.createElement("div");
    post.className = "post";
    post.innerHTML = `
    <form action="/viewPost/${randomData._id}" method="GET">
      <button>
        <div class = "post-header">
            <div class = "post-content">
                <div class = "post-header-upper">
                    <div class="profile-picture">
                        <i class="fa-solid fa-circle-user"></i>
                    </div>
                    <h3>${randomData.username}</h3>
                    <p class = "carInformation">${randomData.carModel}, ${randomData.carTitle}</p>
                </div>
                <div class = "post-header-lower">
                    <p>${randomData.description}</p>
                </div>
            </div>
            <div class = "post-date">
                <p>${randomData.date}</p>
            </div>
        </div>
        <div class = "post-image">
            <img src = "${randomData.photo}" alt = "Pagani Zonda F">
        </div>
      </div>
      </button>
    </form>

    `;
    console.log("created card");

    cardContainer.appendChild(post);
  })
  .catch(error => {
    console.error('Error:', error);
  });
};

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

// check if full
document.querySelector('form').addEventListener('submit', function(event) {
  var carModel = document.getElementById('carModel').value;
  var carName = document.getElementById('carName').value;
  var location = document.getElementById('location').value;
  var description = document.getElementById('description').value;
  
  if (carModel.trim() === '' || carName.trim() === '' || location.trim() === '' || description.trim() === '') {
      event.preventDefault();
      alert('Please fill in all required fields.');
  }
});