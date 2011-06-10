function Task() {
    this.place = null;
    this.title = "";
    this.description = "";
    this.priority = 0;
}

function Report() {
    this.title = "";
    this.status = "";
    this.percent_completed = 0;
    this.notes = "";
    this.task = new Task();
}

function Place() {
    this.id = null;
    this.name = "";
    this.position = null;
    this.report = new Report();
    this.task = new Task();
}

var clicked_position;
var selected_place;

$(document).ready(function () {

    //MOFFETT FIELD COORDINATES
    var latlng = new google.maps.LatLng(37.41288, -122.052934);
    $('#map_canvas').gmap({
                'center': latlng,
                'mapTypeId': google.maps.MapTypeId.ROADMAP,
                'zoom': 12,
                'callback': function () {
                    $.getJSON('/geocamCover/places.json', function(data) {
                        $.each(data.places, function(key, val) {
                            $.each(val, function(key, val) {
                                if (key == "place") {
                                    latlng = new google.maps.LatLng(val.latitude, val.longitude);
                                    place = new Place();
                                    place.id = val.id;
                                    place.position = latlng;
                                    place.name = val.name;
                                    addMarker(place);
                                }
                            })
                        })
                    });
                }
            });

    //ADDING MARKERS WHEN THE USER CLICKS ON THE MAP
    $('#map_canvas').gmap({'callback':function(map) {
        $(map).click(function(event) {
            $('#place-form').show();
            $('#dim').show();
            clicked_position = event.latLng;
        });

    }});


    $("#place-form form").submit(function() {
        place = new Place();
        place.position = clicked_position;
        place.name = $('#place-form #name').val();
        addMarker(place);

        var new_place = JSON.stringify({"latitude": clicked_position.lat(),
                    "longitude": clicked_position.lng(), "name": place.name });
        $.post('/geocamCover/place/', new_place, function(data) {
            // nothing yet
        });

        $('#place-form .name').val("");
        $('#place-form').hide();
        $('#dim').hide();
        return false;
    });

    $("#new-task form").submit(function() {
        task = new Task();
        task.title = $('#new-task .title').val();
        task.description = $('#new-task .description').val();
        task.priority = $('#new-task .priority').val();
        task.place = selectedPlace


        var new_task = JSON.stringify({"place_id": task.place.id, "title": task.title,
                    "description": task.description, "priority": task.priority });
        $.post('/geocamCover/task/', new_task, function(data) {
            // nothing yet
        });

        $('#new-task .title').val("");
        $('#new-task .description').val("");
        $('#new-task .priority').val(3);
        $('#new-task').hide();
        $('#place-log').show();
        return false;
    });

    jQuery("title").html("GeoCam Cover");

});

function addMarker(place) {

    $("#map_canvas").gmap('addMarker', {
                'position': place.position,
                'title': place.name
            }).click(function() {
        showLog(place);
    });
}


function showLog(place) {
    $('#place-log .name').html(place.name);
    $('#place-log').show();
    $('#new-task').hide();
    $('#new-report').hide();
    selectedPlace = place;
}


function showNewTask() {
    $("#new-task .name").html(selectedPlace.name);
    $('#place-log').hide();
    $('#new-task').show();
}


function showNewReport() {
    $("#new-report .name").html(selectedPlace.name);
    $('#place-log').hide();
    $('#new-report').show();
}


function showMap() {
    $('#dim').hide();
    $('#place-form').hide();
    $('#place-log').hide();
    $('#new-task').hide();
    $('#new-report').hide();
    return false;
}