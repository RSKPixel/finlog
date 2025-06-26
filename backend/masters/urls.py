from django.contrib import admin
from django.urls import path
from .views import *

urlpatterns = [
    path("ledger/update/", update_ledgermaster,
         name="save_ledgermaster"),
    path("ledger/search/", search_ledgermaster,
         name="search_ledgermaster"),

]
