mapboxgl.accessToken =
  "pk.eyJ1IjoiZXNva29sZXRza3kiLCJhIjoiY2s1d3Bua2FhMXhoZzNrbGJjbXMyYXAyYiJ9.QRvhCDeR372kJWIf1NDDMg";
var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [-74.009, 40.705], // starting position
  zoom: 12
});

// set the bounds of the map
// var bounds = [
//   [-123.069003, 45.395273],
//   [-122.303707, 45.612333]
// ];
// map.setMaxBounds(bounds);

var marker = new mapboxgl.Marker() // initialize a new marker
  .setLngLat([-74.009, 40.705]) // Marker [lng, lat] coordinates
  .addTo(map); // Add the marker to the map

// initialize the map canvas to interact with later
var canvas = map.getCanvasContainer();

// an arbitrary start will always be the same
// only the end or destination will change
var start = [-74.009, 40.705];

// this is where the code for the next step will go
function getRoute(end) {
  // make a directions request using cycling profile
  // an arbitrary start will always be the same
  // only the end or destination will change
  var start = [-74.009, 40.705];
  var url =
    "https://api.mapbox.com/directions/v5/mapbox/cycling/" +
    start[0] +
    "," +
    start[1] +
    ";" +
    end[0] +
    "," +
    end[1] +
    "?steps=true&geometries=geojson&access_token=" +
    mapboxgl.accessToken;

  // make an XHR request https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.onload = function() {
    var json = JSON.parse(req.response);
    var data = json.routes[0];
    var route = data.geometry.coordinates;
    var geojson = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: route
      }
    };

    // if the route already exists on the map, reset it using setData
    if (map.getSource("route")) {
      map.getSource("route").setData(geojson);
    } else {
      // otherwise, make a new request
      map.addLayer({
        id: "route",
        type: "line",
        source: {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: geojson
            }
          }
        },
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#3887be",
          "line-width": 5,
          "line-opacity": 0.75
        }
      });
    }
    // add turn instructions here at the end
  };
  req.send();
}

map.on("load", function() {
  // make an initial directions request that
  // starts and ends at the same location
  getRoute(start);

  // Add starting point to the map
  // map.addLayer({
  //   id: "point",
  //   type: "circle",
  //   source: {
  //     type: "geojson",
  //     data: {
  //       type: "FeatureCollection",
  //       features: [
  //         {
  //           type: "Feature",
  //           properties: {},
  //           geometry: {
  //             type: "Point",
  //             coordinates: start
  //           }
  //         }
  //       ]
  //     }
  //   },
  //   paint: {
  //     "circle-radius": 10,
  //     "circle-color": "#3887be"
  //   }
  // });
  // this is where the code from the next step will go
});

map.on("click", function(e) {
  var coordsObj = e.lngLat;
  canvas.style.cursor = "";
  var coords = Object.keys(coordsObj).map(function(key) {
    return coordsObj[key];
  });
  var end = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: coords
        }
      }
    ]
  };
  if (map.getLayer("end")) {
    map.getSource("end").setData(end);
  } else {
    map.addLayer({
      id: "end",
      type: "circle",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: coords
              }
            }
          ]
        }
      },
      paint: {
        "circle-radius": 10,
        "circle-color": "#f30"
      }
    });
  }
  getRoute(coords);
});

// Geocoding

var geocoder = new MapboxGeocoder({
  // Initialize the geocoder
  accessToken: mapboxgl.accessToken,

  // Set the access token
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  marker: false // Do not use the default marker style
  // bbox: [-73.982, 40.72],
  // proximity: {
  //   longitude: -74.009,
  //   latitude: 40.705
  // } //cordinates for Fullstack
});

// Add the geocoder to the map
map.addControl(geocoder);

// After the map style has loaded on the page,
// add a source layer and default styling for a single point
map.on("load", function() {
  map.addSource("single-point", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: []
    }
  });

  map.addLayer({
    id: "point",
    source: "single-point",
    type: "circle",
    paint: {
      "circle-radius": 10,
      "circle-color": "#448ee4"
    }
  });

  // Listen for the `result` event from the Geocoder
  // `result` event is triggered when a user makes a selection
  //  Add a marker at the result's coordinates
  geocoder.on("result", function(e) {
    map.getSource("single-point").setData(e.result.geometry);
  });
});
