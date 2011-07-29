/* Place Class
 * 
 * Places consists of an array of reports and an array of tasks.
 */
function Place() {
    this.id = null;
    this.name = "";
    this.position = null;
    this.reports = [];
    this.tasks = [];
    this.marker = null;
    this.category = null;
}

/* Log Item Class
 * 
 * The Log Item class is a superclass of Tasks and Reports. They each
 * share the members in this class.
 */
function LogItem() {
    this.modified_at = null;
    this.id = null;
    this.place_id = null;
    this.title = "";
}

/* Task Class
 * 
 * Inherits from the Log Item Class. 
 */
function Task() {
    this.description = "";
    this.priority = 0;
    this.completed = false;
}
Task.prototype = new LogItem();

/* Report Class
 * 
 * Inherits from the Log Item Class. Reports can belong to a task.
 */
function Report() {
    this.task = null;
    this.status = "";
    this.percentCompleted = 0;
    this.notes = "";
    this.task_id = null;
}
Report.prototype = new LogItem();

/* Global Variables */
var menuOpen = false;
var places = [];
var clickedPosition;
var selectedPlace;
var reportId;
var taskId;
var selectedView;
var myMarker;
var markerCluster;
var globalMap;
var gpsDenied = false;
var zoom = false;
var views = ["Task View", "Report View"];
var requestView = 0;
var reportView = 1;
var isTapHold = false;
var isiPad = false;
var tapHoldTimeout;
var backIsMap = false;
var defaultZoom = 15;

/* This function is called every time the page size changes */
$(window).resize(function() {
    pageResize();
});

/* Function: endZoom()
 * Arguments: N/A
 *
 * Description: This function is called via a setTimeout. When
 * the map is being zoomed we don't want to display the create
 * place form - so the zoom and tapHold booleans are set/unset
 * to prevent this.
 */ 
function endZoom() {
    zoom = false;
    isTapHold = false;
}

/* This is called when the document has been rendered */
$(document).ready(function () {

    isiPad = navigator.userAgent.match(/iPad/i) != null; // Is the user using an iPad?

    jQuery("title").html("GeoCam Cover");
    selectedView = requestView;
    populateCategories();

    //INITIAL COORDINATES - MOFFETT FIELD
    var latlng = new google.maps.LatLng(37.41288, -122.052934);

	/* This block loads a JSON file from the server and populates the map
	 * with the places form the database. Each task and report is put into
	 * its place's task and report array, respectively.
	 */
    $('#map_canvas').gmap({
        'center': latlng,
        'mapTypeId': google.maps.MapTypeId.ROADMAP,
        'zoom': defaultZoom,
        'callback': function (map) {
            globalMap = map;
            $.getJSON('/geocamCover/places.json', function(data) {
			
				// Initialize the marker cluster
                markerCluster = new MarkerClusterer($('#map_canvas').gmap('getMap'), $('#map_canvas').gmap('getMarkers'));

				// Loop through each place in the JSON file
                $.each(data.places, function(key, val) {
				
					// Create a place object
                    var place = new Place();
                    latlng = new google.maps.LatLng(val.place.latitude, val.place.longitude);
                    place.id = val.place.id;
                    place.position = latlng;
                    place.name = val.place.name;
                    place.category = val.place.category;

					// For each task in this place, create the task assign it to its place
                    for (var t in val.tasks) {
                        t = val.tasks[t];
                        var task = new Task();
                        task.id = t.id;
                        task.place = place;
                        task.priority = t.priority;
                        task.description = t.description;
                        task.modified_at = new Date(t.modified_at);
                        task.modified_at_str = t.modified_at;
                        place.tasks[task.id] = task;
                    }

					// For each report in this place, create the report and assign it to its place and task
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
                        report.modified_at_str = r.modified_at;
                        report.task_id = r.task_id;
                        if (report.task_id && report.percentCompleted == 100)
                            place.tasks[report.task_id].completed = true;

                        place.reports[report.id] = report;
                    }
					
                    places[place.id] = place;  // Put the place in the global place array
                    addMarker(place); // Add the place marker to the map
                });
            });
			setTimeout("initiateGeolocation()", 1000); // Grab the user's geoLocation
			setInterval("refreshGps()", 5000); // Refresh to get the current geoLocation every 5 seconds
        }
    });
	
	
    pageResize(); // Initialize the page size

	// This is to go back to the map when the back button is pressed.
	window.onpopstate = function(event) {
		backIsMap = false;
		showMap();
	}

	// If the user clicks for longer than a half second (tapHold), show the create place page
    $('#map_canvas').gmap({'callback':function(map) {
        $(map).click(function(event) {
            if (isTapHold) {
                isTapHold = false;
                clickedPosition = event.latLng;
                showPage('#place-form');
            }
        });
    }});

	// Identify if the user is performing a tapHold
	$('#map_canvas').mousedown(function(){
		var f = function(){
			isTapHold = true;
		};
		tapHoldTimeout = setTimeout(f, 500);
	});
	
	// The taphold is over
	$('#map_canvas').mouseup(function(){
		clearTimeout(tapHoldTimeout);
	});

	// We are zooming and we dont want to display the add place page
    google.maps.event.addListener(globalMap, 'zoom_changed', function() {
        zoom = true;
        isTapHold = false;
        setTimeout("endZoom()", 1000);
    });

	// We are dragging and we dont want to display the add place page
    google.maps.event.addListener(globalMap, 'drag', function() {
        zoom = true;
        isTapHold = false;
    });

	// We are done dragging and we dont want to display the add place page
    google.maps.event.addListener(globalMap, 'dragend', function() {
        setTimeout("endZoom()", 1000);
    });

	/* The following are event listeners for forms being submitted. Each
	 * form has its open submit functon that is called.
	 */
    $("#address-form-form").submit(function(e) {
        searchPlace();
        return false;
    });

    $("#place-form-form").submit(function() {
        createPlace();
        return false;
    });

    $("#edit-place-page-form").submit(function() {
        updatePlace();
        return false;
    });

    $("#tasks-page form").submit(function() {
        createTask();
        return false;
    });

    $("#reports-page form").submit(function() {
        createReport();
        return false;
    });
	
	$(document).click(function(e){
		closeMenu(e);
	});
});

function searchPlace() {
    $('#map_canvas').gmap('search', { 'address': $('#address-name').val() }, function(isFound, results) {
                if (isFound) {
										
										$('#address-name').val("");
										$('#map_canvas').gmap('getMap').panTo(results[0].geometry.location);
										$('#map_canvas').gmap('getMap').setZoom(defaultZoom);
                    // var place = new Place();
                    // place.position = results[0].geometry.location;
                    // savePlace(place, 'address');
										$("#map_canvas").gmap('addMarker', {
								                'position': results[0].geometry.location,
								                'title': $('#address-name').val()
										}, function(map, marker) {
								    		myMarker = marker;
										});

										$(myMarker).click(function() {
												// WTF? Why is $(this) an array?
								        clickedPosition = $(this)[0].position;
								        showPage('#place-form');
								    });
										
										showMap();
                } else {
                    alert("Location Not Found."); //Need another way to display to the user that the address wasn't found
                }
            });
}

function createPlace(form) {
    var place = new Place();
    place.position = clickedPosition;
    savePlace(place, 'place');
}

function updatePlace() {
    markerCluster.removeMarker(selectedPlace.marker);
    savePlace(selectedPlace, 'edit-place');
}

function savePlace(place, which) {
    place.category = $('#' + which + '-categories-select').val();
    place.name = $('#' + which + '-name').val();
    addPlace(place);
    $('#' + which + '-name').val("");
    $('#' + which + '-categories-select').val("0");
    $('#' + which + '-categories-select').parent().find('.ui-btn-text').html("Select Category");

}

function addPlace(place) {
    var new_place = JSON.stringify({"place_id": place.id, "latitude": place.position.lat(),
        "longitude": place.position.lng(), "name": place.name, "category": place.category });
    $.post('/geocamCover/place/', new_place, function(data) {
        place.id = data;
        places[place.id] = place;
        addMarker(place);
        showLog(place.id);
        pageResize();
    });
}

function createTask() {
    task = new Task();
    task.id = taskId;
    task.description = $('#tasks-page .description').val();
    task.priority = $('#tasks-page .priority').val();
    task.place_id = selectedPlace.id;

    var newTask = JSON.stringify({"task_id":task.id,"place_id": task.place_id,
        "description": task.description, "priority": task.priority });

    $.post('/geocamCover/task/', newTask, function(data) {
        createLogItemCallback("task", data);
    });
}

/* Function: createReport()
 * Arguments: N/A
 *
 * Description: Called when a user submits a new report or updates
 * an existing report. Overwrites the old report if an update is being made.
 */ 
function createReport() {
    report = new Report();
    report.id = reportId;
    report.title = $('#reports-page .title').val();
    report.status = $('#reports-page .status').val();
    report.task_id = $('#reports-page .task').val();
    var percentCompleted = $('#reports-page .percent-completed').val();
    report.percentCompleted = percentCompleted == "" ? 0 : percentCompleted;
    report.notes = $('#reports-page .notes').val();
    report.place_id = selectedPlace.id;

    var newReport = JSON.stringify({"report_id": report.id, "place_id": report.place_id, "title": report.title,
        "status": report.status, "percent_completed": report.percentCompleted,
        "notes": report.notes, "task_id": report.task_id});

    $.post('/geocamCover/report/', newReport, function(data) {
        createLogItemCallback("report", data);
    });
}

/* Function: createLogItemCallback()
 * Arguments: which - "task" or "report"
 *            data - The JSON callback data  
 *
 * Description: Called after a report or a task is submitted. Updates
				the logs page and the marker for the log item's place.
 */ 
function createLogItemCallback(which, data) {
    eval("var logItem = " + which + ";");
    var temp_array = data.split(",");
    logItem.id = temp_array[0];
    logItem.modified_at = new Date(temp_array[1]);
    logItem.modified_at_str = temp_array[1];
    eval("places[logItem.place_id]." + which + "s[logItem.id] = logItem;");
    places[logItem.place_id].marker.setVisible(false);
    markerCluster.removeMarker(places[logItem.place_id].marker);
    addMarker(places[logItem.place_id]);
    showLog(logItem.place_id);
}

/* Function: populateCategories()
 * Arguments:  
 *
 * Description: Grabs the categories from a JSON request and 
 * populates the select menu for adding a place.
 */ 
function populateCategories() {
    $.getJSON('/geocamCover/categories.json', function(data) {
        $.each(data, function(key, val) {
            $('.categories').append('<option value="' + key + '">' + val + '</option>');
        });
    });
}


function deletePlace() {
    if (confirm("Delete place '" + selectedPlace.name + "'?"))
        deleteItemAjax("Place", JSON.stringify({"type": "Place", "id": selectedPlace.id}));
}

function deleteTask() {
    if (confirm("Delete task '" + selectedPlace.tasks[taskId].title + "'?"))
        deleteItemAjax("Task", JSON.stringify({"type": "Task", "id": taskId}));
}

function deleteReport() {
    if (confirm("Delete report '" + selectedPlace.reports[reportId].title + "'?"))
        deleteItemAjax("Report", JSON.stringify({"type": "Report", "id": reportId}));
}

function deleteItemAjax(itemType, data) {
    $.ajax({url: '/geocamCover/delete_item/',
        data: data,
        type: "DELETE",
        success: function(data) {
            eval("delete" + itemType + "Success();");
        }
    });
}

function deletePlaceSuccess() {
    markerCluster.removeMarker(selectedPlace.marker);
    delete places[selectedPlace.id];
    showMap();
}

function deleteReportSuccess() {
    delete places[selectedPlace.id].reports[reportId];
    showLog(selectedPlace.id);
}

function deleteTaskSuccess() {
    delete places[selectedPlace.id].tasks[taskId];
    showLog(selectedPlace.id);
}

/* Function: placeIcon()
 * Arguments:  place - A place object
 *
 * Description: Determines which icon to draw for a place.
 *				Loops through all reports or tasks depending
 *   			on which view is enabled. Renders the highest
 *  			priority task icon or the most significant
 *  			report status icon.
 */ 
function placeIcon(place) {
    var icon;
    if (selectedView == requestView) {
        var priorityToDisplay = 0;
        for (var t_id in place.tasks) {
            if (!place.tasks[t_id].completed && place.tasks[t_id].priority > priorityToDisplay)
                priorityToDisplay = place.tasks[t_id].priority;
        }
        if (priorityToDisplay == 0)
            icon = "whiteBox";
        else
            icon = "priority" + priorityToDisplay;
    } else if (selectedView == reportView) {
        var reportToDisplay = null;
        var mostRecent = new Date();
        mostRecent.setYear(1900);
        for (var r_id in place.reports) {
            if (place.reports[r_id].modified_at > mostRecent) {
                mostRecent = place.reports[r_id].modified_at;
                reportToDisplay = place.reports[r_id];
            }
        }
        if (reportToDisplay) {
            switch (parseInt(reportToDisplay.status)) {
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
    }
    return icon;
}

/* Function: addMarker()
 * Arguments:  place - A place object
 *
 * Description: Adds the marker to the map for a place and
 *				assigns it an onClick listener. Updates the 
				marker cluster with the marker.
 */
function addMarker(place) {
    $("#map_canvas").gmap('addMarker', {
                'position': place.position,
                'title': place.name,
                'icon': "/static/images/" + placeIcon(place) + ".png"
            }, function(map, marker) {
                place_marker = marker;
            });
    $(place_marker).click(function() {
        showLog(place.id);
    });
    places[place.id].marker = place_marker;
    markerCluster.addMarker(place_marker);
}

/* Function: showLog()
 * Arguments:  place_id - ID of a place
 *
 * Description: Grabs a place object from the place array.
 *				Renders the log view with the tasks and reports
 *				that the place has.
 */
function showLog(place_id) {
    place = places[place_id];
    selectedPlace = place;
    var noTasksAndReports = true;
    var logList = new Array();
    $('#place-name-h1').html(place.name.length == 0 ? 'Unnamed Place' : place.name);
    $('#logs').empty();

    for (var t in place.tasks)
        logList.push(place.tasks[t]);

    for (var r in place.reports)
        logList.push(place.reports[r]);

    logList.sort(function(a, b) {
        return b.modified_at - a.modified_at
    });

    for (var log_id in logList) {
        if (logList[log_id] instanceof Task) {
            task = logList[log_id];
            $('#logs').append("<li onclick='showEditTask(" + task.id + ");'> Task: " + task.description + " (" + task.modified_at_str + ")</li>");
        } else {
            report = logList[log_id];
            $('#logs').append("<li onclick='showEditReport(" + report.id + ");'> Report: " + report.title + " (" + report.modified_at_str + ")</li>");
        }
        noTasksAndReports = false;
    }

    if (noTasksAndReports)
        $('#logs').append('<li>No tasks or reports</li>');

    try {
        $('#logs').listview("refresh");
    } catch(e) {
    }
    showPage("#logs-page");
}

function showPage(page) {
	// Add GeoCam to History IF not already in history.
	if (!backIsMap && page != "#map-page") {
		backIsMap = true;
		history.pushState(null, "Map", document.location.origin);
	} 
  $(".mobile-page").hide();
  $(page).show();
}

function showMap() {
	  // Remove GeoCam from History
		if (backIsMap) {
			backIsMap = false;
			// HACKY AS HELL. LOLOLOLOLOLOLOLOL.
			history.go(-1);
		}
		// Push history.
    showPage("#map-page");
    pageResize();
}

function showEditPlace() {
    $("#edit-place-page h1 .name").html(selectedPlace.name.length == 0 ? "Unnamed Place" : selectedPlace.name);
    $("#edit-place-name").val(selectedPlace.name);
    $("#edit-place-categories-select").val(selectedPlace.category);
    showPage("#edit-place-page");
}

function showNewTask() {
    taskId = null;
    $("#tasks-page .description").val("");
    $("#tasks-page .priority").val(3);
    showNewLogItem('task');
}

function showNewReport() {
    reportId = null;
    $("#reports-page .title").val("");
    $("#reports-page .percent-completed").val(0);
    $("#reports-page .notes").val("");
    populateTasksForReport(null);
    $("#reports-page .status").val(4);
    showNewLogItem('report');
}

function showNewLogItem(which) {
    $('#' + which + '-name-h1').html('New ' + which + ' for ' + (selectedPlace.name.length == 0 ? "Unnamed Place" : selectedPlace.name));
    $('#' + which + 's-page .submit-button').val("Submit " + which);
    $('#' + which + 's-page .delete-button').hide();
    showPage("#" + which + "s-page");
}

function showEditTask(task_id) {
    var task = selectedPlace.tasks[task_id];
    taskId = task.id;
    $("#tasks-page .priority").val(task.priority);
    $("#tasks-page .description").val(task.description);
    showEditLogItem('task');
}

function showEditReport(report_id) {
    var report = selectedPlace.reports[report_id];
    reportId = report.id;
    $("#reports-page .title").val(report.title);
    $("#reports-page .status").val(report.status);
    $("#reports-page .percent-completed").val(report.percentCompleted);
    $("#reports-page .notes").val(report.notes);
    populateTasksForReport(report.task_id);
    showEditLogItem('report');
}

function showEditLogItem(which) {
    $('#' + which + '-name-h1').html("Edit " + which);
    $('#' + which + 's-page .submit-button').val('Update ' + which);
    $('#' + which + 's-page .delete-button').show();
    showPage('#' + which + 's-page');
}

/* Function: populateTasksForReport()
 * Arguments:  selectedId - The ID of a selected task
 *
 * Description: Marks a task as being selected in a report's "Report on Task"
 *				select menu. If no task is selected, the default text is assigned
 *        		to be selected.
 */
function populateTasksForReport(selectedId) {
    $("#reports-page .task").empty();
    var selected = selectedId == null ? " selected" : "";
    var spanText = "Report on a task";
    $("#reports-page .task").append("<option value" + selected + ">" + spanText + "</option>");

    for (var task_id in selectedPlace.tasks) {
        if (task_id == selectedId) {
            selected = " selected";
            spanText = selectedPlace.tasks[task_id].description;
        } else {
            selected = "";
        }
        $("#reports-page .task").append('<option value="' + task_id + '"' + selected + '>' + selectedPlace.tasks[task_id].description + '</option>');
    }
}

/* Function: switchViews()
 * Arguments:  
 *
 * Description: Toggles between report view and task view. Redraws
 *				the icons accordingly.
 */
function switchViews() {
    $("#switch-view-button").html(views[selectedView]);
    switch (selectedView) {
        case (requestView):
            selectedView = reportView;
            break;
        case (reportView):
            selectedView = requestView;
            break;
    }
    for (var p_id in places) {
        places[p_id].marker.setVisible(false);
        markerCluster.removeMarker(places[p_id].marker);
        addMarker(places[p_id]);
    }
    return false;
}

function pageResize() {
    var page_height = $(window).height() - $("#map-header").height() - $("#footer").height() - 4;
    if (isiPad)
    {
        page_height -= 78;
        $('body,html').height(page_height);

    }

	$("#menu").css("right",  $(window).width()  - (22 + $("#menu-button").position().left + $("#menu-button").width())  );
    $('#map_canvas, #dim').height(page_height);
}

function initiateGeolocation() {
    navigator.geolocation.getCurrentPosition(handleGeolocationQuery, handleErrors);
}

function handleErrors(error) {
    gpsDenied = true;
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("user did not share geolocation data");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("could not detect current position");
            break;
        case error.TIMEOUT:
            alert("retrieving position timed out");
            break;
        default:
            alert("unknown error");
            break;
    }
}

/* Function: handleGeolocationQuery()
 * Arguments:  position - Coordinates
 *
 * Description: If a user grants permission to access their geoLocation, this
 *				function is called. Creates/re-creates a marker for a user's location.
 *				Centers the map on the user's location the first time it is called.
 */
function handleGeolocationQuery(position) {

    var myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
  
	if (myMarker) {
		myMarker.setPosition(myLocation);
    } else {
	  $("#map_canvas").gmap('addMarker', {
                'position': myLocation,
                'title': "You are here",
                'icon': "/static/images/youAreHere.png",
				'zIndex' : 1000
            }, function(map, marker) {
                myMarker = marker;
		});
		
		$(myMarker).click(function() {
        clickedPosition = myLocation;
        showPage('#place-form');
    });

		$('#map_canvas').gmap({
            'center': myLocation
        });
	}
}

function loadFusionData(id) {
	if (!id) {
		id = 1003379;
	}
	$('#map_canvas').gmap('loadFusion', id);
	showMap();
}

/* Function: refreshGps()
 * Arguments: 
 *
 * Description: This is called every 5 seconds to update the current
 *				user's location on the map.
 */
function refreshGps() {
    if (gpsDenied)
        return;
    initiateGeolocation();
}

function showMenu(){
	if (menuOpen)
		return closeMenu();
	menuOpen = true;
	$("#menu-button").addClass("menu-button");
	$(".open-menu").show();
	$(".closed-menu").hide();
	$("#menu").css("bottom", $(window).height() - $("#footer").position().top - 1);
	$("#menu").css("right",  $(window).width()  - (22 + $("#menu-button").position().left + $("#menu-button").width())  );
}

function closeMenu(e){
	if (!menuOpen || (e && e.target.id == "menu-button"))
		return;
	menuOpen = false;
	$("#menu-button").removeClass("menu-button");
	$(".open-menu").hide();
	$(".closed-menu").show();
}