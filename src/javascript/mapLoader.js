//map reset zoom
function resetZoom(){
  map.setView({
    center: 0,
    zoom: 1
  });
}

function changeLocation() {
  var location = document.getElementById("search").value;
  console.log(location);
  
  fetch("/geoCode", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({location: location})
  }).then(response => response.json())
  .then(data => {
    if (data == null) {
      document.getElementById("search").style.color = "red";
    } else {
      map.setView({
        center: new Microsoft.Maps.Location(data.lat, data.lng),
        zoom: 15
      });
    }
  });

}

// create pings on map for each car location
function generatePings(data, map) {
  for (var i = 0; i < data.length; i++) {
    var locationParts = data[i].location.split(",");
    var lat = parseFloat(locationParts[0]);
    var lng = parseFloat(locationParts[1]);
    var location = new Microsoft.Maps.Location(lat, lng);

    var pin = new Microsoft.Maps.Pushpin(location, {
      icon: 'https://www.bingmapsportal.com/Content/images/poi_custom.png',
      anchor: new Microsoft.Maps.Point(12, 39),
      draggable: false
    });

    var infobox = new Microsoft.Maps.Infobox(map.getCenter(), {
      visible: false,
    });

    infobox.setMap(map);
    pin.metadata = {
      title: data[i].username,
      model: data[i].model,
      title: data[i].title,
      photo: data[i].photo,
      _id: data[i]._id
    };

    Microsoft.Maps.Events.addHandler(pin, 'click', function(e) {
      infobox.setOptions({
      location: e.target.getLocation(),
      description: `<div class="infobox-content" style="display:flex; flex-direction: column; justify-content: flex-start; align-items: center; height: 6.5rem; overflow: hidden;">
      <img style="width: 70%; object-fit: cover; max-height: 7rem;" src="${e.target.metadata.photo}" alt="car image"> 
      ${e.target.metadata.model} ${e.target.metadata.title}
      </div>`,
      visible: true,
      });
      map.setView({
        center: e.target.getLocation(),
        zoom: 15
      });
    });

    // if infobox is clicked, redirect to car page
    Microsoft.Maps.Events.addHandler(infobox, 'click', function(e) {
        window.location.href = `/viewPost/${e.target.metadata._id}`;
    });

    Microsoft.Maps.Events.addHandler(pin, 'mouseout', function(e) {
      infobox.setOptions({
        visible: false
      });
    });

    map.entities.push(pin);
  }
}

// load BING map
function loadMap(map){
  map.setView({
    center: new Microsoft.Maps.Location(0, 0),
    zoom: 1,
  });

  map.setOptions({
    showMapTypeSelector:false,
  });


  fetch("/getCarLocations", {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => response.json())
  .then(data => {
    generatePings(data, map);
  })
}

var map = new Microsoft.Maps.Map(document.getElementById('map'));
window.onload = loadMap(map);