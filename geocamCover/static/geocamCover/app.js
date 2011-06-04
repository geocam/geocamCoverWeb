$(document).ready(function () {

    //MOFFETT FIELD COORDINATES
    var latlng = new google.maps.LatLng(37.41288, -122.052934);
    $('#map_canvas').gmap({
                'center': latlng,
                'mapTypeId': google.maps.MapTypeId.ROADMAP,
                'zoom': 12,
                'callback': function () {
                    $.getJSON('/geocamCover/hello.json', function(data) {
                        $.each(data.places, function(key, val) {
                            latlng = new google.maps.LatLng(val.latitude, val.longitude);
                            $('#map_canvas').gmap('addMarker', {'position': latlng, 'title': val.name});
                        })
                    });


                }
            });

    //ADDING MARKERS WHEN THE USER CLICKS ON THE MAP
    $('#map_canvas').gmap({'callback':function(map) {
        $(map).click(function(event) {
            $('div#forms').css("visibility", "visible");
            $('input#name').focus();
            var clicked_position = event.latLng;

            $("#marker_form").submit(function() {

                $("#map_canvas").gmap('addMarker', {'position':clicked_position, 'title': $('input#name').val()});

                var new_place = JSON.stringify({"latitude": clicked_position.lat(),
                            "longitude": clicked_position.lng() ,
                            "name": $('input#name').val() });

                $.post('/geocamCover/place/', new_place, function(data) {
                });

                $('input#name').val("");
                $('div#forms').css("visibility", "hidden");
                return false;
            });
        })
    }});

});