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
from geocamCover.models import Place


def index(request):
    t = loader.get_template('geocamCover/index.html')
    c = RequestContext(request)
    #    places = Place.objects.all()

    return HttpResponse(t.render(c))


def hello_world_json(request):

    foo = {"places": [p.get_struct() for p in Place.objects.all()]}
    foo_json = json.dumps(foo, sort_keys=True, indent=4)
    return HttpResponse(foo_json, mimetype="application/json")


def place(request):
    if request.method == 'POST':
        if request.user == None:
            user = User.objects.get(id=0)
        else:
            user = request.user
        struct = json.loads(request.raw_post_data)
        Place(name=struct['name'], latitude=struct['latitude'], longitude=struct['longitude']
              , created_by=user).save()
    return HttpResponse("ok")