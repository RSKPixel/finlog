from django.contrib import admin
from django.urls import path
from .views import *

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('validate/', validate, name='validate'),
]
