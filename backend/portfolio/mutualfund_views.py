from rest_framework.decorators import api_view
from rest_framework.response import Response
from marketdata.amfi import amfi_eod_fetch, amfi_historical_fetch, amfi_historical_resampled
from portfolio.utils import fifo, update_holdings, update_holdings_xirr
from portfolio.portfolio import holding_summary, investment_progress
from portfolio.models import PortfolioTransactions, PortfolioHoldings

from django.conf import settings
from django.db import transaction
from django.db.models import Sum
import os
import pandas as pd
import pdfplumber
import re
import requests
import numpy as np
from datetime import date, datetime
from dateutil.relativedelta import relativedelta

@api_view(['POST'])
def fundsummary(request):
    client_pan = request.data.get('client_pan')
    instrument_id = request.data.get('instrument_id')
    folio_id = request.data.get('folio_id')

    holding = PortfolioHoldings.objects.filter(
        client_pan=client_pan,
        folio_id=folio_id,
        instrument_id=instrument_id
    ).values().first()

    transactions  = PortfolioTransactions.objects.filter(
        client_pan=client_pan,
        folio_id=folio_id,
        instrument_id=instrument_id,
        balance_units__gt=0
    ).values('transaction_date', 'holding_value', 'balance_units', 'unit_price').order_by('transaction_date')

    status_message, nav = amfi_historical_fetch(instrument_id)
    if status_message != "success":
        nav = pd.DataFrame(columns=["date","isin","scheme_code","nav","scheme_name","amc_name"])
        yearly = pd.DataFrame(columns=["date", "open", "high", "low", "close"])
        print(f"Failed to fetch NAV data: {status_message}")

    df = pd.DataFrame(transactions)
    df['holding_value'] = df['holding_value'].astype(float)
    df['balance_units'] = df['balance_units'].astype(float)
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    start_date = df['transaction_date'].min()
    end_date = datetime.now()

    nav['date'] = pd.to_datetime(nav['date'])
    nav = nav[(nav['date'] >= start_date) & (nav['date'] <= end_date)]
    yearly = (nav.groupby(nav['date'].dt.year)
                .agg(open=('nav', 'first'),
                    high=('nav', 'max'),
                    low=('nav', 'min'),
                    close=('nav', 'last'),
                    mean=('nav', 'mean'),
                    ).reset_index()
                    .rename(columns={'date': 'year'})  
            )

    purchase_analysis = (
        df[df['balance_units'] > 0]
        .assign(year=df['transaction_date'].dt.year)
        .groupby('year')
        .agg({'balance_units': 'sum', 'holding_value': 'sum'})
        .reset_index()
    )

    purchase_analysis["avg_nav"] = purchase_analysis['holding_value'] / purchase_analysis['balance_units']
    purchase_analysis = purchase_analysis.merge(yearly[['year', 'mean' ,'high','low',]], on='year', how='left')
    purchase_analysis["efficency_ratio"] = round((purchase_analysis["high"] - purchase_analysis["avg_nav"]) / (purchase_analysis["high"] - purchase_analysis["low"]),2)


    cutoff_date = pd.to_datetime(date.today() - relativedelta(years=1))
    long = df[df['transaction_date'] < cutoff_date]
    short = df[df['transaction_date'] >= cutoff_date]
    longterm_holdings = {
        "value":long['holding_value'].sum(), 
        "units": long['balance_units'].sum(),
        "nav": long['holding_value'].sum() / long['balance_units'].sum() if long['balance_units'].sum() > 0 else 0,
        "pl": long["balance_units"].sum() * holding['current_price'] - long["holding_value"].sum(),
        }
    shortterm_holdings = {
        "value":short['holding_value'].sum(), 
        "units": short['balance_units'].sum(),
        "nav": short['holding_value'].sum() / short['balance_units'].sum() if short['balance_units'].sum() > 0 else 0,
        "pl": short["balance_units"].sum() * holding['current_price'] - short["holding_value"].sum(),
        }
    
    status_message, nav_changes = amfi_historical_resampled(instrument_id)
    if status_message != "success":
        nav_changes = pd.DataFrame(columns=["date", "isin", "scheme_code", "nav", "scheme_name", "amc_name"])
        print(f"Failed to fetch NAV changes data: {status_message}")

    nav_changes['date'] = pd.to_datetime(nav_changes['date'])
    nav_changes['year'] = pd.to_datetime(nav_changes['date']).dt.year
    nav_changes['month'] = pd.to_datetime(nav_changes['date']).dt.month
    nav_changes = nav_changes[['year', 'month', 'change']]
    
    grouped = nav_changes.groupby(['year', 'month'])['change'].first().unstack(fill_value=None)
    grouped = grouped.replace([np.inf, -np.inf], np.nan)

    nav_changes_yearly = []
    for year, row in grouped.iterrows():
        changes = [None if pd.isna(val) else val for val in row]
        nav_changes_yearly.append({"year": year, "changes": changes})

    return Response({
        "status": "success", 
        "data": {
            "longterm_holdings": longterm_holdings, 
            "shortterm_holdings": shortterm_holdings, 
            "transactions": df.to_dict(orient='records'), 
            "holding": holding,
            "nav_yearly": yearly.to_dict(orient='records'),
            "nav_daily": nav.to_dict(orient='records'),
            "purchase_analysis": purchase_analysis.to_dict(orient='records'),
            "nav_changes": list(reversed(nav_changes_yearly)),
            }
        })  

@api_view(['POST'])
def mutualfund_holdings(request):
    client_pan = request.data.get('client_pan')
    portfolio = request.data.get('portfolio', 'Mutual Fund')
    asset_class = request.data.get('asset_class', 'All')
    instrument_name = request.data.get('instrument', 'All')

    if not client_pan:
        return Response({"status": "error", "message": "Client PAN is required"})

    qs = PortfolioHoldings.objects.filter(
        client_pan=client_pan, portfolio=portfolio)
    asset_classes = qs.values_list('asset_class', flat=True).distinct()
    instruments = qs.values_list('instrument_name', flat=True).distinct()

    filter = {'client_pan': client_pan, 'portfolio': portfolio}

    update_nav(client_pan=client_pan)
    update_holdings_xirr(client_pan=client_pan, portfolio=portfolio)
    summary_data = holding_summary(client_pan=client_pan, portfolio=portfolio,
                                   asset_class=asset_class, instrument_name=instrument_name)

    progress_data = investment_progress(
        client_pan=client_pan, portfolio=portfolio, asset_class=asset_class, instrument_name=instrument_name)

    return Response({
        "status": "success",
        "message": "Mutual Fund Holdings fetched successfully",
        "data": {
            "summary_data": summary_data,
            "asset_classes": list(asset_classes),
            "instruments": list(instruments),
            "progress": progress_data.to_dict(orient='records'),
        }})

@api_view(['POST'])
def mutualfund_upload(request):
    file = request.FILES.get('file')
    client_pan = request.data.get('client_pan')

    if not file or not client_pan:
        return Response({
            "status": "error",
            "message": "File and Client PAN are required",
            "data": []
        })

    save_path = os.path.join(settings.BASE_DIR, 'data',
                             f"{client_pan}_CAMS.pdf")
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    # Save file
    with open(save_path, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)

    try:
        data = pd.DataFrame()
        data = camspdf_extraction(save_path, password=str.lower(
            client_pan), client_pan=client_pan)
        data.fillna('', inplace=True)

        data.rename(columns={
            'client_pan': 'client_pan',
            'folio': 'folio_id',
            'fund_name': 'instrument_name',
            'amc': 'folio_name',
            'assetclass': 'asset_class',
            'isin': 'instrument_id',
            'transaction_date': 'transaction_date',
            'trade_type': 'transaction_type',
            'nav': 'unit_price',
            'trade_value': 'amount',
            'units': 'units'
        }, inplace=True)

        data['portfolio'] = 'Mutual Fund'
        data['asset_class'] = 'Equity'
        data['transaction_id'] = ''
        data['balance_units'] = data['units']
        data['holding_value'] = data['amount']
        data['transaction_date'] = pd.to_datetime(
            data['transaction_date'], errors='coerce')
        data['transaction_type'] = data['transaction_type'].apply(
            lambda x: 'buy' if x == 'IN' else 'sell')
        data['unit_price'] = data['amount'] / data['units']
        data['amount'] = data["units"] * data['unit_price']
        data['balance_units'] = data['units']
        data['holding_value'] = data['amount']

        data['txn_seq'] = data.groupby(
            ['client_pan', 'folio_id', 'instrument_id', 'transaction_date']).cumcount() + 1
        data['transaction_id'] = data.apply(
            lambda row: f"{row['transaction_date'].strftime('%Y%m%d')}_{row['txn_seq']}",
            axis=1
        )

        data = data.round(3)

        data = data[['client_pan', 'portfolio', 'asset_class', 'folio_id', 'folio_name',
                     'instrument_id', 'instrument_name', 'transaction_date',
                     'transaction_id', 'transaction_type', 'amount', 'units',
                     'unit_price', 'balance_units', 'holding_value']]

        # create or update to portfolio_transactions
    except Exception as e:
        return Response({
            "status": "error",
            "message": f"Invalid document format. Please upload a valid CAMS Mutual Fund PDF.",
            "data": []
        })

    with transaction.atomic():
        for _, row in data.iterrows():
            PortfolioTransactions.objects.update_or_create(
                client_pan=row['client_pan'],
                folio_id=row['folio_id'],
                instrument_id=row['instrument_id'],
                transaction_date=row['transaction_date'],
                transaction_id=row['transaction_id'],
                defaults={
                    'transaction_id': row['transaction_id'],
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

    # Unique folio and instrument combinations
    folio_instrument_ids = data[['folio_id',
                                 'instrument_id']].drop_duplicates()
    # Calculate FIFO for each folio and instrument
    for _, row in folio_instrument_ids.iterrows():
        fifo(client_pan=client_pan,
             folio_id=row['folio_id'], instrument_id=row['instrument_id'])

    update_holdings(client_pan=client_pan, portfolio='Mutual Fund')

    return Response({
        "status": "success",
        "message": "Mutual Fund Uploaded Successfully",
        "data": data.to_dict(orient='records')
    })

def camspdf_extraction(pdf_path, password=None, client_pan=None):

    url = "https://www.amfiindia.com/spages/NAVOpen.txt"
    response = requests.get(url)
    if response.status_code == 200:
        amfi_data = response.text.split("\n")
    else:
        amfi_data = None

    final_text = ""
    with pdfplumber.open(pdf_path, password=password) as pdf:
        for i in range(len(pdf.pages)):
            txt = pdf.pages[i].extract_text()
            final_text = final_text + "\n" + txt
        pdf.close()

    folio_pat = re.compile(r"(^Folio No: \d+\s*/\s*\S+)", flags=re.IGNORECASE)
    folio_match = re.compile(
        r"Folio No: \s*(.*?)\s*(KYC|PAN)", flags=re.IGNORECASE)

    fund_name = re.compile(r".*[Fund].*ISIN.*", flags=re.IGNORECASE)
    # Extracting Transaction data
    trans_details = re.compile(
        r"(^\d{2}-\w{3}-\d{4})(\s.+?\s(?=[\d(]))([\d\(]+[,.]\d+[.\d\)]+)(\s[\d\(\,\.\)]+)(\s[\d\,\.]+)(\s[\d,\.]+)")
    isin_regex = re.compile(r"\b[A-Z]{2}[A-Z0-9]{10}\b", flags=re.IGNORECASE)
    # isin_regex = re.compile(r"\bIN[A-Z0-9]{10}\b", flags=re.IGNORECASE)

    fund_name_regex = re.compile(r"- (.*?) - ISIN", flags=re.IGNORECASE)
    text = ""
    fname = ""
    folio = ""
    folio_new = ""
    isin = ""
    line_itms = []
    for i in final_text.splitlines():
        if folio_match.match(i):
            folio = folio_match.match(i).group(1)

        if fund_name.match(i):
            fname = fund_name.match(i).group(0)
            isin = isin_regex.search(fname).group(0)

        amc, fname, nav = search_isin(isin, amfi_data)
        txt = trans_details.search(i)
        if txt:
            date = txt.group(1)
            description = txt.group(2)
            investment_amount = txt.group(3)
            units = txt.group(4)
            nav = txt.group(5)
            unit_bal = txt.group(6)
            fname = fname
            amc_name = amc

            line_itms.append(
                [folio, isin, fname, amc_name, date,  description,
                    investment_amount, units, nav, unit_bal]
            )

    df = pd.DataFrame(line_itms, columns=["folio", "isin", "fund_name", "amc_name",
                      "date", "description", "investment_amount", "units", "nav", "unitbalance"])

    df.investment_amount = df.investment_amount.str.replace(",", "")
    df.investment_amount = df.investment_amount.str.replace("(", "-")
    df.investment_amount = df.investment_amount.str.replace(")", "")
    df.investment_amount = df.investment_amount.astype("float")

    df.units = df.units.str.replace(",", "")
    df.units = df.units.str.replace("(", "-")
    df.units = df.units.str.replace(")", "")
    df.units = df.units.astype("float")
    df.units = df.units.round(3)

    df.nav = df.nav.str.replace(",", "")
    df.nav = df.nav.str.replace("(", "-")
    df.nav = df.nav.str.replace(")", "")
    df.nav = df.nav.astype("float")

    df.unitbalance = df.unitbalance.str.replace(",", "")
    df.unitbalance = df.unitbalance.str.replace("(", "-")
    df.unitbalance = df.unitbalance.str.replace(")", "")
    df.unitbalance = df.unitbalance.astype("float")
    df.unitbalance = df.unitbalance.round(3)

    df["client_pan"] = client_pan
    df.folio = df.folio.str.replace("Folio No: ", "")
    df.folio = df.folio.str.replace(" ", "")
    df["isin"] = df["isin"].str.upper()
    df['folio_isin'] = df['folio'] + " (" + df['isin'] + ")"

    df.date = pd.to_datetime(df.date, format="%d-%b-%Y")
    df['description'] = df['units'].apply(lambda x: 'IN' if x > 0 else 'OUT')
    outputfile = os.path.join(settings.BASE_DIR, "data/output.csv")
    newdf = pd.DataFrame(columns=["client_pan", "folio", "fund_name", "amc", "assetclass",
                         'symbol', "name", "isin", 'transaction_date', 'trade_type', 'nav', 'quantity', "trade_value"])
    newdf["client_pan"] = df["client_pan"]
    newdf["isin"] = df["isin"]
    newdf["folio"] = df["folio"]
    newdf["fund_name"] = df["fund_name"]
    newdf["amc"] = df["amc_name"]
    newdf["transaction_date"] = df["date"]
    newdf["trade_type"] = df["description"]
    newdf["trade_value"] = df["investment_amount"]
    newdf["units"] = df["units"].round(3)
    newdf["nav"] = df["nav"]

    newdf.to_csv(outputfile, index=False)

    return newdf

def search_isin(isin, amfi_data):

    if amfi_data:
        amc_name = None  # Store AMC name

        for i in range(1, len(amfi_data) - 1):
            if not amfi_data[i].strip() and amfi_data[i-1].strip() and amfi_data[i+1].strip():
                amc_name = amfi_data[i-1].strip()

            if isin.upper() in amfi_data[i].upper():
                row = amfi_data[i].split(";")
                fund_name = row[3].strip() if len(row) > 4 else None

                if fund_name:
                    cleaned_text = re.sub(r"\s*\(.*?\)", "", fund_name)
                    cleaned_text = re.sub(
                        r"\b(DIRECT|PLAN|GROWTH|OPTION)\b", "", fund_name, flags=re.IGNORECASE)
                    cleaned_text = re.sub(r"\s*-\s*", " ", cleaned_text)
                    cleaned_text = re.sub(r"\s+", " ", cleaned_text).strip()
                    fund_name = cleaned_text

                nav = row[4].strip() if len(row) > 4 else None
                nav_date = row[5].strip() if len(row) > 5 else None
                return amc_name, fund_name, nav

    return None, None, None

def update_nav(client_pan):

    portfolio = 'Mutual Fund'
    filter = {'client_pan': client_pan, 'portfolio': portfolio}
    isin_list = PortfolioHoldings.objects.filter(
        **filter).values_list('instrument_id', flat=True).distinct()
    isin_list = list(isin_list)

    status_message, mf_eod = amfi_eod_fetch()
    if status_message != "success":
        print(f"Failed to fetch NAV data: {status_message}")
        return False

    for isin in isin_list:
        eod = mf_eod[mf_eod['isin'] == isin]

        nav = eod['nav'].values[0]
        scheme_code = eod['scheme_code'].values[0]
        amc_code = eod['amc_code'].values[0]
        amc = eod['amc_name'].values[0]
        nav_date = eod['date'].values[0]

        mf = PortfolioHoldings.objects.filter(
            client_pan=client_pan,
            instrument_id=isin
        )
        holding_units, holding_value = mf.values(
            "holding_units", "holding_value").first().values()
        current_value = round(nav * holding_units, 2)
        pl = round(current_value - holding_value, 2)
        plp = round((pl / holding_value) * 100, 2)
        mf.update(
            folio_name=amc,
            current_price=nav,
            current_price_date=nav_date,
            current_value=current_value,
            pl=pl,
            plp=plp
        )
    return True

