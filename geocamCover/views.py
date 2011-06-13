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


def place(request):
    if request.method == 'POST':
        user = get_user(request)
        struct = json.loads(request.raw_post_data)
        place = Place(name=struct['name'], latitude=struct['latitude'], longitude=struct['longitude']
              , created_by=user)
        place.save()
    return HttpResponse(place.id)


def task(request):
    if request.method == 'POST':
        user = get_user(request)
        struct = json.loads(request.raw_post_data)
        place = Place.objects.get(id=struct['place_id'])
        Task(place=place, title=struct['title'], priority=struct['priority'], description=struct['description']
              ,created_by=user).save()
    return HttpResponse("ok")


def report(request):
    if request.method == 'POST':
        user = get_user(request)
        struct = json.loads(request.raw_post_data)
        place = Place.objects.get(id=struct['place_id'])
        Report(place=place, title=struct['title'], percent_completed=struct['percent_completed'], notes=struct['notes'],
              status=struct['status'],created_by=user).save()
    return HttpResponse("ok")


def get_user(request):
    user = None
    if request.user == None or not request.user.is_authenticated():
        user = User.objects.get(username="root")
    else:
        user = request.user
    return user
