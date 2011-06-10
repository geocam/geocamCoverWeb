function Task() {
	this.id = null;
    this.place_id = null;
    this.title = "";
    this.description = "";
    this.priority = 0;
}

function Report() {
	this.id = null;
	this.place_id = null;
	this.task = null;
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
    this.reports = [];
    this.tasks = [];
}

var places = [];
var clicked_position;
var selected_place;
var globalTempPlaceId = 666;

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
							var place = new Place();
							latlng = new google.maps.LatLng(val.place.latitude, val.place.longitude);
							place.id = val.place.id;
							place.position = latlng;
							place.name = val.place.name;
							addMarker(place);
							
							for (var t in val.tasks){
								t = val.tasks[t];
								var task = new Task();
								task.id = t.id;
								task.place = place;
								task.priority = t.priority;
								task.title = t.title;
								task.description = t.description;
								place.tasks.push(task);
							}
							
							for (var r in val.reports){
								r = val.reports[r];
								var report = new Report();
								report.id = r.id;
								report.place = place;
								report.percent_completed = r.percent_completed;
								report.title = r.title;
								report.notes = r.notes;
								report.status = r.status;
								place.reports.push(report);
							}
							places[place.id] = place;
                        });
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
        place.name = $('#place-form .name').val();
        addMarker(place);

        var new_place = JSON.stringify({"latitude": clicked_position.lat(),
                    "longitude": clicked_position.lng(), "name": place.name });
        $.post('/geocamCover/place/', new_place, function(data) {
            // nothing yet
			// need to get ID as ACK from server using JSON-RPC
        });
		// USING A TEMP ID FOR NOW
		place.id = ++globalTempPlaceId;
		places[globalTempPlaceId] = place;

        $('#place-form .name').val("");
        showLog(place.id);
        return false;
    });

    $("#new-task form").submit(function() {
        task = new Task();
        task.title = $('#new-task .title').val();
        task.description = $('#new-task .description').val();
        task.priority = $('#new-task .priority').val();
        task.place_id = selectedPlace.id;
		places[task.place_id].tasks.push(task);

        var new_task = JSON.stringify({"place_id": task.place_id, "title": task.title,
                    "description": task.description, "priority": task.priority });
        $.post('/geocamCover/task/', new_task, function(data) {
            // nothing yet
        });

        $('#new-task .title').val("");
        $('#new-task .description').val("");
        $('#new-task .priority').val(3);
        showLog(task.place_id);
        return false;
    });
	
	  $("#new-report form").submit(function() {
        report = new Report();
        report.title = $('#new-report .title').val();
		report.status = $('#new-report .status').val();
		report.percent_completed = $('#new-report .percent_completed').val();
		report.notes = $('#new-report .notes').val();
        report.place_id = selectedPlace.id;
		places[report.place_id].reports.push(report);
		
        var new_report = JSON.stringify({"place_id": report.place_id, "title": report.title,
                    "status": report.status, "percent_completed": report.percent_completed,
					"notes": report.notes});
        $.post('/geocamCover/report/', new_report, function(data) {
            // nothing yet
        });

        $('#new-report .title').val("");
        $('#new-report .notes').val("");
        $('#new-report .status').val("");
        $('#new-report .percent_completed').val(0);
        showLog(report.place_id);
        return false;
    });

    jQuery("title").html("GeoCam Cover");

});

function addMarker(place) {

    $("#map_canvas").gmap('addMarker', {
                'position': place.position,
                'title': place.name
            }).click(function() {
        showLog(place.id);
    });
}


function showLog(place_id) {
	place = places[place_id];
    $('#place-log .name').html(place.name);
    $('#place-log').show();
    $('#new-task').hide();
    $('#new-report').hide();
    selectedPlace = place;

	$('#logs').empty();
	for(var task in place.tasks){
		task = place.tasks[task];
		$('#logs').append("<li><a href='#'>" + task.title + "</a></li>");
	}
	
	for(var report in place.reports){
		report = place.reports[report];
		$('#logs').append("<li><a href='#'>" + report.title + "</a></li>");
	}
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