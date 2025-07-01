from rest_framework.decorators import api_view
from rest_framework.response import Response
from portfolio.models import PortfolioTransactions, PortfolioHoldings
from marketdata.amfi import amfi_historical_resampled
from marketdata.nse import nse_historical_resampled
import pandas as pd
from datetime import datetime
from django.utils import timezone
from portfolio.utils import xirr
import numpy as np
from datetime import date


@api_view(['POST'])
def portfolio(request):
    client_pan = request.data.get('client_pan')

    summary_data = holding_summary(
        client_pan=client_pan, portfolio="All", asset_class=None)

    holdings = pd.DataFrame(summary_data["holdings"])

    holding_group = holdings[["portfolio"]].drop_duplicates()
    grouped_data = pd.DataFrame()
    for grp_item in holding_group.itertuples():

        group_data = holding_summary(
            client_pan=client_pan, portfolio=grp_item.portfolio)

        group_data = pd.DataFrame([group_data["summary"]])
        grouped_data = pd.concat([group_data, grouped_data], ignore_index=True)

    grouped_data["holding_percentage"] = (
        grouped_data["total_current_value"] / grouped_data["total_current_value"].sum()) * 100
    grouped_data = grouped_data.round(2)
    grouped_data.sort_values(
        by=['holding_percentage'], ascending=False, inplace=True)

    progress_data = []
    progress_data = investment_progress(
        client_pan=client_pan).to_dict(orient='records')
    

    return Response({
        "status": "success",
        "message": "Portfolio API v2",
        "data": {
            "portfolio_summary": grouped_data.to_dict(orient='records'),
            "progress": progress_data,
            "summary": summary_data["summary"],
        }
    })

def holding_summary(client_pan, portfolio="All", asset_class="All", instrument_name="All", folio_id="All"):

    filter = {
        "client_pan": client_pan,
        "portfolio": portfolio,
        "asset_class": asset_class,
        "instrument_name": instrument_name,
        "folio_id": folio_id
    }

    if portfolio == "All":
        filter['portfolio__in'] = [
            "Stocks", "Mutual Fund", "Bank"]
        filter.pop("portfolio")

    if asset_class == "All" or asset_class is None:
        filter.pop("asset_class")

    if instrument_name == "All":
        filter.pop("instrument_name")

    if folio_id == "All":
        filter.pop("folio_id")

    if asset_class != "All" and asset_class is not None:
        filter["asset_class"] = asset_class
        filter.pop("instrument_name", None)

    holdings_qs = PortfolioHoldings.objects.filter(
        **filter).values().order_by('-xirr')
    
    if holdings_qs.count() == 0:
        return {
            "holdings": [],
            "summary": {
                "client_pan": client_pan,
                "portfolio": portfolio,
                "asset_class": asset_class if asset_class else "All",
                "total_investment": 0,
                "total_current_value": 0,
                "pl": 0,
                "plp": 0,
                "benchmark": 0,
                "xirr": 0,
            }
        }
    
    holdings_df = pd.DataFrame(list(holdings_qs))
    holdings_df['current_value'] = holdings_df['current_value'].astype(float)
    holdings_df['holding_value'] = holdings_df['holding_value'].astype(float)

    total_holding_value = holdings_df['holding_value'].sum()
    total_current_value = holdings_df['current_value'].sum()
    total_pl = total_current_value - total_holding_value
    total_plp = (total_pl / total_holding_value *
                 100) if total_holding_value else 0

    filter["balance_units__gt"] = 0
    cash_flow_qs = (PortfolioTransactions.objects
                    .filter(**filter)
                    .order_by('transaction_date'))
    cash_flow_df = pd.DataFrame(list(cash_flow_qs.values(
        'transaction_date', 'holding_value')))
    cash_flow_df['transaction_date'] = pd.to_datetime(
        cash_flow_df['transaction_date'], errors='coerce')
    cash_flow_df['holding_value'] = -cash_flow_df['holding_value']
    cash_flow_df['holding_value'] = cash_flow_df['holding_value'].astype(float)
    cash_flow_df = cash_flow_df[["transaction_date", "holding_value"]]
    cv = total_current_value if total_current_value else 0
    cvd = datetime.now()
    cash_flow_df = pd.concat([cash_flow_df, pd.DataFrame(
        [[cvd, cv]], columns=["transaction_date", "holding_value"])], ignore_index=True)
    cash_flow_df = cash_flow_df.sort_values(by='transaction_date')

    try:
        xirr_result = xirr(
            cash_flow_df['holding_value'], cash_flow_df['transaction_date'])
        xirr_value = xirr_result * 100 if xirr_result is not None else 0
    except Exception as e:
        xirr_value = 0

    total_xirr = xirr_value if xirr_value is not None else 0

    return {
        "holdings": holdings_df.to_dict(orient='records'),
        "summary": {
            "client_pan": client_pan,
            "portfolio": portfolio,
            "asset_class": asset_class if asset_class else "All",
            "total_investment": total_holding_value,
            "total_current_value": total_current_value,
            "pl": total_pl,
            "plp": total_plp,
            "benchmark": 0,
            "xirr": total_xirr,
        }
    }

def investment_progress(client_pan, portfolio="All", asset_class="All", instrument_name="All") -> pd.DataFrame:

    filter = {
        "client_pan": client_pan,
        "portfolio": portfolio,
        "asset_class": asset_class,
        "instrument_name": instrument_name
    }

    if portfolio == "All":
        filter['portfolio__in'] = ["Stocks", "Mutual Fund", "Bank"]
        filter.pop("portfolio")

    if asset_class == "All":
        filter.pop("asset_class")

    if instrument_name == "All" or instrument_name is None:
        filter.pop("instrument_name") if "instrument_name" in filter else None

    if asset_class != "All" and asset_class is not None:
        filter["asset_class"] = asset_class
        filter.pop("instrument_name", None)

    txn = PortfolioTransactions.objects.filter(
        **filter).order_by('transaction_date').values()
    txn_df = pd.DataFrame(list(txn))

    if txn_df.empty:
        return pd.DataFrame()

    start_date = txn_df['transaction_date'].min()
    end_date = timezone.now().date() + pd.DateOffset(months=1)
    date_series = pd.date_range(start=start_date, end=end_date, freq='ME')

    txn_df['transaction_date'] = pd.to_datetime(
        txn_df['transaction_date'], errors='coerce')
    progress_data = []
    for tdate in date_series:
        month_data = txn_df[txn_df['transaction_date'] <= tdate]

        month_data_grouped = month_data.groupby(['portfolio', 'asset_class', 'instrument_id']).agg({
            'units': 'sum',
            'amount': 'sum'
        }).reset_index()
        month_data_grouped['transaction_date'] = tdate
        month_data_grouped['units'] = month_data_grouped['units'].astype(float)
        month_data_grouped['amount'] = month_data_grouped['amount'].astype(
            float)
        month_data_grouped = month_data_grouped.round(2)
        progress_data.append(month_data_grouped)

    progress_df = pd.concat(progress_data, ignore_index=True)
    progress_df = progress_df[progress_df['units'] > 0]
    progress_df['transaction_date'] = pd.to_datetime(
        progress_df['transaction_date'], errors='coerce')
    progress_df["year_month"] = progress_df["transaction_date"].dt.to_period(
        'M')
    progress_df["current_value"] = 0.0
    progress_df["benchmark_value"] = 0.0

    # insurance = cv_insurance(progress_df[progress_df["portfolio"] == "Insurance"])
    equity = cv_equity(progress_df[progress_df["portfolio"] == "Stocks"])
    mutual_fund = cv_mf(progress_df[progress_df["portfolio"] == "Mutual Fund"])

    progress_df = pd.concat(
        [equity, mutual_fund], ignore_index=True)

    progress_df['equity_amount'] = np.where(
        progress_df['asset_class'] == 'Equity', progress_df['amount'], 0)
    progress_df['equity_current_value'] = np.where(
        progress_df['asset_class'] == 'Equity', progress_df['current_value'], 0)
    progress_df['debt_amount'] = np.where(
        progress_df['asset_class'] == 'Debt', progress_df['amount'], 0)
    progress_df['debt_current_value'] = np.where(
        progress_df['asset_class'] == 'Debt', progress_df['current_value'], 0)

    progress_df = progress_df.groupby(['transaction_date']).agg({
        'amount': 'sum',
        'current_value': 'sum',
        'equity_amount': 'sum',
        'equity_current_value': 'sum',
        'debt_amount': 'sum',
        'debt_current_value': 'sum',
        'benchmark_value': 'sum',
    }).reset_index()

    progress_df = progress_df[progress_df['current_value'] > 0]

    progress_df['equity_holding_percentage'] = (
        progress_df['equity_current_value'] /
        progress_df['current_value'] * 100
    ).fillna(0)
    progress_df['debt_holding_percentage'] = (
        progress_df['debt_current_value'] / progress_df['current_value'] * 100
    ).fillna(0)

    progress_df["investment"] = progress_df["amount"] - \
        progress_df["amount"].shift(1).fillna(0)
    progress_df["investment"] = -progress_df["investment"]

    progress_df.rename(columns={'amount': 'invested_value'}, inplace=True)
    progress_df['pl'] = progress_df['current_value'] - \
        progress_df['invested_value']
    progress_df['plp'] = progress_df.apply(
        lambda row: (row['pl'] / row['invested_value'] * 100) if row['invested_value'] != 0 else 0, axis=1)

    # Set initial values for pre-2023 data
    progress_df.loc[progress_df['transaction_date'] < '2023-01-01', 'plp'] = 0

    progress_df['peak'] = progress_df['plp'].cummax()
    progress_df['drawdown'] = progress_df['plp'] - progress_df['peak']
    progress_df['xirr'] = 0
    progress_df = progress_df.round(2)
    progress_df['portfolio'] = portfolio
    progress_df['asset_class'] = asset_class
    progress_df['instrument_name'] = instrument_name
    progress_df['client_pan'] = client_pan

    progress_df = progress_df[['client_pan', 'portfolio', 'asset_class', 'instrument_name', 'transaction_date',
                               'invested_value', 'current_value', 'investment', 'pl', 'plp',
                               'equity_amount', 'equity_current_value', 'equity_holding_percentage',
                               'debt_amount', 'debt_current_value', 'debt_holding_percentage',
                               'benchmark_value', 'peak', 'drawdown', 'xirr']]
    return progress_df

@api_view(['POST'])
def investment_progress_yearly(request):
    client_pan = request.data.get('client_pan')
    portfolio = request.data.get('portfolio', "All")

    filter = {
        "client_pan": client_pan,
        "portfolio": portfolio,
    }

    if portfolio == "All":
        filter['portfolio__in'] = ["Equity", "Mutual Fund"]
        filter.pop("portfolio")

    holdings_qs = PortfolioHoldings.objects.filter(**filter).values()



    instruments = pd.DataFrame(list(holdings_qs))["instrument_id"].unique()
    holdings = pd.DataFrame(holdings_qs)

    if len(instruments) == 0:
        return Response({
            "status": "error",
            "message": "No holdings found for the given client PAN and portfolio."
        })

    txn = PortfolioTransactions.objects.filter(
        **filter,
        instrument_id__in=instruments
    ).order_by('transaction_date').values("transaction_date", 'instrument_id', "units", "amount")

    txn_df = pd.DataFrame(list(txn))
    if txn_df.empty:
        return pd.DataFrame()

    txn_df = txn_df.copy()
    txn_df['transaction_date'] = pd.to_datetime(txn_df['transaction_date'])
    txn_df['cash_flow'] = -txn_df['amount'].astype(float)
    txn_df.set_index('transaction_date', inplace=True)

    cv = (
        txn_df
        .groupby([pd.Grouper(freq='Y'), 'instrument_id'])
        .agg({'cash_flow': 'sum', 'units': 'sum'})
        .reset_index()
    )
    cv = pd.merge(cv, holdings[['instrument_id', 'current_price']], on='instrument_id', how='left')
    cv['cash_flow'] = cv['units'] * cv['current_price'].fillna(0)
    cv['transaction'] = "Current Value"

    txn_df = txn_df.reset_index()  # bring back transaction_date
    txn_df['transaction'] = "Investment"

    cv = cv[['transaction_date', 'instrument_id', 'transaction', 'cash_flow']]
    txn_df = txn_df[['transaction_date', 'instrument_id', 'transaction', 'cash_flow']]

    combined = pd.concat([cv, txn_df], ignore_index=True)
    today = pd.to_datetime(date.today())
    combined['year'] = combined['transaction_date'].dt.year
    combined.loc[combined['transaction'] == 'Current Value', 'transaction_date'] = today

    cv = combined.copy()

    # data = cv[['instrument_id', 'year']].drop_duplicates()
    data = cv[['year']].drop_duplicates()
    xirr_data = []

    for _, row in data.iterrows():
        # cash_flow = cv[(cv['instrument_id'] == row['instrument_id']) & (cv['year'] == row['year'])]
        cash_flow = cv[cv['year'] == row['year']]
        if not cash_flow.empty:
            cash_flow = cash_flow[['transaction_date', 'cash_flow']].sort_values(by='transaction_date')
            if len(cash_flow) > 1:
                try:
                    xirr_value = xirr(cash_flow['cash_flow'], cash_flow['transaction_date'])
                    xirr_value = xirr_value * 100 if xirr_value is not None else 0
                except Exception as e:
                    xirr_value = 0
            else:
                xirr_value = 0

            xirr_data.append({
                # 'instrument_id': row['instrument_id'],
                'year': row['year'],
                'xirr': xirr_value
            })
    
    xirr_df = pd.DataFrame(xirr_data)
    if xirr_df.empty:
        return Response({
            "status": "error",
            "message": "No XIRR data available for the given client PAN and portfolio."
        })

    xirr_df = xirr_df.round(2)    

    return Response({
        "status": "success",
        "message": "Yearly Investment Progress",
        "data": xirr_df.to_dict(orient='records')
    })

def cv_mf(data: pd.DataFrame) -> pd.DataFrame:
    if data.empty:
        return data
    isins = data['instrument_id'].unique()
    nav_rows = []

    for isin in isins:
        message, nav = amfi_historical_resampled(
            isin=isin, frequency="ME")
        
        if isinstance(nav, pd.DataFrame) and not nav.empty and 'close' in nav.columns and 'date' in nav.columns:
            nav['date'] = pd.to_datetime(nav['date'], errors='coerce')
            nav['close'] = pd.to_numeric(nav['close'], errors='coerce')
            nav.rename(columns={'date': 'transaction_date',
                       'isin': 'instrument_id'}, inplace=True)

            nav = nav[['transaction_date', 'instrument_id', 'close']].dropna(subset=[
                                                                             'transaction_date'])
            nav_rows.append(nav)

    nav_all = pd.concat(nav_rows, ignore_index=True)
    mf = pd.merge(data, nav_all, on=[
        "instrument_id", "transaction_date"], how="left")
    mf['current_value'] = mf['units'] * mf['close'].fillna(0)
    mf = mf.round(2)
    mf["close"].dropna(inplace=True)

    return mf

def cv_equity(data: pd.DataFrame) -> pd.DataFrame:
    if data.empty:
        return data
    symbols = data['instrument_id'].unique()
    close_rows = []

    for symbol in symbols:
        message, equity_df = nse_historical_resampled(symbol=symbol, period=1825, frequency="ME")

        if isinstance(equity_df, pd.DataFrame) and not equity_df.empty and 'close' in equity_df.columns and 'date' in equity_df.columns:
            equity_df['date'] = pd.to_datetime(
                equity_df['date'], errors='coerce')
            equity_df['close'] = pd.to_numeric(
                equity_df['close'], errors='coerce')
            equity_df.rename(columns={'date': 'transaction_date',
                                      'symbol': 'instrument_id'}, inplace=True)

            equity_df = equity_df[['transaction_date', 'instrument_id', 'close']].dropna(subset=[
                'transaction_date'])
            close_rows.append(equity_df)

    close_all = pd.concat(close_rows, ignore_index=True)
    equity = pd.merge(data, close_all, on=[
        "instrument_id", "transaction_date"], how="left")
    equity['current_value'] = equity['units'] * equity['close'].fillna(0)
    equity = equity.round(2)
    equity["close"].dropna(inplace=True)
    equity["current_value"] = np.where(
        equity["current_value"] == 0, equity["amount"], equity["current_value"])
    return equity