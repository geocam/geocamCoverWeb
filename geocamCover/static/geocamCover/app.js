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
var selectedPlace;

$(window).resize(function() {
    pageResize();
});

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

                    for (var t in val.tasks) {
                        t = val.tasks[t];
                        var task = new Task();
                        task.id = t.id;
                        task.place = place;
                        task.priority = t.priority;
                        task.title = t.title;
                        task.description = t.description;
                        place.tasks.push(task);
                    }

                    for (var r in val.reports) {
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

    pageResize();

    //ADDING MARKERS WHEN THE USER CLICKS ON THE MAP
    $('#map_canvas').gmap({'callback':function(map) {
        $(map).click(function(event) {
            $('#place-form').show();
            $('#dim').show();
            clicked_position = event.latLng;
        });

    }});


    $("#place-form-form, #edit-place-page-form").submit(function(e) {
		var place;
		if (e.target.id == "edit-place-page-form"){
			place = selectedPlace;
		} else if (e.target.id == "place-form-form"){
			place = new Place();
			place.position = clicked_position;
		}
        place.name = $(this).find('.name').val();

        var new_place = JSON.stringify({"place_id": place.id, "latitude": place.position.lat(),
            "longitude": place.position.lng(), "name": place.name });
        $.post('/geocamCover/place/', new_place, function(data) {
            place.id = data;
            places[place.id] = place;
            addMarker(place);
            showLog(place.id);
        });

       $(this).find('.name').val("");

        hidePlaceForm();

        return false;
    });

    $("#tasks-page form").submit(function() {
        task = new Task();
        task.title = $('#tasks-page .title').val();
        task.description = $('#tasks-page .description').val();
        task.priority = $('#tasks-page .priority').val();
        task.place_id = selectedPlace.id;
        places[task.place_id].tasks.push(task);

        var new_task = JSON.stringify({"place_id": task.place_id, "title": task.title,
            "description": task.description, "priority": task.priority });
        $.post('/geocamCover/task/', new_task, function(data) {
            // nothing yet
        });

        $('#tasks-page .title').val("");
        $('#tasks-page .description').val("");
        $('#tasks-page .priority').val(3);
        showLog(task.place_id);
        return false;
    });

    $("#reports-page form").submit(function() {
        report = new Report();
        report.title = $('#reports-page .title').val();
        report.status = $('#reports-page .status').val();
        report.percent_completed = $('#reports-page .percent_completed').val();
        report.notes = $('#reports-page .notes').val();
        report.place_id = selectedPlace.id;
        places[report.place_id].reports.push(report);

        var new_report = JSON.stringify({"place_id": report.place_id, "title": report.title,
            "status": report.status, "percent_completed": report.percent_completed,
            "notes": report.notes});
        $.post('/geocamCover/report/', new_report, function(data) {
            // nothing yet
        });

        $('#reports-page .title').val("");
        $('#reports-page .notes').val("");
        $('#reports-page .status').val("");
        $('#reports-page .percent_completed').val(0);
        showLog(report.place_id);
        return false;
    });
	

    jQuery("title").html("GeoCam Cover");

});


function deletePlace(){
	var delete_request = JSON.stringify({"place_id": selectedPlace.id});
	$.post('/geocamCover/delete_place/', delete_request, function(data) {
		delete places[selectedPlace.id];
		showMap();
	});
}


function addMarker(place) {

    $("#map_canvas").gmap('addMarker', {
        'position': place.position,
        'title': place.name
    }).click(function() {
		showLog(place.id);
	});
	
}


function showLog(place_id) {
    document.location.href = "/geocamCover/#logs-page";
    place = places[place_id];


    $('#logs-page h1').html(place.name.length == 0 ? 'Unnamed Place' : place.name);
    $('#logs-page a').removeClass("ui-btn-active");
    selectedPlace = place;

    var noTasksAndReports = true;

    $('#logs').empty();
    for (var task in place.tasks) {
        task = place.tasks[task];
        $('#logs').append("<li><a href='#'>" + task.title + "</a></li>");
        noTasksAndReports = false;
    }

    for (var report in place.reports) {
        report = place.reports[report];
        $('#logs').append("<li><a href='#'>" + report.title + "</a></li>");
        noTasksAndReports = false;
    }

    if (noTasksAndReports) {
        $('#logs').append('<li>No tasks or reports for this place...</li>');
    }

    try {
        $('#logs').listview("refresh");
    } catch(e) {

    }


}


function showNewTask() {
    document.location.href = "/geocamCover/#tasks-page";
    $('#tasks-page a').removeClass("ui-btn-active");
    $("#tasks-page .name").html(selectedPlace.name.length == 0 ? "Unnamed Place" : selectedPlace.name);
}


function showNewReport() {
    document.location.href = "/geocamCover/#reports-page";
    $('#reports-page a').removeClass("ui-btn-active");
    $("#reports-page .name").html(selectedPlace.name.length == 0 ? "Unnamed Place" : selectedPlace.name);
}

function showEditPlace(){
    document.location.href = "/geocamCover/#edit-place-page";
    $('#edit-place-page a').removeClass("ui-btn-active");
    $("#edit-place-page h1 .name").html(selectedPlace.name.length == 0 ? "Unnamed Place" : selectedPlace.name);
    $("#edit-place-page form .name").val(selectedPlace.name);
}

function showMap() {
    document.location.href = "/geocamCover/#map-page";
}


function pageResize() {
    $('#map_canvas, #place-form, #dim').height($(window).height() - 43);
}

function hidePlaceForm() {
    $('#dim').hide();
    $('#place-form').hide();
}