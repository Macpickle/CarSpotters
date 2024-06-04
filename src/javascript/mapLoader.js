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
    var location = new Microsoft.Maps.Location(47.60357, -122.32945);

    var pin = new Microsoft.Maps.Pushpin(location, {
      icon: 'https://www.bingmapsportal.com/Content/images/poi_custom.png',
      anchor: new Microsoft.Maps.Point(12, 39),
      draggable: true
    });

    map.entities.push(pin);
  }
}

// load BING map
function loadMap(){
  var map = new Microsoft.Maps.Map(document.getElementById('map'));
  map.setView({
    center: new Microsoft.Maps.Location(47.60357, -122.32945)
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