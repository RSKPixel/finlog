from django.contrib import admin
from django.urls import path
from .amfi import *
from .nse import *

urlpatterns = [
    path('amfi/eod/download/', amfi_download_eod),
    path('amfi/historical/download/', amfi_historical_download),

    path('nse/eod/download/', nse_download_eod),
    path('nse/historical/download/', nse_historical_download),

]
