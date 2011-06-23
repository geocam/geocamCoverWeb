# __BEGIN_LICENSE__
# Copyright (C) 2008-2010 United States Government as represented by
# the Administrator of the National Aeronautics and Space Administration.
# All Rights Reserved.
# __END_LICENSE__

from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

# source: http://mapicons.nicolasmollet.com/
CATEGORIES = (
        (0, 'Select Category'),
        (1, 'Stores'),
        (2, 'Nature'),
        (3, 'Tourism'),
        (4, 'Friends & Family'),
        (5, 'Sports'),
        (6, 'Health & Education'),
        (7, 'Events'),
        (8, 'Culture & Entertainment'),
        (9, 'Restaurants & Hotels'),
        (10, 'Offices'),
        (11, 'Industry'),
        (12, 'Transportation'),
    )

class Place(models.Model):
    name = models.CharField(max_length=200, blank=True)
    longitude = models.FloatField(null=True)
    latitude = models.FloatField(null=True)
    category = models.IntegerField(max_length=1, choices=CATEGORIES)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User)

    @staticmethod
    def get_categories():
        return CATEGORIES

    def __unicode__(self):
        return self.name

    def get_struct(self):
        return {"id": self.id, "name": self.name, "latitude": self.latitude, "longitude": self.longitude,
                "category": self.category}


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
        return {"id": self.id, "place_id": self.place_id, "title": self.title, "description": self.description,
                "priority": self.priority, "modified_at": self.modified_at.strftime("%m/%d/%Y %H:%M:%S")}


class Report(models.Model):
    place = models.ForeignKey(Place)
    task = models.ForeignKey(Task, null=True, on_delete=models.SET_NULL)
    title = models.CharField(max_length=200, blank=True)
    status = models.IntegerField(null=True)
    notes = models.CharField(max_length=1000, blank=True)
    percent_completed = models.IntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User)

    def __unicode__(self):
        return self.name

    def get_struct(self):
        return {"id": self.id, "task_id": self.task_id, "place_id": self.place_id, "title": self.title,
                "notes": self.notes, "status": self.status,
                "percent_completed": self.percent_completed,
                "modified_at": self.modified_at.strftime("%m/%d/%Y %H:%M:%S")}


