var applicationid = "oEhx7MD4NJ9dmwOTJVYIsDtSPRwxYYlXSwm13dI3";
var apikey = "jd6bIkiEcWb89gHyQUuMYhst6d6hkWkcB3ySWzUv";
var lat = 38.971667;
var long = -95.235278;
var map;

//var marker;

var publicmarkers = [];
var userId = null;
var sessId = null;
var markerId = null;
var infowindow = new google.maps.InfoWindow();

function makeMap(){
	
	//arguments would be user Id, Session Id, and the marker id associated with the user otherwise the user isn't registered and we should use the public map instead.  
    var userHasNoMarker = false;
	if(arguments.length == 3){
		userId = arguments[0];
		sessId = arguments[1];
		markerId = arguments[2];
		//alert("User ID " + arguments[0] + " markerId " + markerId);
	    if(markerId){
		    	return getUserMap(markerId);
		}else{
			userHasNoMarker = true;
			makeMarkerFromZip(userId);
		}
	}
	var coord = new google.maps.LatLng(lat,long);
 	var mapOptions = {
    		center: coord,
    		zoom: 4,
    		mapTypeId: google.maps.MapTypeId.SATELLITE
    };
    //alert(coord);
    map =  new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

    if(userHasNoMarker){
		google.maps.event.addListener(map, 'click', function(event) {
			infowindow.close();
			addTempMarker(event.latLng);
		});
	}else{
 	   	google.maps.event.addListener(map, 'click', function(event) {
			infowindow.close();
		});
	}

    getMarkers();
}

function getUserMap(markerId){
	var ajax = xmlhttp(function(){
		if(ajax.readyState == 4){
			if(ajax.responseText != ""){
				userMarker =  eval( "(" + ajax.responseText + ")");
			//	alert(JSON.stringify(userMarker));
				if(userMarker.objectId){
					lat = userMarker.location.latitude;
					long = userMarker.location.longitude;
					zoomlevel = 8;	 
					var coord = new google.maps.LatLng(lat,long);
			 		var mapOptions = {
			    			center: coord,
			    			zoom: zoomlevel,
			    			mapTypeId: google.maps.MapTypeId.SATELLITE
					};	
					map =  new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
					/* Clicking the map won't do anything, clicking a pin will still show you that pin's content
					google.maps.event.addListener(map, 'click', function(event) {
						infowindow.close();
						addTempMarker(event.latLng);
					});
					*/
					getMarkers();
				}else{
					//this means that the user has a markerId but it points to nothing, so we set the id to null and make the map accordingly
					editUser(userId, {markerID:null});
					markerId = null;
					makeMap(userId, sessId, markerId);
				}
			}
		}	
	});
	ajax.open("GET", "https://api.parse.com/1/classes/markers/" + markerId,false);
	ajax.setRequestHeader("X-Parse-Application-Id", applicationid);
	ajax.setRequestHeader("X-Parse-REST-API-Key", apikey);
	ajax.setRequestHeader("Content-Type","application/json");
	ajax.send();

}


function getMarkers(){
	if(marker){
		marker.setMap(null);
	}
	for(i = 0; i < publicmarkers.length; i++){
			publicmarkers[i].marker.setMap(null);
	}
	publicmarkers = [];
	var	ajax = xmlhttp(function(){
		if(ajax.readyState == 4){
			if(ajax.responseText != ""){
				//alert("GOT MARKERS "+ ajax.responseText);
				var markers = eval("(" + ajax.responseText +")");
				homeImage = "http://www.google.com/intl/en_us/mapfiles/ms/micons/purple-dot.png";
				for(var i = 0; i < markers.results.length; i++)
				{
					//alert(JSON.stringify(markers.results[i].owner));
					var tempmark = new google.maps.Marker({
						position:new google.maps.LatLng(markers.results[i].location.latitude, markers.results[i].location.longitude),
						map:map
					});
					//alert("markers.results[" + i + "].owner: " + markers.results[i].objectId + " == markerId: " + markerId);
					if(markers.results[i].objectId == markerId){
						tempmark.setIcon(homeImage);
					}
					publicmarkers.push({marker:tempmark, content:markers.results[i].content, objectId:markers.results[i].objectId});	

					google.maps.event.addListener(tempmark, 'click', function(event) {
						for(var j = 0; j < publicmarkers.length; j++){
							if(publicmarkers[j].marker.position == event.latLng){
								if(marker){
									marker.setMap(null);
								}
								if(publicmarkers[j].content != undefined){
								    var content = "<div id = 'pincontent'> " + publicmarkers[j].content +"</div>";
								}
								else{
								    var content = "<div id = 'pincontent'> </div>";
								}
								
								
								//alert(publicmarkers[j].objectId +" == " + markerId);
								if(publicmarkers[j].objectId == markerId){
									content +="<form>Edit Thoughts <INPUT TYPE='text' id='content_box'> <INPUT TYPE='button' NAME='addmarker' Value='Change Comments' onClick='addMarker("+publicmarkers[j].marker.getPosition().lat()+","+publicmarkers[j].marker.getPosition().lng()+ ")'></form>";
								}
								infowindow.setContent(content);
								infowindow.open(map, publicmarkers[j].marker);
							}
						}
			   		});
				}
			}
		}
	});
	ajax.open('GET', "https://api.parse.com/1/classes/markers",true);
	ajax.setRequestHeader("X-Parse-Application-Id", applicationid);
	ajax.setRequestHeader("X-Parse-REST-API-Key", apikey);
	ajax.setRequestHeader("Content-Type","application/JSON");
	ajax.send();

}

function makeMarkerFromZip(var userID){

	parseApiCall("GET", "users/" + userID, , function(dataout){
		alert("this works so far");
		geocoder = new google.maps.Geocoder();
		geocoder.geocode( {'address':dataout.zip_code, function(results, status){
			 if (status == google.maps.GeocoderStatus.OK){
			 	//adds or subtracts  a number [0,1]*.5 to the lat and long to space out the points
			 	randLat = results.location.lat() + (-1 * Math.round(Math.random()) + Math.random() * .5);
			 	randLong = results.location.lng() + (-1 * Math.round(Math.random() + Math.random() * .5);
			 	alert("randLong " + randLong + " randLat " + randLat);
			 	newMarker(randLat, randLong, ""); 
			}
		}});
	});

}


//this will change a markers content or position, right now we are only using it for content, but once long ago we could change both properties
function changeMarker(con){
	var ajax = xmlhttp(function(){
		if(ajax.readyState == 4){
			if(ajax.responseText != ""){
				//alert("Changed Marker " + ajax.responseText);
				changedMarker = eval('(' + ajax.responseText + ')');
				infowindow.close();
				if(marker){
					marker.setMap(null);
				}
				map.panTo(new google.maps.LatLng(newlat,newlong));
				getMarkers();

			}
		}
	});

	var tosend = {content:con};
	//alert("changing marker " + JSON.stringify(tosend));
	ajax.open('PUT', 'https://api.parse.com/1/classes/markers/' + markerId ,true);
	ajax.setRequestHeader("X-Parse-Application-Id", applicationid);
	ajax.setRequestHeader("X-Parse-REST-API-Key", apikey);
	ajax.setRequestHeader("Content-Type","application/json");
	ajax.send(JSON.stringify(tosend));
}

//this makes the users marker, it only gets called if they log on, 
function newMarker(newLat, newLong, con){
		var ajax  = xmlhttp(function(){
			if(ajax.readyState == 4){
				if(ajax.responseText != ""){
					//alert("new marker " + ajax.responseText);
					newMarker = eval('(' + ajax.responseText + ')');
					//alert("UserId: " + userId + " markerId: "+newMarker.objectId);
					editUser(userId, {markerID:newMarker.objectId});
					map.setZoom(8);
					map.panTo(new google.maps.LatLng(newLat, newLong));
					markerId = newMarker.objectId;
					infowindow.close();
					marker.setMap(null);
				}
			}

			
		});
		var tosend = {location:{__type:"GeoPoint", latitude:newLat, longitude:newLong},owner:userId,content:con};
		//alert(JSON.stringify(tosend));
		ajax.open('POST', 'https://api.parse.com/1/classes/markers',true);
		ajax.setRequestHeader("X-Parse-Application-Id", applicationid);
		ajax.setRequestHeader("X-Parse-REST-API-Key", apikey);
		ajax.setRequestHeader("Content-Type","application/json");
		ajax.send(JSON.stringify(tosend));
	}




function editUser(user, jsonToAdd){
	//alert(sessId);
	
	var ajax = xmlhttp(function(){
		if(ajax.readyState == 4){
			if(ajax.responseText != ""){
				//alert("Edited user " + userId +  ":  " + ajax.responseText);
				getMarkers();
			}	
		}
	});
//	alert("ADDING " + JSON.stringify(jsonToAdd));
	ajax.open("PUT", "https://api.parse.com/1/users/" + user,true);
	ajax.setRequestHeader("X-Parse-Application-Id", applicationid);
	ajax.setRequestHeader("X-Parse-REST-API-Key", apikey);
	ajax.setRequestHeader("X-Parse-Session-Token", sessId);
	ajax.setRequestHeader("Content-Type","application/json");
	ajax.send(JSON.stringify(jsonToAdd));

}

function xmlhttp(func){
	try{
		temp = new XMLHttpRequest();
	}catch(e){
		//alert("ERROR SUBMITTING AJAX REQUEST");
	}
	temp.onreadystatechange = func;
	return temp;
}


//we don't need to add temp markers anymore :(

/*
function addTempMarker(location) {
	if(marker){
		marker.setMap(null);
	}
	infowindow.close();
	var infoContent;
	
	if(markerId){
		infoContent = "<div id='tempwindow'><form>Edit thoughts <INPUT TYPE='text' id='content_box'> <INPUT TYPE='button' NAME='addmarker' Value='Change Pin Position' onClick='addMarker("+location.lat()+","+location.lng()+ ")'></form></div>";
	}else{
		infoContent = "<div id='tempwindow'><form>Share your thoughts <INPUT TYPE='text' id='content_box'> <INPUT TYPE='button' NAME='addmarker' Value='Add to Map' onClick='addMarker("+location.lat()+","+location.lng()+ ")'></form></div>";
	}
  	
  	infowindow = new google.maps.InfoWindow({
  		content:infoContent
	});
  
  marker = new google.maps.Marker({
	position:location,
	map: map,
	icon:"http://www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png"
  });
  infowindow.open(map, marker);
}

*/

//automatically adds marker for user, don't need this either

/*
function addMarker(newlat, newlong){

	var content = document.getElementById("content_box").value;
	if(content == ""){
		content = undefined;
	}
	//alert("adding marker" + markerId + content);
	if(markerId){
		changeMarker(newlat, newlong, content);
	}else{
		newMarker(newlat,newlong,content);
	}

}
*/