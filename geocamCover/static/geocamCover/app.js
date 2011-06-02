var map;
var loc;

function initialize() {
  var latlng = new google.maps.LatLng(37.41288, -122.052934);
  var myOptions = {
    zoom: 12,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
	map = new google.maps.Map(document.getElementById("map_canvas"),
		    myOptions);
		
	google.maps.event.addListener(map, 'click', function(event){
		loc = event.latLng;
		$('div#forms').css("visibility", "visible");
		$('input#name').focus();
		
		return false;
	})
}

function placeMarker(name) {
  var marker = new google.maps.Marker({
      position: loc, 
      map: map,
			title: name.val()
  });

	name.val("")
	$('div#forms').css("visibility", "hidden");
	
	return false;
}

// function addName(name) {
// 	alert(name);
// 	marker.title = name;
// 	alert(marker.title);
// }