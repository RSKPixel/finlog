from django.contrib import admin
from django.urls import path
from .views import *

urlpatterns = [
    path("ledger/update/", update_ledgermaster),
    path("ledger/search/", search_ledgermaster),
    path("ledger/fetch-groupwise/", fetch_ledger_groupwise)

]
