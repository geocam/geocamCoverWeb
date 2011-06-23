function LogItem() {
    this.modified_at = null;
    this.id = null;
    this.place_id = null;
    this.title = "";
}

function Task() {
    this.description = "";
    this.priority = 0;
	this.completed = false;
}
Task.prototype = new LogItem();


function Report() {
    this.task = null;
    this.status = "";
    this.percentCompleted = 0;
    this.notes = "";
    this.task_id = null;
}
Report.prototype = new LogItem();


function Place() {
    this.id = null;
    this.name = "";
    this.position = null;
    this.reports = [];
    this.tasks = [];
    this.marker = null;
}

var places = [];
var clicked_position;
var selectedPlace;
var reportId;
var taskId;
var selectedView;

var views = ["Task View", "Report View"];

requestView 	= 0;
reportView 		= 1;

$(window).resize(function() {
    pageResize();
});

$(document).ready(function () {

	selectedView = requestView;

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

                    for (var t in val.tasks) {
                        t = val.tasks[t];
                        var task = new Task();
                        task.id = t.id;
                        task.place = place;
                        task.priority = t.priority;
                        task.title = t.title;
                        task.description = t.description;
                        task.modified_at = new Date(t.modified_at);
												task.modified_at_str = t.modified_at;
                        place.tasks[task.id] = task;
                    }

                    for (var r in val.reports) {
                        r = val.reports[r];
                        var report = new Report();
                        report.id = r.id;
                        report.place = place;
                        report.percentCompleted = r.percent_completed;
                        report.title = r.title;
                        report.notes = r.notes;
                        report.status = r.status;
                        report.modified_at = new Date(r.modified_at);
												report.modified_at_str = r.modified_at
						report.task_id = r.task_id;
						if (report.task_id && report.percentCompleted == 100)
							place.tasks[report.task_id].completed = true;
                        place.reports[report.id] = report;
                    }
                    places[place.id] = place;
                    addMarker(place);
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
        if (e.target.id == "edit-place-page-form") {
            place = selectedPlace;
        } else if (e.target.id == "place-form-form") {
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
        task.id = taskId;
        task.title = $('#tasks-page .title').val();
        task.description = $('#tasks-page .description').val();
        task.priority = $('#tasks-page .star:checked').val() || 0;
		task.place_id = selectedPlace.id;


        var new_task = JSON.stringify({"task_id":task.id,"place_id": task.place_id, "title": task.title,
            "description": task.description, "priority": task.priority });
        $.post('/geocamCover/task/', new_task, function(data) {

            var temp_array = data.split(",");

            task.id = temp_array[0];
            task.modified_at = new Date(temp_array[1]);
						task.modified_at_str = temp_array[1];
            places[task.place_id].tasks[task.id] = task;
			places[task.place_id].marker.setVisible(false);
			addMarker(places[task.place_id]);
            showLog(task.place_id);

        });

        return false;
    });

    $("#reports-page form").submit(function() {

        report = new Report();
        report.id = reportId;
        report.title = $('#reports-page .title').val();
        report.status = $('#reports-page .status').val();
		report.task_id = $('#reports-page .task').val(); 

        var percent_completed = $('#reports-page .percent-completed').val()

        if (percent_completed == "")
            percent_completed = 0;

        report.percentCompleted = percent_completed;

        report.notes = $('#reports-page .notes').val();
        report.place_id = selectedPlace.id;

        var new_report = JSON.stringify({"report_id": report.id, "place_id": report.place_id, "title": report.title,
            "status": report.status, "percent_completed": report.percentCompleted,
            "notes": report.notes, "task_id": report.task_id});
        $.post('/geocamCover/report/', new_report, function(data) {
            var temp_array = data.split(",");
            report.id = temp_array[0];
            report.modified_at = new Date(temp_array[1]);
						report.modified_at_str = temp_array[1];
            places[report.place_id].reports[report.id] = report;
			places[report.place_id].marker.setVisible(false);
			addMarker(places[report.place_id]);
            showLog(report.place_id);
        });

        return false;


    });


    jQuery("title").html("GeoCam Cover");

});


function deletePlace() {
	var c = confirm("Delete place '" + selectedPlace.name + "'?");
	if (!c)
		return false;
  var delete_request = JSON.stringify({"type": "Place", "id": selectedPlace.id});
  $.ajax({url: '/geocamCover/delete_item/', 
	data: delete_request, 
	type: "DELETE",
	success: function(data) {
		selectedPlace.marker.setVisible(false);
		delete places[selectedPlace.id];
		showMap();
	}
  });
}


function deleteTask() {
	var c = confirm("Delete task '" + selectedPlace.tasks[taskId].title + "'?");
	if (!c)
		return false;
  var delete_request = JSON.stringify({"type": "Task", "id": taskId});
  $.ajax({url: '/geocamCover/delete_item/', 
	data: delete_request, 
	type: "DELETE",
	success: function(data) {
		delete places[selectedPlace.id].tasks[taskId];
		showLog(selectedPlace.id);
	}
  });
}

function deleteReport() {
	var c = confirm("Delete report '" + selectedPlace.reports[reportId].title + "'?");
	if (!c)
		return false;
  var delete_request = JSON.stringify({"type": "Report", "id": reportId});
  $.ajax({url: '/geocamCover/delete_item/', 
	data: delete_request, 
	type: "DELETE",
	success: function(data) {
		delete places[selectedPlace.id].reports[reportId];
		showLog(selectedPlace.id);
	}
  });
}

function placeIcon(place){
	var icon;
	
	switch (selectedView)
	{
	case requestView:
		var priorityToDisplay = 0;
		for (var t_id in place.tasks){
			if (!place.tasks[t_id].completed && place.tasks[t_id].priority > priorityToDisplay)
				priorityToDisplay = place.tasks[t_id].priority;
		}
		
		if (priorityToDisplay == 0)
			icon = "whiteBox";
		else
			icon = "priority" + priorityToDisplay;
		break;
		
	case reportView:
		var reportToDisplay = null;
		var mostRecent = new Date();
		mostRecent.setYear(1900);
		for (var r_id in place.reports){
			if (place.reports[r_id].modified_at > mostRecent){
				mostRecent = place.reports[r_id].modified_at;
				reportToDisplay = place.reports[r_id];
			}
		}
		
		if (reportToDisplay){
			switch(parseInt(reportToDisplay.status))
			{
			case 0:
			case 1:
				icon = "statusRed";
				break;
			case 2:
			case 3:
			case 4:
				icon = "statusYellow";
				break;
			case 5:
			case 6:
				icon = "statusGreen";
				break;
			default:
				icon = "whiteBox";
			}
		} else {
			icon = "whiteBox";
		}
		break;
	}
	
	return icon;
}


function addMarker(place) {

    var place_marker;
    $("#map_canvas").gmap('addMarker', {
                'position': place.position,
                'title': place.name,
				'icon': "/static/geocamCover/" + placeIcon(place) + ".png"
            }, function(map, marker) {
                place_marker = marker;
            });
    $(place_marker).click(function() {
        showLog(place.id);
    });
    places[place.id].marker = place_marker;
}

function showLog(place_id, blah) {
    place = places[place_id];

    $('#logs-page h1').html(place.name.length == 0 ? 'Unnamed Place' : place.name);
    $('#logs-page a, #logs-page li').removeClass("ui-btn-active");
    selectedPlace = place;

    var noTasksAndReports = true;

    $('#logs').empty();

    var logList = new Array();

		for (var t in place.tasks) {
			logList.push(place.tasks[t])
		}
		
		for (var r in place.reports) {
			logList.push(place.reports[r])
		}

    logList.sort(function(a, b) {
        return b.modified_at - a.modified_at
    });

    for (var log_id in logList) {


        if (logList[log_id] instanceof Task) {
            task = logList[log_id];
            $('#logs').append("<li><a href='#' onclick='showEditTask(" + task.id + ");'> Task: " + task.title + " (" + task.modified_at_str + ")</a></li>");
        }
        else {
            report = logList[log_id];
            $('#logs').append("<li><a href='#' onclick='showEditReport(" + report.id + ");'> Report: " + report.title + " (" + report.modified_at_str + ")</a></li>");
        }

        noTasksAndReports = false;
    }

    if (noTasksAndReports) {
        $('#logs').append('<li>No tasks or reports for this place...</li>');
    }

    try {
        $('#logs').listview("refresh");
    } catch(e) {

    }

    document.location.href = "/geocamCover/#logs-page";


}

function showEditPlace() {
    $('#edit-place-page a').removeClass("ui-btn-active");
    $("#edit-place-page h1 .name").html(selectedPlace.name.length == 0 ? "Unnamed Place" : selectedPlace.name);
    $("#edit-place-page form .name").val(selectedPlace.name);

    document.location.href = "/geocamCover/#edit-place-page";
}


function showNewTask() {
    taskId = null;

    $('#tasks-page a, #tasks-page li').removeClass("ui-btn-active");
    $("#tasks-page h1").html("Add Tasks to " + (selectedPlace.name.length == 0 ? "Unnamed Place" : selectedPlace.name));

    //Initializing the form elements
    $("#tasks-page .title").val("");
	$('input').rating('drain');
    $("#tasks-page .description").val("");
    $("#tasks-page .submit-button").val("Submit Task");
	$("#tasks-page .delete-button").hide();
	
    document.location.href = "/geocamCover/#tasks-page";
}


function showNewReport() {
    reportId = null;

    $('#reports-page a, #reports-page li').removeClass("ui-btn-active");
    $("#reports-page h1").html("Add Report to " + (selectedPlace.name.length == 0 ? "Unnamed Place" : selectedPlace.name));

    //Initializing form elements
    $("#reports-page .title").val("");
    $("#reports-page .percent-completed").val(0);
    $("#reports-page .notes").val("");
    $("#reports-page .submit-button").val("Submit Report");
	$("#reports-page .delete-button").hide();
	populateTasksForReport(null);
    $("#reports-page .status").val("");
	$("#reports-page .select-status .ui-btn-text").html("Not Selected");

    document.location.href = "/geocamCover/#reports-page";

}


function showEditTask(task_id) {
    var task = selectedPlace.tasks[task_id];
    taskId = task.id;

    $('#tasks-page a, #tasks-page li').removeClass("ui-btn-active");
    $("#tasks-page h1").html("Edit " + task.title);

    //Setting form elements
    $("#tasks-page .title").val(task.title);
	if (task.priority > 0)
		$('input').rating('select', task.priority - 1)
	else 
		$('input').rating('drain');
    $("#tasks-page .description").val(task.description);
    $("#tasks-page .submit-button").val("Update Task");
	$("#tasks-page .delete-button").show();

    document.location.href = "/geocamCover/#tasks-page";

}


function showEditReport(report_id) {
    var report = selectedPlace.reports[report_id];
    reportId = report.id;

    $('#reports-page a, #reports-page li').removeClass("ui-btn-active");
    $("#reports-page h1").html("Edit " + report.title);

    //Setting form elements
    $("#reports-page .title").val(report.title);
    $("#reports-page .status").val(report.status);
	$("#reports-page .select-status .ui-btn-text").html($("#reports-page .status option:selected").text());
    $("#reports-page .percent-completed").val(report.percentCompleted);
    $("#reports-page .notes").val(report.notes);
    $("#reports-page .submit-button").val("Update Report");
	populateTasksForReport(report.task_id);
	$("#reports-page .delete-button").show();
	

    document.location.href = "/geocamCover/#reports-page";
}

function populateTasksForReport(selectedId){
	$("#reports-page .task").empty();
	var selected = selectedId == null ? " selected " : "";
	var spanText = "Is this related to a task?";
	$("#reports-page .task").append("<option value" + selected + ">" + spanText + "</option>");
	
	for (var task_id in selectedPlace.tasks){
		if (task_id == selectedId){
			selected =  " selected"
			spanText = "Task: " + selectedPlace.tasks[task_id].title;
		} else {
			selected =  ""
		}
		$("#reports-page .task").append("<option value=" + task_id + selected + ">Task: " + selectedPlace.tasks[task_id].title + "</option>");
	}
	$("#reports-page .select-task .ui-btn-text").html(spanText);
}


function switchViews(){
	
	switch (selectedView)
	{
	case (requestView):
		selectedView = reportView;
		break;
	case (reportView):
		selectedView = requestView;
		break;
	}
	
	for (var p_id in places){
		places[p_id].marker.setVisible(false);
		addMarker(places[p_id]);
	}
	jQuery("#switch-view-button .ui-btn-text").html(views[selectedView]);
	jQuery(".ui-btn-active").removeClass(".ui-btn-active");
	return false;
}


function showMap() {
    document.location.href = "/geocamCover/#map-page";
    pageResize();
}


function pageResize() {
    $('#map_canvas, #place-form, #dim').height($(window).height() - 43);
}

function hidePlaceForm() {
    $('#dim').hide();
    $('#place-form').hide();
}