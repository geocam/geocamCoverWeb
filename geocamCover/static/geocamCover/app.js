var map;
var clicked_location;
var items;

$(document).ready(

        function () {
            var latlng = new google.maps.LatLng(37.41288, -122.052934);
            var myOptions = {
                zoom: 12,
                center: latlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            map = new google.maps.Map(document.getElementById("map_canvas"),
                    myOptions);

            google.maps.event.addListener(map, 'click', function(event) {
                clicked_location = event.latLng;
                $('div#forms').css("visibility", "visible");
                $('input#name').focus();

                return false;
            })

            $("#marker_form").submit(function() {
                var place = placeMarker(clicked_location, $('input#name').val());


                var new_place = JSON.stringify({"latitude": clicked_location.lat(),
                            "longitude": clicked_location.lng() ,
                            "name": $('input#name').val() });

                $.post('/geocamCover/place/', new_place, function(data){
//                    alert("Data Loaded: "+data);
                });
                
                $('input#name').val("");
                return place;
            }
            );

            $.getJSON('/geocamCover/hello.json', function(data) {

                $.each(data.places, function(key, val) {
//        alert("latitude=" + val.latitude + ", longitude=" + val.longitude);
                    placeMarker(new google.maps.LatLng(val.latitude, val.longitude, true), val.name);

                })
            });
        });


function placeMarker(loc, name) {
    var marker = new google.maps.Marker({
                position: loc,
                map: map,
                title: name
            });

    $('div#forms').css("visibility", "hidden");

    return false;
}

// function addName(name) {
// 	alert(name);
// 	marker.title = name;
// 	alert(marker.title);
// }