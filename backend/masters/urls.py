from django.contrib import admin
from django.urls import path
from .views import *

urlpatterns = [
    path("instruments/save/", save_instrumentmaster,
         name="save_instrumentmaster"),
    path("instruments/search/", search_instrumentmaster,
         name="search_instrumentmaster"),

]
