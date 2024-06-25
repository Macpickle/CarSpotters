const pinTemplate = 
`
<div class = "pin">
  <div class = "pin-content">
    <div class = "pin-header">
      <h1>{username</h1>}
      <h3>{model},{title}</h3>
    </div>
    <div class = "pin-body">
      <img src = "{photo}" alt = "car image">
    </div>
  </div>
</div>
`

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
      title: data[i].username,
      description: data[i].model + " " + data[i].title,
      visible: false,
    });

    infobox.setMap(map);

    pin.metadata = {
      title: data[i].username,
      model: data[i].model,
      title: data[i].title,
      photo: data[i].photo
    };

    Microsoft.Maps.Events.addHandler(pin, 'click', function(e) {
      infobox.setOptions({
        location: e.target.getLocation(),
        title: e.target.metadata.title,
        description: e.target.metadata.model + " " + e.target.metadata.title,
        visible: true
      });
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
function loadMap(){
  var map = new Microsoft.Maps.Map(document.getElementById('map'));
  map.setView({
    center: new Microsoft.Maps.Location(0, 0),
    zoom: 1
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

window.onload = loadMap;