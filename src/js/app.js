// NPM modules
// Use whatever you like
const _ = {};
_.assign = require('lodash.assign');
_.throttle = require('lodash.throttle');

const d3 = _.assign({},
  require("d3-selection")
);

// Mapbox stuff
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FkYnVtYmxlYmVlIiwiYSI6ImVCdE9rY28ifQ.iQDg2GpQ5YsZzn4b029Auw'
const mapboxgl = require('mapbox-gl');
const MapboxGeocoder = require('mapbox-gl-geocoder');
const el = document.createElement('div')
el.className = 'user-marker'
const marker = new mapboxgl.Marker(el);
let map;

// Wherewolf stuff
const Wherewolf = require('wherewolf');

let usrLoc = {}

// Districts data
const districts = require('../data/districts.json');
// Generate new wherewolfe
var districtWolf = Wherewolf();
districtWolf.add('oakDistricts', districts)

function init() {
  // Check USER's location on click
  d3.select('.locator').on('click', _.throttle(getLocation, 650));

  // If yes => reveal map, return district

  // If no => offer map

  // On click on location => refire check USER's location

  // Instantiate a simple map
  mapboxgl.accessToken = MAPBOX_TOKEN; // replace this with your access token
  map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/sadbumblebee/ckfdingbk0nw819rzn1i53gux',
      center: [-122.2712, 37.8044],
      zoom: 10.5
    });

  // Instantiate geocoder search
  let geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    // Restrict to US
    countries: 'us',
    // Restric bounds to Oakland-ish
    bbox: [-122.355881,37.632226,-122.114672,37.885368],
    placeholder: 'Enter your location',
    flyTo: false,
    marker: {
        element: '<div class="user-marker"></div>'
    },
    setRenderFunction: (item) => {
        console.log(item)
    }
  });

  // On result display on map / check voting district
  geocoder.on('result', (e) => {
    if (e == null || e == undefined) {
        console.log('Wrong address')
    } else {
        let location = e.result.center
        usrLoc['lat']  = location[1];
        usrLoc['lng'] = location[0];
        setMap(usrLoc);
    }
});

  // Onload resize handler
  map.on('load', () => {
    // Resize on load
    map.resize();
    var layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    var firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        firstSymbolId = layers[i].id;
        break;
      }
    }

    map.addSource('districts', {
      type: 'geojson',
      data: districts
    });

    map.addLayer({
      'id': 'districts-default',
      'type': 'fill',
      'source': 'districts',
      'layout': {},
      'paint': {
        'fill-color': '#000',
        'fill-opacity': 0.2
      }
    }, firstSymbolId);

    map.addLayer({
      'id': 'districts-selected',
      'type': 'fill',
      'source': 'districts',
      'layout': {},
      'paint': {
        'fill-color': '#088',
        'fill-opacity': 0.45
      },
      'filter': ['in', 'id', '']
    }, firstSymbolId);

  });
// Add geocoder to panel
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));
}

function getLocation() {

  function success(position) {
      usrLoc['lat']  = parseFloat(position.coords.latitude);
      usrLoc['lng'] = parseFloat(position.coords.longitude);
      setMap(usrLoc);
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
  console.log(coords)
  let results = districtWolf.find([coords.lng, coords.lat]).oakDistricts;
  console.log(results);
  // Add results to page for show
  let resContainer = d3.select('#results-container')
  resContainer.select('div')
    .text(`Your district is ${titleCase(results.fullname)}`)

  // Add marker
  marker
    .setLngLat([coords.lng, coords.lat])
    .addTo(map);

  // Move map to center
  map.panTo([coords.lng, coords.lat]);

  // Highlight district
  map.setFilter('districts-selected', [
    'in',
    'id',
    results.id
  ]);
}

function titleCase(str) {
  return str.toLowerCase().split(' ').map( (word) => {
      if (word.length === 3) {
          return (word.toUpperCase())
      } else {
          return (word.charAt(0).toUpperCase() + word.slice(1));
      }
  }).join(' ');
}

// Bind on-load handler
document.addEventListener("DOMContentLoaded", () => {
  init();
});