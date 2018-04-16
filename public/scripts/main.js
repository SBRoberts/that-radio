'use strict';

var app = {};

// app.searchResults = [];

var apiKeys = function apiKeys() {
    return $.ajax({
        url: '/dev/scripts/apiKeys.js',
        method: 'GET',
        dataType: 'json'
    }).then(function (res) {
        res = res.apiKeys;
        app.apiKeys = res;
    });
};

// DOM ELEMENTS
// SEARCH
app.search = $('.search');
app.query = $('.query');

// STATIONS
app.stations = $('.stations');

// GIF-RELATED
app.gifMenu = $('.gifMenu');

// GIF OVERLAY ELEMENT
app.$overlay = $('.overlay');

// HEADER/SIDE MENU
app.$header = $('header');

var currentStation = 'ShJAbFEOMvE';

// get the entire station from just the video id
app.currentStation = function () {
    for (var i = 0; i < app.searchResults.length; i++) {
        if (app.searchResults[i].id.videoId === currentStation) {
            var index = app.searchResults.indexOf(app.searchResults[i]);
            return index;
        }
    }
};

// Query YouTube and retrieve gifs from the same query
app.ytQuery = function () {
    var queryVal = '';

    // on keydown, get the value of the search input and search YouTube w/ it
    $(app.query).on('keydown', function () {
        queryVal = app.query.val();
        app.ytData(queryVal);
        app.stations.empty();
    });

    // on search submit, load stations and gifs
    $(app.search).on('submit', function (e) {
        e.preventDefault();
        app.loadStations();
        app.giphyInit(queryVal);
    });

    // on focus, clear the existing gifs from the list
    $(app.query).on('focus', function () {
        app.gifMenu.empty();
    });
};
// Google Javascript client library and YouTube api initialization and defining YouTube search parameters. When called this function will query YouTube using the Google Data API through the necessary Google JS client library.
app.ytData = function (query) {
    // YouTube API Boilerplate Start
    function createResource(properties) {
        var resource = {};
        var normalizedProps = properties;
        for (var p in properties) {
            var value = properties[p];
            if (p && p.substr(-2, 2) == '[]') {
                var adjustedName = p.replace('[]', '');
                if (value) {
                    normalizedProps[adjustedName] = value.split(',');
                }
                delete normalizedProps[p];
            }
        }
        for (var p in normalizedProps) {
            // Leave properties that don't have values out of inserted resource.
            if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
                var propArray = p.split('.');
                var ref = resource;
                for (var pa = 0; pa < propArray.length; pa++) {
                    var key = propArray[pa];
                    if (pa == propArray.length - 1) {
                        ref[key] = normalizedProps[p];
                    } else {
                        ref = ref[key] = ref[key] || {};
                    }
                }
            };
        }
        return resource;
    }

    function removeEmptyParams(params) {
        for (var p in params) {
            if (!params[p] || params[p] == 'undefined') {
                delete params[p];
            }
        }
        return params;
    }

    function executeRequest(request) {
        request.execute(function (response) {
            var results = response.items;
            app.searchResults = results;
        });
    }

    function buildApiRequest(requestMethod, path, params, properties) {
        params = removeEmptyParams(params);
        var request;
        if (properties) {
            var resource = createResource(properties);
            request = gapi.client.request({
                'body': resource,
                'method': requestMethod,
                'path': path,
                'params': params
            });
        } else {
            request = gapi.client.request({
                'method': requestMethod,
                'path': path,
                'params': params
            });
        }
        executeRequest(request);
    }

    function defineRequest() {
        // define api requests here, constructs url
        buildApiRequest('GET', '/youtube/v3/search', { 'eventType': 'live',
            'maxResults': '25',
            'part': 'snippet',
            'q': 'music ' + query,
            'order': 'relevance',
            'type': 'video' });
    }
    // YouTube API boilerplate end

    // Initialize Google JS client library
    function start() {
        // 2. Initialize the JavaScript client library.
        gapi.client.init({
            'apiKey': app.apiKeys.google
        }).then(function () {
            // 3. Initialize and make the API request.
            gapi.client.request({
                'path': '' + defineRequest()
            });
        }).then(function (response) {}, function (reason) {
            console.log(reason);
            console.log('Error: ' + reason.result.error.message);
        });
    };
    // 1. Load the JavaScript client library.
    gapi.load('client', start);
};

// LOAD VIDEO INFO TO DOM
app.loadStations = function () {
    var stationInfo = {};
    app.searchResults.forEach(function (station) {
        app.stations.append('\n            <div class="station" data-station-id="' + station.id.videoId + '">\n                <h2 class="channel">' + station.snippet.channelTitle + '</h2>\n            </div>\n        ');
    });

    // Play station from list
    $('.station').on('click', function (event) {

        currentStation = $(this).data("stationId");

        app.$overlay.find('h2').remove();
        app.$overlay.append('<h2 class="nowPlaying">' + app.searchResults[app.currentStation()].snippet.channelTitle + '</h2>');

        player.loadVideoById(currentStation);
        player.playVideo();
    });
};

// A function for station changes. If shuffle is not pressed, the station is changed to the next or previous one
var stationChange = function stationChange(shuffle, val) {
    if (shuffle === false) {
        currentStation = app.searchResults[app.currentStation() + val].id.videoId;
    } else {
        var randomStation = Math.floor(Math.random() * app.searchResults.length + 1);
        currentStation = app.searchResults[randomStation].id.videoId;
    }
    app.$overlay.find('h2').remove();
    app.$overlay.append('<h2 class="nowPlaying">' + app.searchResults[app.currentStation()]['snippet']['channelTitle'] + '</h2>');
    player.loadVideoById(currentStation);
};

// load next station on input click
$('.nextStation').on('mousedown', function () {
    stationChange(false, 1);
    // **** ADD ERROR HANDLING
});

// load previous station on input click
$('.prevStation').on('mousedown', function () {
    stationChange(false, -1);
    // **** ADD ERROR HANDLING
});

// load random station on input click
$('.shuffle').on('mousedown', function () {
    stationChange(true);
    // **** ADD ERROR HANDLING
});
// toggle the gif menu when the button is clicked
$('.backgroundMenu').on('click', function () {
    app.gifMenu.toggle('slide');
});

// LOAD YOUTUBE IFRAME
// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player = void 0;
function onYouTubeIframeAPIReady() {
    console.log('ready');
    player = new YT.Player('player', {
        height: 'auto',
        width: '100%',
        events: {
            'onReady': onPlayerReady
        }
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {}
// event.target.playVideo();


// manage the ui - responsive elements
app.ui = function () {
    // trigger animations on menu click
    $("#menu").on('change', function () {
        var width = $(document).width();
        if ($(this)[0].checked !== true) {
            // If the header is closed - if document width is greater than X, animate the header accordingly
            if (width > 480) {
                app.$header.animate({ width: "5vmax" });
            } else {
                app.$header.animate({ width: "100%", height: "3.5rem" });
            }

            app.search.toggle("slide", 150);
            $('.hamburger').toggleClass('closeMenu');
        } else {
            // If header is open - if document width is greater than X, animate the header accordingly
            if (width > 480) {
                app.$header.animate({ width: "30vmax" });
            } else {
                app.$header.animate({ width: "inherit", height: "100%" });
            }
            app.search.toggle("slide", 150);
            $('.controls').css({ margin: '0' });
            $('.hamburger').toggleClass('closeMenu');
        }
    });
};
app.gifMenu.width($(document).width() - app.$header.width());

// Initialize Giphy api, parameter is search term for gifs
app.giphyInit = function (query) {
    $.ajax({
        url: 'http://api.giphy.com/v1/gifs/search',
        method: 'GET',
        dataType: 'json',
        data: {
            q: query,
            api_key: app.apiKeys.giphy,
            limit: '10'
        }
    }).then(function (res) {
        res.data.forEach(function (gif) {
            var gifUrl = gif.images.original.url;
            $('.gifMenu').append('\n                <div class="gif">\n                    <img src="' + gifUrl + '" alt="" data-gif-url="' + gifUrl + '">\n                </div>\n                ');
            app.overlay();
        });
    });
};

// get the url of clicked gif and set it as the background when function is called
app.overlay = function () {
    $('.gif').on('click', function () {
        var clickedUrl = $(this).find('img').data("gifUrl");
        app.$overlay.css({ background: 'url("' + $(this).find('img').data("gifUrl") + '") no-repeat center' });
        app.$overlay.css('background-size', 'cover');
        app.$overlay.find('.landing').remove();
    });
};

app.playPause = function () {

    // play/pause on screen click (the overlay prevents the iframe from being click-paused)
    app.$overlay.on('click', function () {
        var playerState = player.j.playerState;
        if (playerState === 1) {
            player.pauseVideo();
            app.$overlay.find('.playPause').toggle('fade', 50, 'ease-out');
        } else {
            player.playVideo();
            app.$overlay.find('.playPause').toggle('fade', 50, 'ease-out');
        }
    });

    // play/pause on spacebar press
    $(document).on('keyup', function (e) {
        var playerState = player.j.playerState;
        e = e.key;
        if (playerState === 1 && e === " ") {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    });
};

app.init = function () {
    apiKeys();
    app.ytData();
    app.ytQuery();
    app.ui();
    app.playPause();
};

$(function () {
    app.init();
});