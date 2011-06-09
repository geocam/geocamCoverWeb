# __BEGIN_LICENSE__
# Copyright (C) 2008-2010 United States Government as represented by
# the Administrator of the National Aeronautics and Space Administration.
# All Rights Reserved.
# __END_LICENSE__

from django.db import models
from django.contrib.auth.models import User

class Place(models.Model):
    name = models.CharField(max_length=200, blank=True)
    longitude = models.FloatField(null=True)
    latitude = models.FloatField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User)

    def __unicode__(self):
        return self.name

    def get_struct(self):
        return {"name": self.name, "latitude": self.latitude, "longitude": self.longitude}


class Task(models.Model):
    place = models.ForeignKey(Place)
    title = models.CharField(max_length=200, blank=True)
    description = models.CharField(max_length=1000, blank=True)
    priority = models.IntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User)
	
    def __unicode__(self):
        return self.name

    def get_struct(self):
        return {"place": self.place, "title": self.title, "description": self.description, "priority": self.priority}


class Report(models.Model):
    task = models.ForeignKey(Task)
    title = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=200, blank=True)
    notes = models.CharField(max_length=1000, blank=True)
    percent_completed = models.IntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User)
	
    def __unicode__(self):
        return self.name

    def get_struct(self):
        return {"task": self.task, "title": self.title, "notes": self.notes, "status": self.status, "percent_completed": self.percent_completed}
