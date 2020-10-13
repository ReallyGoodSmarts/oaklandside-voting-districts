// NPM modules
// Use whatever you like
const _ = {};
_.assign = require('lodash.assign');
_.throttle = require('lodash.throttle');

const d3 = _.assign({},
    require("d3-selection")
);

const pym = require('pym.js');

// Pym
var pymChild = new pym.Child();

// Mapbox stuff
const MAPBOX_TOKEN = 'pk.eyJ1IjoicmVhbGx5Z29vZHNtYXJ0cyIsImEiOiJja2c4aGd5ZjEwaGMyMnhvMndvNWg1MXp3In0.tcphVTMgN4J8NjabE1KOSg'
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

// Oaklandside URL
const OAK_URL ='https://oaklandside.org/?page_id=382775&ifso='

function init() {
    // Check USER's location on click
    // d3.select('.locator').on('click', _.throttle(getLocation, 650));

    // window on resize communicates height
    window.onresize = updateHeight;

    // Instantiate a simple map
    mapboxgl.accessToken = MAPBOX_TOKEN; // replace this with your access token
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/reallygoodsmarts/ckg8jqeak0txh19r26rpvrjyn',
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
    // Adjust height
        pymChild.sendHeight();
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
                'fill-color': '#004162',
                'fill-opacity': 0.75
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
    let resContainer = d3.select('#result')
        
    // Empty contents of resContainer
    resContainer.html('')
        
    resContainer.append('p')
        .html(`You live in Oakland's ${titleCase(results.fullname)}`)

    resContainer.append('a')
        .attr('href', `${OAK_URL}${results.name}`)
        .attr('target', '_blank')
    
    resContainer    
        .select('a').append('div')
        .attr('class', 'button')
        .html('Election info')


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

    // Send height
    pymChild.sendHeight();
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

function updateHeight() {
    pymChild.sendHeight();
}

// Bind on-load handler
document.addEventListener("DOMContentLoaded", () => {
    init();
});