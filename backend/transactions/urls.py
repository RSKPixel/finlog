from django.contrib import admin
from django.urls import path
from .banking import *

urlpatterns = [
    path("banking/upload-statement/", banking_upload),
    path("banking/upload-reconfirm/", bank_statement_reconfirmed),

]
