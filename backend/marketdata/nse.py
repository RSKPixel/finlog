from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
from django.conf import settings
import pandas as pd
import os
from io import StringIO
from datetime import datetime, timedelta
from marketdata.models import NSEEod, NSEEodHistorical
import numpy as np
import time


@api_view(['GET'])
def nse_download_eod(request):
    data_fetched = False
    offset = 0

    while not data_fetched:
        try:
            bhavdate = (datetime.now() - timedelta(days=offset)).strftime('%d%m%Y')
            link = f'https://nsearchives.nseindia.com/products/content/sec_bhavdata_full_{bhavdate}.csv'
            securities = 'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv'

            request_session = requests.Session()
            request_session.headers.update(
                {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36"})
            request_session.get("https://www.nseindia.com/")

            response = request_session.get(link)
            response.raise_for_status()
            data = StringIO(response.text)
            response.close()
            response = request_session.get(securities)
            response.raise_for_status()
            securities = StringIO(response.text)
            response.close

            df_securities = pd.read_csv(securities)
            df_securities.rename(columns={"NAME OF COMPANY": "NAME"}, inplace=True)  # Rename for easier access
            securities_save = os.path.join(settings.BASE_DIR, f'data/securities.csv')
            df_securities.to_csv(securities_save, index=False)

            df = pd.read_csv(data)
            df.columns = df.columns.str.strip()
            df = df.map(lambda x: x.strip() if isinstance(x, str) else x)

            df = df[((df['SERIES'] == 'EQ') | (df['SERIES'] == 'GB'))]
            df = df[['SYMBOL', 'DATE1', 'PREV_CLOSE','OPEN_PRICE','HIGH_PRICE','LOW_PRICE','CLOSE_PRICE']]
            df.columns = ['symbol', 'trade_date', 'prev_close', 'open', 'high', 'low', 'close']
            df["trade_date"] = pd.to_datetime(
                df["trade_date"], format='%d-%b-%Y').dt.strftime('%Y-%m-%d')
            df["prev_close"] = pd.to_numeric(df["prev_close"], errors='coerce')
            df["open"] = pd.to_numeric(df["open"], errors='coerce')
            df["high"] = pd.to_numeric(df["high"], errors='coerce')
            df["low"] = pd.to_numeric(df["low"], errors='coerce')
            df["close"] = pd.to_numeric(df["close"], errors='coerce')
            df = df.dropna(subset=['symbol', 'trade_date', 'prev_close', 'open', 'high', 'low', 'close'])
            df["symbol"] = df["symbol"].str.strip()
            df["name"] = df["symbol"].map(df_securities.set_index("SYMBOL")["NAME"])

            existing_qs = NSEEod.objects.in_bulk(
                field_name='symbol',
            )

            objects_to_create = []
            objects_to_update = []

            for index, row in df.iterrows():
                obj = NSEEod(
                    symbol=row['symbol'],
                    trade_date=row['trade_date'],
                    prev_close=row['prev_close'],
                    open=row['open'],
                    high=row['high'],
                    low=row['low'],
                    close=row['close'],
                    name=row['name']
                )

                if row['symbol'] in existing_qs:
                    obj.id = existing_qs[row['symbol']].id
                    objects_to_update.append(obj)
                else:
                    objects_to_create.append(obj)

            if objects_to_create:
                NSEEod.objects.bulk_create(objects_to_create, batch_size=500)
            if objects_to_update:
                NSEEod.objects.bulk_update(objects_to_update, 
                                           fields=['trade_date', 'prev_close', 'open', 'high', 'low', 'close', 'name'],
                                           batch_size=500)
            data_fetched = True
        except Exception as e:
            print(f"Failed to fetch data for {bhavdate}. Error: {e}")
            offset += 1

    return Response({'message': f'EOD data fetched successfully for {bhavdate}. {len(objects_to_create)} created | {len(objects_to_update)} updated', "data":{}})

def nse_eod_fetch():
    data = pd.DataFrame()
    try:
        data = NSEEod.objects.all().values()
        data = pd.DataFrame(list(data))
        data['trade_date'] = pd.to_datetime(data['trade_date'], errors='coerce').dt.date

        return 'EOD data fetched successfully', data
    except Exception as e:
        return  f'Error fetching EOD data: {str(e)}', data
