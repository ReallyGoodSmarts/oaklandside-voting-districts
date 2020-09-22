// NPM modules
// Use whatever you like
const _ = {};
_.assign = require('lodash.assign');

const d3 = _.assign({},
  require("d3-selection")
);

// Mapbox stuff
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FkYnVtYmxlYmVlIiwiYSI6ImVCdE9rY28ifQ.iQDg2GpQ5YsZzn4b029Auw'
const mapboxgl = require('mapbox-gl');
const MapboxGeocoder = require('mapbox-gl-geocoder');

let usrState = {
  coords: []
}

// Districts data
const districts = require('../data/districts.json')

function init() {
  // Check USER's location
  getLocation();

  // If yes => reveal map, return district

  // If no => offer map

  // On click on location => refire check USER's location

  // Instantiate a simple map
  mapboxgl.accessToken = MAPBOX_TOKEN; // replace this with your access token
  let map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/sadbumblebee/ckfdingbk0nw819rzn1i53gux',
      center: [-122.2712, 37.8044],
      zoom: 12
    });

  // Instantiate geocoder search
  let geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    countries: 'us',
    placeholder: 'Enter your location',
    flyTo: false,
    marker: {
        element: '<div class="user-marker"></div>'
    },
    setRenderFunction: (item) => {
        console.log(item)
    }
  });

  // Onload resize handler
  map.on('load', () => {
    // Resize on load
    map.resize();

    map.addSource('districts', {
      type: 'geojson',
      data: districts
    });

    map.addLayer({
      'id': 'districts-line',
      'type': 'line',
      'source': 'districts',
      'layout': {},
      'paint': {
        'line-color': '#fff',
        'line-width': 5,
        'line-opacity': 0.8
      }
    });

    map.addLayer({
      'id': 'districts-fill',
      'type': 'fill',
      'source': 'districts',
      'layout': {},
      'paint': {
        'fill-color': '#088',
        'fill-opacity': 0.25
      }
    });
  });
// Add geocoder to panel
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));
}

function getLocation() {

  function success(position) {
      usrState.coords['lat']  = parseFloat(position.coords.latitude);
      usrState.coords['lng'] = parseFloat(position.coords.longitude);
      setMap(usrState.coords);
  }

  function error() {
      console.log('Unable to retrieve your location');
  }

  // Check if Available
  if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser');
  } else {
      console.log('Locating…');
      navigator.geolocation.getCurrentPosition(success, error);
  }

}

function setMap(coords) {
  console.log(coords);
}

// Bind on-load handler
document.addEventListener("DOMContentLoaded", () => {
  init();
});