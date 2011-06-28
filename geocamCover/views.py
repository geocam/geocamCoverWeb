# __BEGIN_LICENSE__
# Copyright (C) 2008-2010 United States Government as represented by
# the Administrator of the National Aeronautics and Space Administration.
# All Rights Reserved.
# __END_LICENSE__

from django.shortcuts import render_to_response
from django.utils.translation import ugettext, ugettext_lazy as _

import json

from django.template import Context, loader, RequestContext
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseForbidden, Http404
from django.contrib.auth.models import  User
from geocamCover.models import Place, Task, Report
from datetime import datetime


def index(request):
    t = loader.get_template('geocamCover/index.html')
    c = RequestContext(request)
    #    places = Place.objects.all()

    return HttpResponse(t.render(c))


def places_json(request):
    place_hash = {"places": []}
    for p in Place.objects.all():
        place_dict = {}
        place_dict["place"] = p.get_struct()
        place_dict["tasks"] = []
        place_dict["reports"] = []

        for t in p.task_set.all():
            place_dict["tasks"].append(t.get_struct())
            
        for r in p.report_set.all():
            place_dict["reports"].append(r.get_struct())
        place_hash["places"].append(place_dict)

    places = json.dumps(place_hash, sort_keys=True, indent=4)
    return HttpResponse(places, mimetype="application/json")

def categories_json(request):
    categories_enum = Place.get_categories()
    categories_hash = {}
    for id, category in categories_enum:
		categories_hash[id] = category
    categories = json.dumps(categories_hash, sort_keys=True, indent=4)
    return HttpResponse(categories, mimetype="application/json")
	

def place(request):
    if request.method == 'POST':
        user = get_user(request)
        struct = json.loads(request.raw_post_data)
        place = Place()
        if struct['place_id'] != None:
            place = Place.objects.get(id=struct['place_id'])
        place.name = struct['name']
        place.category = struct['category']
        place.latitude = struct['latitude']
        place.longitude = struct['longitude']
        place.created_by = user
        place.save()
        return HttpResponse(place.id)
    else:
        return HttpResponse("error")


def delete_item(request):
    if request.method == 'DELETE':
        struct = json.loads(request.raw_post_data)
        item = None
        exec "item = %s.objects.get(id=%s)" % (struct["type"], struct["id"])
        item_id = item.id
        item.delete()
        return HttpResponse(item_id)
    else:
        return HttpResponse("error")


def task(request):
    if request.method == 'POST':
        user = get_user(request)
        struct = json.loads(request.raw_post_data)
        place = Place.objects.get(id=struct['place_id'])
        task = Task()
        if struct['task_id'] != None:
            task = Task.objects.get(id=struct['task_id'])
        task.place=place
        task.title=struct['title']
        task.priority=struct['priority']
        task.description=struct['description']
        task.created_by=user

        task.save()
        return HttpResponse(str(task.id)+","+ task.modified_at.strftime("%m/%d/%Y %H:%M:%S"))
    else:
        return HttpResponse("error")


def report(request):
    if request.method == 'POST':
        user = get_user(request)
        struct = json.loads(request.raw_post_data)
        place = Place.objects.get(id=struct['place_id'])

        print "Title"
        print struct['title']
        print "Status"
        print struct['status']
        print "%%%"
        print struct['percent_completed']

        report = Report()
        if struct['report_id'] != None:
            report = Report.objects.get(id=struct['report_id'])

        report.place=place
        report.title=struct['title']
        report.percent_completed=struct['percent_completed']
        
        report.notes=struct['notes']
        report.status=struct['status']
        report.created_by=user

        if struct['task_id'] != None and struct['task_id'] != "":
            task = Task.objects.get(id=struct['task_id'])
            report.task = task
           
        report.save()
            
        return HttpResponse(str(report.id)+","+ report.modified_at.strftime("%m/%d/%Y %H:%M:%S"))
    else:
        return HttpResponse("error")


def get_user(request):
    user = None
    if request.user == None or not request.user.is_authenticated():
        user = User.objects.get(username="root")
    else:
        user = request.user
    return user
