<<<<<<< HEAD
function myFunction() {
  var x = document.getElementById("myLinks");
  if (x.style.display === "block") {
    x.style.display = "none";
  }  
  
  else {
    x.style.display = "block";
  }
}

//used to create a google map
function initMap() {
  var map;
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 0, lng: 0},
    zoom: 2.5
=======
document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera

document.body.scrollTop = 0; // For Safari

//used to create a google map
function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 0, lng: 0},
    zoom: 2.5,
    //remove streetview
    streetViewControl: false,
    //remove map type (eg. satellite, terrain, etc.)
    mapTypeControl: false
>>>>>>> c3cabd4 (UI update for mobile, dark mode/light mode, and cleaner icons)
  });

  var marker = new google.maps.Marker({
    position: {lat: 37.7749, lng: -122.4194},
    map: map,
    title: 'San Francisco',
  });

  var infowindow = new google.maps.InfoWindow({
    content: '<img src="assets/Pagani Zonda F.jpg" alt="Image" style="width: 400px; height: auto;"><br>Pagani Zonda F <br> Date: 2019-07-01 <br> User: JOHN',
  });

  marker.addListener('click', function() {
    if (infowindow.getMap()) {
      infowindow.close();
    } else {
      infowindow.open(map, marker);
    }
  });
}

initMap();
<<<<<<< HEAD
=======


>>>>>>> c3cabd4 (UI update for mobile, dark mode/light mode, and cleaner icons)
