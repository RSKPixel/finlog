from django.urls import path
from .portfolio import *
from .insurance_views import *
from .equity_views import *
from .mutualfund_views import *

urlpatterns = [
    # Portfolio URLs
    path("summary/", portfolio, name="summary"),
    path("yrly/", investment_progress_yearly,),

    # Mutual Fund URLs
    path("mutualfund/upload/", mutualfund_upload,),
    path("mutualfund/holdings/", mutualfund_holdings,),
    path("mutualfund/holdings/details/", fundsummary),
    path("mutualfund/holdings/update/", mutualfund_holdings_update, name="mutualfund_holdings_update"),

    #  Equity URLs
    path("stocks/upload/", equity_upload, name="equity_upload"),
    path("stocks/holdings/", equity_holdings, name="equity_holdings"),

    # Insurance URLs
    path("insurance/", insurance, name="insurance"),
    path("insurance/save/", insurance_save, name="insurance_save"),

]
