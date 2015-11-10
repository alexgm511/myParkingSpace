// script.js

	// Create neighborApp module 
	var neighborApp = angular.module('neighborApp',[]);

	neighborApp.controller('mapController', ['$scope', '$timeout', 'gmap', 'geocoder', 'infowindow', 'parkWhiz', function($scope, $timeout, gmap, geocoder, infowindow, parkWhiz) {
		$scope.geocoder = geocoder;
		$scope.infowindow = infowindow;
		$scope.fsqResults = [];
		$scope.services = [];
		$scope.allServices = [];
		$scope.placeTypes = [];
		$scope.markers = [];
	    $scope.showServices = false;
	    $scope.markersHide = false;
		$scope.toggleError = false;
		$scope.parkResults = [];
		$scope.gotResults = false;
		$scope.sorryMsg = false;
		$scope.myLat = 38.899192;
		$scope.myLng = -77.036871;
		$scope.defZoom = 16;


        // Get the location object from the current map
        
	   // Input field for neighborhood
	    $scope.findPlace = function(loc) {
			$scope.showServices = false;
            $scope.services = [];
            $scope.allServices = [];
            $scope.placeTypes = [];
            $scope.markersHide = true;
            $scope.hideMarkers();
            $scope.markers = [];
			$scope.gotResults = false;
			$scope.sorryMsg = false;
	        var myLocation = $scope.map.getCenter();
	        
	    	if (loc) {
				$scope.geocoder.geocode({
                    'address': loc
                }, function(results, status) {
	                    if (status == google.maps.GeocoderStatus.OK) {						
	                        myLocation = results[0].geometry.location;
	                   } else {
	                        alert('Sorry, could not find your neighborhood for the following reason: ' + status);
	                   }
			            $scope.map.setCenter(myLocation);
			            $scope.callParkwhiz(myLocation);
               	})	
	    	} else {
	    		$scope.callParkwhiz(myLocation);
	    	}

	    };

	    $scope.callParkwhiz = function(myLocation) {
            var prkWhiz = parkWhiz.getParkRequest(myLocation.lat(), myLocation.lng()); // + '&callback=JSON_CALLBACK';
            //console.log('Get fsqRequest: ' + foursq);
			parkWhiz.getParkwhiz(prkWhiz + '&callback=JSON_CALLBACK').then(function(resp) {
				if (resp.data.locations > 0) {
					$scope.gotResults = true;
					$scope.parkResults = resp.data.parking_listings;
					//console.log('$scope.parkResults: ' + $scope.parkResults);
					$scope.parkingResults($scope.parkResults);
				} else {
					$scope.gotResults = false;
					$scope.sorryMsg = true;
				}
			});    	
	    }

	    $scope.parkingResults = function(results) {
	    	// Sort markers by price assign proper color key
	    	results.sort(function (a, b) {
			  if (a.price > b.price) {
			    return 1;
			  }
			  if (a.price < b.price) {
			    return -1;
			  }
			  // a must be equal to b
			  return 0;
			});
			
            for (var i = 0; i < results.length; i++) {
            	var place = results[i];

            	var image = "";
            	// Rank by price
	    		if ( i < (results.length/3) ) {
	    			image = "images/ps-orange.png";
	    		} else if ( i < (results.length/3) * 2 ) {
	    			image = "images/ps-red.png";
	    		} else {
	    			image = "images/ps-purple.png";
	    		}

            	$scope.allServices.push(place);
            	$scope.services.push(place);

		        // Generate Google Map markers for each Parkwhiz place 
	            var placeLoc = {
	                'lat': place.lat,
	                'lng': place.lng
	            };
	            var marker = new google.maps.Marker({
	                map: null, 
	                position: placeLoc,
	                id: place.listing_id,
	                icon: image 
	            });

	            // add marker to markers array
	            $scope.markers.push(marker);
	            (function( currMarker ) {
					// Html for the inside of each marker message including a Google map image of the given coordinates
		            //var markerTxt = markerTxt = '<div class="markerMsg"><h5>' + place.location_name + '</h5>' + 
		            	'<h2>' + place.price_formatted + '</h2><p>Available spots: <strong>' + place.available_spots +
		            	'</strong><br>' + place.address + '</p><img src="https://maps.googleapis.com/maps/api/streetview?size=200x113&location=' + place.lat + ',' + place.lng + '" /></div>';
		            // Simplified marker -- took out google photo
		            var markerTxt = markerTxt = '<div class="markerMsg"><h5>' + place.location_name + '</h5>' + 
		            	'<h2>' + place.price_formatted + '</h2><div class="available">Available spots: <strong>' + place.available_spots +
		            	'</strong></div><p>' + place.address + '</p></div>';
		            // add a click listener to each marker with the infoWindow content
		            google.maps.event.addListener(currMarker, 'click', function() {
		                $scope.infowindow.setContent(markerTxt);
		                $scope.centerMarker(this);
		                $scope.infowindow.open($scope.map, this);
		            });
	            })(marker);
            }
	    	// Sort services by distance from lat/lng location
	    	$scope.services.sort(function (a, b) {
			  if (a.distance > b.distance) {
			    return 1;
			  }
			  if (a.distance < b.distance) {
			    return -1;
			  }
			  // a must be equal to b
			  return 0;
			});

            $scope.markersHide = false;
            $scope.hideMarkers();
	    };

        $scope.hideMarkers = function() {
            if ($scope.markersHide === true) {
                $scope.setAllMap(null);
            } else {
                $scope.setAllMap($scope.map);
            }
            return true;
        };
        // Sets the map on all markers in the array.
        $scope.setAllMap = function(map) {
            for (var i = 0; i < $scope.markers.length; i++) {
                $scope.markers[i].setMap(map);
            }
        };

        // Displays the specific marker when a place from the list is clicked.
        $scope.showPlace = function(place) {
            // get location from clicked item
            var location = {
                'lat': place.lat,
                'lng': place.lng
            }; 
 
            for (var i = 0; i < $scope.markers.length; i++) {
                // find the specific marker by its id
                if ($scope.markers[i].id === place.listing_id) {
                	var marker = $scope.markers[i];
                    // display it on the map
                    marker.setMap($scope.map);
 
                     $scope.centerMarker(marker);

                    // trigger the marker's click event to show the infoWindow
                    google.maps.event.trigger(marker, 'click');
                }
            }
        };
        $scope.centerMarker = function(marker) {
            // to better see the place, make this marker the center of the map
            // panTo does it slower to avoid a jerky motion.
        	$scope.map.panTo(marker.position);
        	//console.log(marker.position.lat() + ", " + marker.position.lng());
            // calculate the distance from the center to the edge to move the marker down on smaller screens.
        	var bounds = $scope.map.getBounds();
        	var northEast = bounds.getNorthEast();
            var newCenter = parseFloat(marker.position.lat()) + ((parseFloat(northEast.lat()) - parseFloat(marker.position.lat()))*parseFloat(0.3));
            // 'this' gives us the location of the clicked item
            var newLocation = {
				'lat': newCenter,
				'lng': marker.position.lng()
            };
            $scope.map.panTo(newLocation);
        };
		$scope.map = gmap;
		$scope.findPlace('White House, Washington, DC');

	}]);

	neighborApp.directive("venuesToggle", [function() {
        return {
			// Used as an attribute only. Example <div data-venues-toggle="variable"> </div>
			restrict: "A",
			// This is the functions that gets executed after Angular has compiled the html
			link: function(scope, element, attrs) {
				var box = angular.element(element.parent().parent());
				var arrow = angular.element(element.children()[0]);

				changeBox = function() {
					//element.scrollTop(0);
					box.toggleClass('box-expand');
					arrow.toggleClass('arrow-up');
				};
				element.on('click', changeBox);
			}
		}
	}]);

	// Create gmap service which returns a Google map of the default location
	// (The white house in Washington, DC)
	neighborApp.factory('gmap', function() {
		var myLat = 38.899192,
			myLng = -77.036871,
			defZoom = 16;
        var mapOptions = {
            //coordinates to put the white house in the center
            center: {
                lat: myLat,
                lng: myLng
             },
            zoom: defZoom
        };
        gmap = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);
        return gmap;
	});

	// Create service to start Google Geocoder
	neighborApp.factory('geocoder', function() {
		var geocoder = new google.maps.Geocoder();
		return geocoder;
	});

	// Create service to generate map info window
	neighborApp.factory('infowindow', function() {
		var infowindow = new google.maps.InfoWindow();
		return infowindow;
	});


	// Create services for calling Parkwhiz API and formatting results
	neighborApp.service('parkWhiz', ['$http', function($http) {
        var parkKey = 'key=f6729e3acfcd67988fc9d1281c78e435';
        var date = Date.now();
        // add 8 hours in miliseconds
        var datePlus8 = date + 28800000;
        this.getParkRequest = function(lat, lng) {
	        //var parkRequest = 'http://api.parkwhiz.com/search/?lat=' + lat + '&lng=' + lng + '&start=' + date + '&end=' + datePlus8 + '&' + parkKey;
	        var parkRequest = 'http://api.parkwhiz.com/search/?lat=' + lat + '&lng=' + lng + '&' + parkKey;
	        return parkRequest;
    	}
	    this.getParkwhiz = function (newUrl) {
	        var promise = $http({
	            method: 'JSONP',
	            url: newUrl
	        }).then(function (data) {
	            return data;
	        });
	        return promise;
	    }

	}]);

