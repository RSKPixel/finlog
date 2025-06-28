from django.contrib import admin
from django.urls import path
from .amfi import *

urlpatterns = [
    path('amfi/eod/download/', amfi_download_eod, name='amfi_download_eod'),
    # path('download-historical/', amfi_download_historical, name='amfi_download_historical'),

]
