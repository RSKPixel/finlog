from rest_framework.decorators import api_view
from rest_framework.response import Response
from portfolio.models import PortfolioTransactions, PortfolioHoldings
from portfolio.utils import fifo, update_holdings, update_holdings_xirr
from portfolio.portfolio import holding_summary, investment_progress
from marketdata.nse import nse_eod_fetch
import pandas as pd
import numpy as np
from django.db import transaction
from datetime import datetime
from django.conf import settings


@api_view(['POST'])
def equity_holdings(request):
    client_pan = request.data.get('client_pan')
    portfolio = request.data.get('portfolio', 'Stocks')
    instrument_name = request.data.get('instrument_name', "All")
    folio_id = request.data.get('folio_id',"All")

    if not client_pan:
        return Response({"status": "error", "message": "Client PAN is required"})

    update_holdings(client_pan=client_pan, portfolio=portfolio)
    update_eod()
    # update_holdings_xirr(client_pan=client_pan, portfolio=portfolio)
    summary_data = holding_summary(client_pan=client_pan, portfolio=portfolio, instrument_name=instrument_name, folio_id=folio_id)
    instruments = (PortfolioHoldings.objects
                .filter(client_pan=client_pan, portfolio=portfolio)
                .values_list('instrument_name', flat=True)
                .distinct())
    folios = (PortfolioHoldings.objects
            .filter(client_pan=client_pan, portfolio=portfolio)
            .values_list('folio_id', flat=True)
            .distinct())

    progress_data = pd.DataFrame()
    # progress_data = investment_progress(
    #     client_pan=client_pan, portfolio=portfolio, instrument_name=instrument_name)
    return Response({"status": "success", "data": {
        "summary_data": summary_data,
        "instruments": instruments,
        "folios": folios,
        "progress": progress_data.to_dict(orient='records')
    }})


@api_view(['POST'])
def equity_upload(request):
    client_pan = request.data.get('client_pan')
    file = request.FILES.get('file')
    portfolio = request.data.get('portfolio', 'Stocks')
    ledger_ref_no = request.data.get('ledger_ref_no', None)

    if not client_pan or not file or not ledger_ref_no:
        return Response({"status": "error", "message": "Client PAN, File and Ledger Name are required"})

    equity_df = pd.read_csv(file)
    equity_df.dropna(how='all', inplace=True)

    expected_columns = [
        'symbol', 'isin', 'trade_date', 'exchange',
        'segment', 'series', 'trade_type', 'auction',
        'quantity', 'price', 'trade_id', 'order_id',
        'order_execution_time'
    ]
    columns_needed = [
        'symbol', 'order_execution_time', 'trade_type', 'quantity', 'price', 'trade_id'
    ]

    if not all(col in equity_df.columns for col in expected_columns):
        return Response({"status": "error", "message": "Invalid file format. Missing required columns."})

    equity_df = equity_df[columns_needed]
    equity_df["client_pan"] = client_pan
    equity_df["folio_id"] = ledger_ref_no
    equity_df["portfolio"] = portfolio
    equity_df["asset_class"] = "Equity"
    equity_df["order_execution_time"] = pd.to_datetime(
        equity_df["order_execution_time"], errors='coerce').dt.date
    equity_df["folio_name"] = equity_df["folio_id"]
    equity_df["instrument_name"] = equity_df["symbol"]
    equity_df["quantity"] = np.where(
        equity_df["trade_type"].str.lower() == "buy",
        equity_df["quantity"],
        -equity_df["quantity"]
    )
    equity_df["amount"] = equity_df["quantity"] * equity_df["price"]
    equity_df["balance_units"] = equity_df["quantity"]
    equity_df["holding_value"] = equity_df["amount"]
    equity_df = equity_df.round(2)
    equity_df = equity_df.rename(columns={
        "symbol": "instrument_id",
        "trade_type": "transaction_type",
        "order_execution_time": "transaction_date",
        "trade_id": "transaction_id",
        "quantity": "units",
        "price": "unit_price",
    })

    equity_df = equity_df[["client_pan", "portfolio", "asset_class",
                           "folio_id", "folio_name", "instrument_id",
                           "instrument_name", "transaction_date",
                           "transaction_id", "transaction_type", "amount", "units",
                           "unit_price", "balance_units", "holding_value"]]

    # create update to PortfolioTransactions

    with transaction.atomic():
        for _, row in equity_df.iterrows():
            PortfolioTransactions.objects.update_or_create(
                client_pan=row['client_pan'],
                folio_id=row['folio_id'],
                instrument_id=row['instrument_id'],
                transaction_date=row['transaction_date'],
                transaction_id=row['transaction_id'],
                defaults={
                    'portfolio': row['portfolio'],
                    'asset_class': row['asset_class'],
                    'folio_name': row['folio_name'],
                    'instrument_name': row['instrument_name'],
                    'transaction_type': row['transaction_type'],
                    'amount': row['amount'],
                    'units': row['units'],
                    'unit_price': row['unit_price'],
                    'balance_units': row['balance_units'],
                    'holding_value': row['holding_value']
                }
            )

    folio_instrument_ids = equity_df[[
        'folio_id', 'instrument_id']].drop_duplicates()

    # Calculate FIFO for each folio and instrument
    for _, row in folio_instrument_ids.iterrows():
        fifo(
            client_pan=client_pan,
            folio_id=row['folio_id'],
            instrument_id=row['instrument_id']
        )

    # Update holdings after processing transactions
    update_holdings(client_pan=client_pan, portfolio=portfolio)

    return Response({"message": "Equity upload successful"})


def update_eod():
    status_message, eod_data = nse_eod_fetch()

    if status_message != 'EOD data fetched successfully':
        print(f"Failed to fetch EOD data: {status_message}")
        return
    
    eod = eod_data.rename(columns={
        "close": "current_price",
        "trade_date": "current_price_date"
    })[["symbol", "current_price", "current_price_date"]]

    eod = (
        eod.drop_duplicates(
            subset=["symbol", "current_price_date"], keep='last')
        .dropna(subset=["symbol", "current_price"])
    )
    eod = eod[eod["current_price"] > 0]
    eod.rename(columns={"symbol": "instrument_id"}, inplace=True)

    holdings_qs = PortfolioHoldings.objects.filter(portfolio="Stocks").values()

    for holding in holdings_qs:
        instrument_id = holding['instrument_id']
        current_price_row = eod[eod['instrument_id'] == instrument_id]

        if not current_price_row.empty:
            current_price = current_price_row['current_price'].values[0]
            current_price_date = current_price_row['current_price_date'].values[0]
            pl = round((holding['holding_units'] *
                       current_price) - holding['holding_value'], 2)
            plp = round((pl / holding['holding_value'] * 100),
                        2) if holding['holding_value'] else 0

            PortfolioHoldings.objects.filter(
                client_pan=holding['client_pan'],
                folio_id=holding['folio_id'],
                instrument_id=instrument_id
            ).update(
                current_price=current_price,
                current_value=holding['holding_units'] * current_price,
                current_price_date=current_price_date,
                pl=pl,
                plp=plp
            )

    return
