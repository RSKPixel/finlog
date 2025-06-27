from django.urls import path
from .portfolio import *
# from .insurance_views import *
from .equity_views import *
from .mutualfund_views import *

urlpatterns = [
    # Portfolio URLs
    path("summary/", portfolio, name="summary"),
    path("yrly/", investment_progress_yearly, name="yearly_summary"),

    # Mutual Fund URLs
    path("mutualfund/upload/", mutualfund_upload, name="mutualfund_upload"),
    path("mutualfund/holdings/", mutualfund_holdings, name="mutualfund_holdings"),

    #  Equity URLs
    path("stocks/upload/", equity_upload, name="equity_upload"),
    path("stocks/holdings/", equity_holdings, name="equity_holdings"),

#     # Insurance URLs
#     path("insurance/upload/", insurance_upload, name="insurance"),
#     path("insurance/holdings/fetch/",
#          insurance_holdings, name="insurance_holdings"),
#     path("insurance/holdings/details/", insurance_holdings_details,
#          name="insurance_holdings_transactions"),
#     path("insurance/holdings/update/", insurance_holdings_update,
#          name="insurance_holdings_update"),
]
