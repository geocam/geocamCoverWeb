# __BEGIN_LICENSE__
# Copyright (C) 2008-2010 United States Government as represented by
# the Administrator of the National Aeronautics and Space Administration.
# All Rights Reserved.
# __END_LICENSE__

from django.conf.urls.defaults import *
from geocamCover import views

urlpatterns = patterns('',
 url(r'^$', views.index, name='index'),
 url(r'^places.json$', views.places_json),
 url(r'^place/$', views.place),
)
