from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
from django.conf import settings
import pandas as pd
import os
from io import StringIO
from datetime import datetime, timedelta
from marketdata.models import NSEEod, NSEEodHistorical
from portfolio.models import PortfolioTransactions
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

@api_view(['GET'])
def nse_historical_download(request):

    symbols = request.GET.getlist('symbol')
    period = request.GET.get('period', 365)
    period = int(period)

    if not symbols:
        symbols = NSEEodHistorical.objects.values_list('symbol', flat=True).distinct()
        symbols_holdings = PortfolioTransactions.objects.filter(portfolio='Stocks').values_list('instrument_id', flat=True).distinct()

        symbols = set(symbols) | set(symbols_holdings)
        symbols = list(symbols)
        period = 10

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        "Accept": "text/csv, application/csv, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.nseindia.com/market-data/historical-data",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "DNT": "1",
        "X-Requested-With": "XMLHttpRequest"
    }

    message = []
    range = f"{datetime.now().date() - timedelta(days=period)} to {datetime.now().date()}"

    for symbol in symbols:
        symbol = symbol.strip()
        from_date = datetime.now().date()
        to_date = datetime.now().date()
        balance_period = period

        while balance_period > 0:
            to_date = from_date
            from_date = from_date - timedelta(days=balance_period if balance_period < 365 else 365)
            balance_period -= 365 if balance_period >= 365 else balance_period

            url = f"https://www.nseindia.com/api/historicalOR/generateSecurityWiseHistoricalData?from={from_date.strftime('%d-%m-%Y')}&to={to_date.strftime('%d-%m-%Y')}&symbol={symbol}&type=priceVolume&series=ALL&csv=true"
            try:
                response = requests.get(url, headers=headers)
                response.raise_for_status()

                data = StringIO(response.text)
                df = pd.read_csv(data, encoding='utf-8',thousands=",")
                df.columns = ["symbol", "series", "date", "prev_colose", "open", "high", "low", "last", "close", "vwap", "total_traded_qty", "total_traded_value", "total_trades"]
                df = df[['symbol', 'date', 'open', 'high', 'low', 'close', 'last']]
                
                df['date'] = pd.to_datetime(df['date'], format='%d-%b-%Y').dt.strftime('%Y-%m-%d')
                for _, row in df.iterrows():
                    obj, created = NSEEodHistorical.objects.update_or_create(
                        symbol=row['symbol'],
                        date=row['date'],
                        defaults={
                            'open': row['open'],
                            'high': row['high'],
                            'low': row['low'],
                            'close': row['close'],
                            'last': row['last']
                        }
                    )
            

            except Exception as e:
                print(f"Error fetching historical data for {symbol} from {from_date} to {to_date}: {e}")
                continue

        message.append(f"Downloaded historical data for {symbol} from {from_date - timedelta(period)} to {to_date}")

    return Response({'status': 'success', 'message': list(message), 'data': []})


def nse_eod_fetch():
    data = pd.DataFrame()
    try:
        data = NSEEod.objects.all().values()
        data = pd.DataFrame(list(data))
        data['trade_date'] = pd.to_datetime(data['trade_date'], errors='coerce').dt.date

        return 'EOD data fetched successfully', data
    except Exception as e:
        return  f'Error fetching EOD data: {str(e)}', data

def nse_historical_resampled(symbol, period=365, frequency='ME'):
    period = int(period) if period else 365

    from_date = datetime.now() - timedelta(days=period)
    from_date = from_date.strftime('%Y-%m-%d')
    to_date = datetime.now().strftime('%Y-%m-%d')

    if not symbol:
        return Response({"message": "Symbol is required", "data": []})
    filter_kwargs = {
        'date__gte': from_date,
        'date__lte': to_date,
        'symbol': symbol
    }

    if frequency not in ['W', 'M', 'Q', 'Y', 'ME']:
        return "Invalid frequency. Use W, M, Q, Y, or ME.", pd.DataFrame()

    data = NSEEodHistorical.objects.filter(**filter_kwargs).values()
    if not data:
        return "No data found", pd.DataFrame()

    df = pd.DataFrame(list(data))
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)

    resampled_data = df.resample('ME').agg({
        'symbol': 'first',      # or 'last' if more appropriate
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
    }).reset_index()

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
    resampled_data = resampled_data[['date', 'symbol', 'open', 'high', 'low', 'close', 'previous_close', 'change']]

    return "Data fetched successfully",resampled_data

def nse_historical_fetch(symbol, period=365):
    period = int(period)
    if not symbol:
        return Response({'message': 'Symbol parameter is required', "status": "error", "data": []})
    if period <= 0:
        return Response({'message': 'Period must be a positive integer', "status": "error", "data": []})
    from_date = datetime.now() - timedelta(days=period)
    from_date = from_date.strftime('%Y-%m-%d')
    to_date = datetime.now().strftime('%Y-%m-%d')

    filter_params = {
        'symbol': symbol,
        'date__gte': from_date,
        'date__lte': to_date
    }

    try:
        data = NSEEodHistorical.objects.filter(**filter_params).values().order_by('date')
        if not data:
            return 'No historical data found for the given symbol and period',pd.DataFrame()
        
        data = pd.DataFrame(list(data))
        data = data[['symbol', 'date', 'open', 'high', 'low', 'close']]
        return 'Historical data fetched successfully', data
    except Exception as e:
        return f'Error fetching historical data: {str(e)}', pd.DataFrame()
