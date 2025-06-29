
from rest_framework.decorators import api_view
from rest_framework.response import Response
import os
import requests
import pandas as pd
from django.conf import settings
from .models import MutualFundsEod, MutualFundsHistorical
from portfolio.models import PortfolioTransactions
from django.db import transaction
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import numpy as np
BASE_DIR = settings.BASE_DIR
url = "https://www.amfiindia.com/spages/NAVAll.txt"


@api_view(['GET'])
def amfi_historical_download(request):
    isin = request.query_params.get('isin', None)
    period = request.query_params.get('period', 1825)

    filter_kwargs = {}
    period = int(period)

    if isin and len(str(isin).strip()) > 0:
        filter_kwargs['isin'] = isin
    else:
        isins = (PortfolioTransactions.objects
                 .values_list('instrument_id', flat=True)
                 .filter(portfolio='Mutual Fund')
                 .distinct())
        filter_kwargs['isin__in'] = isins

    message = []
    try:
        codes = MutualFundsEod.objects.filter(
            **filter_kwargs).values('scheme_code', 'amc_code', 'isin')
        if not codes:
            return Response({"message": f"No data found", "data": []})

        for data in codes:
            amc_code = data['amc_code']
            scheme_code = data['scheme_code']
            isin = data['isin']

            message.append(amfi_historical_data(
                isin, scheme_code, amc_code, period))

        return Response({"message": list(message), "data": []})
    except Exception as e:
        return Response({"message": str(e), "data": []})

@api_view(['GET'])
def amfi_download_eod(request):
    try:
        session = requests.Session()
        response = session.get(url)
        response.raise_for_status()
        data = response.text.splitlines()

        nav_amfi_csv = os.path.join(BASE_DIR, "data", "mf_nav_amfi.csv")
        nav_amfi_txt = os.path.join(BASE_DIR, "data", "mf_nav_amfi.txt")
        amc_code_df = pd.read_csv(os.path.join(
            BASE_DIR, "data", "amfi_amc.csv"))

        with open(nav_amfi_txt, 'wb') as file:
            file.write(response.content)

        with open(nav_amfi_txt, 'r', encoding='utf-8', errors='replace') as infile:
            lines = infile.readlines()

        amc_name = None
        amc_code = None

        with open(nav_amfi_csv, 'w', encoding='utf-8') as outfile:
            for i in range(1, len(lines) - 1):
                current = lines[i].strip()
                prev = lines[i - 1].strip()
                next = lines[i + 1].strip()

                # Check if current line is AMC name (surrounded by blank lines)
                if current and not prev and not next:
                    amc_name = current
                    if amc_name in amc_code_df["amc_name"].values:
                        amc_code = amc_code_df[amc_code_df["amc_name"]
                                               == amc_name]["amc_code"].values[0]
                    else:
                        amc_code = None
                    continue

                # Valid data line: 5 semicolons and an AMC name identified
                if lines[i].count(';') == 5 and amc_name:
                    outfile.write(lines[i].strip() +
                                  f";{amc_name};{amc_code}\n")

        # Read the cleaned CSV file

        df = pd.read_csv(nav_amfi_csv, sep=';')
        df.columns = ['scheme_code', 'isin_1',
                      'isin_2', 'scheme_name', 'nav', 'nav_date', 'amc_name', 'amc_code']

        df = df[['nav_date', 'scheme_code', 'scheme_name',
                 'amc_name', 'amc_code', 'isin_1', 'nav', 'isin_2']]

        df['nav_date'] = pd.to_datetime(
            df['nav_date'], format='%d-%b-%Y').dt.strftime('%Y-%m-%d')
        df['nav'] = df['nav'].replace('N.A.', 0)
        df["amc_code"] = df["amc_code"].astype("Int64")
        df["scheme_code"] = df["scheme_code"].astype(str)

        df['nav'] = pd.to_numeric(df['nav'], errors='coerce')
        df = df.rename(columns={
            'nav_date': 'date',
            'scheme_code': 'scheme_code',
            'scheme_name': 'scheme_name',
            'amc_name': 'amc_name',
            'amc_code': 'amc_code',
            'isin_1': 'isin_1',
            'isin_2': 'isin_2',
            'nav': 'nav'
        })
        df = df[['date', 'scheme_code', 'scheme_name',
                 'amc_code', 'amc_name', 'isin_1', 'isin_2', 'nav']]
        df.to_csv(nav_amfi_csv, index=False)

        existing_objs = MutualFundsEod.objects.in_bulk(
            field_name='scheme_code'
        )

        objects_to_create = []
        objects_to_update = []

        for idx, row in df.iterrows():
            obj = MutualFundsEod(
                scheme_code=row['scheme_code'],
                date=row['date'],
                scheme_name=row['scheme_name'],
                amc_code=row['amc_code'],
                amc_name=row['amc_name'],
                isin=row['isin_1'],
                nav=row['nav']
            )

            if row['scheme_code'] in existing_objs:
                # Needed for bulk_update
                obj.id = existing_objs[row['scheme_code']].id
                objects_to_update.append(obj)
            else:
                objects_to_create.append(obj)

        # Insert new ones
        if objects_to_create:
            with transaction.atomic():
                MutualFundsEod.objects.bulk_create(
                    objects_to_create, batch_size=500)

        # Update existing
        if objects_to_update:
            with transaction.atomic():
                MutualFundsEod.objects.bulk_update(
                    objects_to_update,
                    fields=['date', 'scheme_name', 'amc_code',
                            'amc_name', 'isin', 'nav'],
                    batch_size=500
                )

        os.remove(nav_amfi_txt)
        os.remove(nav_amfi_csv)
        return Response({"message": f"Data successfully downloaded and save to database Created: {len(objects_to_create)} | Updated: {len(objects_to_update)}", "data": []})
    except requests.RequestException as e:
        os.remove(nav_amfi_txt)
        os.remove(nav_amfi_csv)
        return Response({"message": e, "data": []})

def amfi_historical_data(isin, scheme_code, amc_code, period=1825):

    tdate = datetime.now().strftime('%d-%b-%Y')
    fdate = (datetime.now() - timedelta(days=period)).strftime('%d-%b-%Y')

    session = requests.Session()
    data = {
        'mfID': amc_code,
        'scID': scheme_code,
        'fDate': fdate,
        'tDate': tdate
    }
    response = session.post(
        'https://www.amfiindia.com/modules/NavHistoryPeriod', data=data)

    if response.status_code == 200:
        html_content = response.text
        response_file = os.path.join(
            settings.BASE_DIR, "data", "response.html")
        open(response_file, "w").write(html_content)
    else:
        print(f"Failed to retrieve data. Status code: {response.status_code}")
        return

    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        table = soup.find('table', class_='nav-resut-tble')
        rows = table.find_all('tr')

        data = []

        amc_name = rows[1].find_all('th')[0].text.strip()
        scheme_name = rows[3].find_all('th')[0].text.strip()
    except Exception as e:
        print("continued with an error for ", amc_code, scheme_code, isin)
        return

    for row in rows[5:]:
        cells = row.find_all('td')
        if len(cells) > 0:
            nav_value = cells[0].text.strip()
            repurchase_price = cells[1].text.strip() if cells[1] else ""
            sale_price = cells[2].text.strip() if cells[2] else ""
            nav_date = cells[3].text.strip()
            data.append([nav_date, isin, scheme_code,
                        nav_value, scheme_name, amc_name])

    columns = ['date', 'isin', 'scheme_code', 'nav', 'scheme_name', 'amc_name']
    df = pd.DataFrame(data, columns=columns)
    df['date'] = pd.to_datetime(
        df['date'], format='%d-%b-%Y').dt.strftime('%Y-%m-%d')
    df['nav'] = pd.to_numeric(df['nav'], errors='coerce')
    df = df.drop_duplicates(subset=['scheme_code', 'date'])
    df = df.sort_values(by=['scheme_code', 'date']).reset_index(drop=True)
    os.remove(response_file)  # Clean up the temporary HTML file

    # Lookup existing data using composite key (scheme_code, date)
    existing_qs = MutualFundsHistorical.objects.filter(
        scheme_code=scheme_code,
        date__range=[df['date'].min(), df['date'].max()]
    )
    existing_map = {
        (obj.scheme_code, obj.date.strftime('%Y-%m-%d')): obj
        for obj in existing_qs
    }

    objects_to_create = []
    objects_to_update = []

    for _, row in df.iterrows():
        key = (row['scheme_code'], row['date'])
        obj = MutualFundsHistorical(
            date=row['date'],
            scheme_code=row['scheme_code'],
            scheme_name=row['scheme_name'],
            amc_name=row['amc_name'],
            isin=row['isin'],
            nav=row['nav']
        )
        if key in existing_map:
            obj.id = existing_map[key].id
            objects_to_update.append(obj)
        else:
            objects_to_create.append(obj)

    if objects_to_create:
        with transaction.atomic():
            MutualFundsHistorical.objects.bulk_create(
                objects_to_create, batch_size=500)
    if objects_to_update:
        with transaction.atomic():
            MutualFundsHistorical.objects.bulk_update(
                objects_to_update,
                fields=['scheme_name', 'amc_name', 'isin', 'nav'],
                batch_size=500
            )

    msg = (
        f"Historical data for {scheme_code} ({isin}) saved. "
        f"Total records: {len(df)}, Created: {len(objects_to_create)}, Updated: {len(objects_to_update)}"
    )
    return msg

def amfi_historical_fetch(isin, from_date=None, to_date=None):

    data = pd.DataFrame()
    if not isin:
        return "ISIN is required", data

    filter_kwargs = {
        'date__gte': from_date,
        'date__lte': to_date,
        'isin': isin
    }

    if not from_date or not to_date:
        del filter_kwargs['date__gte']
        del filter_kwargs['date__lte']

    try:
        data = MutualFundsHistorical.objects.filter(**filter_kwargs).values()
        
        data = pd.DataFrame(list(data))
        if data.empty:
            return "No data found", data
        
        return "success", data
    
    except Exception as e:
        return str(e), data

def amfi_historical_resampled(isin, from_date=None, to_date=None, frequency='ME'):

    data = pd.DataFrame()

    if frequency not in ['W', 'M', 'Q', 'Y', 'ME']:
        return "Invalid frequency. Use W, M, Q, Y, or ME.", data
    if not isin:
        return "ISIN is required", data

    filter_kwargs = {
        'date__gte': from_date,
        'date__lte': to_date,
        'isin': isin
    }

    if not from_date or not to_date:
        del filter_kwargs['date__gte']
        del filter_kwargs['date__lte']

    data = MutualFundsHistorical.objects.filter(**filter_kwargs).values()
    data = pd.DataFrame(list(data))

    if data.empty:
        return "No data found", data

    df = data.copy()
    df['date'] = pd.to_datetime(df['date'])
    df['nav'] = pd.to_numeric(df['nav'], errors='coerce')

    resampled_data = df.resample(frequency, on='date')
    resampled_data = pd.DataFrame({
        'date': resampled_data['date'].last().index,
        'scheme_code': resampled_data['scheme_code'].first(),
        'scheme_name': resampled_data['scheme_name'].first(),
        'amc_name': resampled_data['amc_name'].first(),
        'isin': resampled_data['isin'].first(),
        'open': resampled_data['nav'].first(),
        'high': resampled_data['nav'].max(),
        'low': resampled_data['nav'].min(),
        'close': resampled_data['nav'].last(),
    })

    resampled_data['open'] = resampled_data['open'].astype(float)
    resampled_data['high'] = resampled_data['high'].astype(float)
    resampled_data['low'] = resampled_data['low'].astype(float)
    resampled_data['close'] = resampled_data['close'].astype(float)
    resampled_data = resampled_data.reset_index(drop=True)
    resampled_data = resampled_data.sort_values(by='date')

    resampled_data['previous_close'] = resampled_data['close'].shift(1)
    resampled_data['change'] = (resampled_data['close'] - resampled_data['previous_close']) / resampled_data['previous_close'] * 100
    resampled_data['change'] = resampled_data['change'].round(2)

    resampled_data.replace([np.inf, -np.inf], np.nan, inplace=True)
    resampled_data = resampled_data.fillna(value=0)

    resampled_data.reset_index(inplace=True)
    resampled_data['date'] = resampled_data['date'].dt.strftime('%Y-%m-%d')

    return "success", resampled_data

def amfi_eod_fetch(amc_name=None, isin=None) -> pd.DataFrame:

    filter_kwargs = {}
    if amc_name:
        filter_kwargs['amc_name'] = amc_name
    if isin:
        filter_kwargs['isin'] = isin

    try:
        mfeod_qs = MutualFundsEod.objects.filter(**filter_kwargs)
        data = pd.DataFrame(columns=[
                            'id', 'date', 'scheme_code', 'scheme_name', 'amc_code', 'amc_name', 'isin', 'nav'])
        data = pd.DataFrame(mfeod_qs.values())
        if data.empty:
            return "No data found", data

        data["date"] = pd.to_datetime(
            data["date"], format="%Y-%m-%d").dt.strftime("%Y-%m-%d")
        data.drop(columns=["id"], inplace=True, errors='ignore')

        return "success", data

    except Exception as e:
        return str(e), data
