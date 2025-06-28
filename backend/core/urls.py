from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('user/', include('user.urls')),
    path('masters/', include('masters.urls')),
    path('transactions/', include('transactions.urls')),
    path('portfolio/', include('portfolio.urls')),
    path('marketdata/', include('marketdata.urls')),
]
