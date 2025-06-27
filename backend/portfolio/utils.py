from django.db import transaction
import pandas as pd
from django.db.models import Sum, F, Func
from portfolio.models import PortfolioTransactions, PortfolioHoldings
from datetime import datetime
from scipy.optimize import newton
import requests
from decimal import Decimal
from scipy.optimize import brentq



@transaction.atomic
def update_holdings_xirr(client_pan, portfolio):

    portfolio_holdings_qs = PortfolioHoldings.objects.filter(
        client_pan=client_pan, portfolio=portfolio
    ).all()

    for item in portfolio_holdings_qs:
        cash_flow_qs = PortfolioTransactions.objects.filter(
            client_pan=item.client_pan,
            folio_id=item.folio_id,
            instrument_id=item.instrument_id,
            balance_units__gt=0
        ).order_by('transaction_date')

        cv = item.current_value if item.current_value else 0
        cvd = datetime.now()

        cash_flow_df = pd.DataFrame(list(cash_flow_qs.values()))
        cash_flow_df['transaction_date'] = pd.to_datetime(cash_flow_df['transaction_date'], errors='coerce')
        cash_flow_df['holding_value'] = -cash_flow_df['holding_value']
        cash_flow_df['holding_value'] = cash_flow_df['holding_value'].astype(float)
        cash_flow_df = cash_flow_df[["transaction_date", "holding_value"]]
        
        
        cash_flow_df = pd.concat([cash_flow_df, pd.DataFrame(
            [[cvd, cv]], columns=["transaction_date", "holding_value"])], ignore_index=True)
        cash_flow_df = cash_flow_df.sort_values(by='transaction_date')
        cash_flow_df['holding_value'] = cash_flow_df['holding_value'].astype(float)

        try:
            xirr_result = xirr(
                cash_flow_df['holding_value'],
                cash_flow_df['transaction_date']
            )
            item.xirr = xirr_result * 100 if xirr_result is not None else 0
        except Exception as e:
            item.xirr = 0
            print(f"Error calculating XIRR for {item.instrument_id}: {e}")

        item.pl = float(item.current_value) - float(item.holding_value)
        item.plp = (item.pl / item.holding_value * 100) if item.holding_value else 0
        item.cagr = 0
        item.save()

    return

@transaction.atomic
def update_holdings(client_pan, portfolio):
    transactions = PortfolioTransactions.objects.filter(
        client_pan=client_pan, portfolio=portfolio, balance_units__gt=0)

    transactions = (transactions
                    .values("client_pan", "portfolio", "asset_class",
                            "folio_id", "folio_name", "instrument_id", "instrument_name")
                    .annotate(
                        sum_holding_units=Sum('balance_units'),
                        sum_holding_value=Sum('holding_value'),
                        holding_price=Sum('holding_value') /
                        Sum('balance_units'),
                    ))

    holdings_data = pd.DataFrame(list(transactions))
    holdings_data = holdings_data.round(2)

    for _, row in holdings_data.iterrows():
        PortfolioHoldings.objects.update_or_create(
            client_pan=row['client_pan'],
            portfolio=row['portfolio'],
            asset_class=row['asset_class'],
            folio_id=row['folio_id'],
            folio_name=row['folio_name'],
            instrument_id=row['instrument_id'],
            instrument_name=row['instrument_name'],
            defaults={
                'holding_units': row['sum_holding_units'],
                'holding_value': row['sum_holding_value'],
                'holding_price': row['holding_price'],
            }
        )

    return

@transaction.atomic
def fifo(client_pan, folio_id, instrument_id):
    transactions = PortfolioTransactions.objects.filter(
        client_pan=client_pan,
        folio_id=folio_id,
        instrument_id=instrument_id
    ).order_by('transaction_date')

    for i in range(len(transactions)):
        if transactions[i].units < 0:
            sell_units = abs(transactions[i].units)

            for x in range(i):
                if sell_units == 0:
                    break

                if transactions[x].balance_units == 0:
                    continue

                if transactions[x].balance_units >= sell_units:
                    transactions[x].balance_units = round(
                        transactions[x].balance_units - sell_units, 3)
                    sell_units = 0
                else:
                    sell_units = round(
                        sell_units - transactions[x].balance_units, 3)
                    transactions[x].balance_units = 0

            if sell_units == 0:
                transactions[i].balance_units = 0
            else:
                print(instrument_id, folio_id, client_pan,
                      "Error: Not enough units to sell", transactions[i].units)

    for record in transactions:
        record.save()

    PortfolioTransactions.objects.filter(
        client_pan=client_pan,
        folio_id=folio_id,
        instrument_id=instrument_id).update(
            holding_value=Func(
                F("balance_units") * F("unit_price"),
                function="ROUND",
                template="ROUND(%(expressions)s, 2)"
            )
    )
    return

def xirr(cashflows, dates):
    """Compute XIRR using Brent’s method for stability."""
    
    if len(set(dates)) == 1:  # All dates are the same, invalid for XIRR
        return None
    if not (any(cf < 0 for cf in cashflows) and any(cf > 0 for cf in cashflows)):  # Must have inflow & outflow
        return None

    # Convert cashflows to Decimal for precision
    cashflows = [Decimal(cf) for cf in cashflows]

    # Ensure dates are datetime objects
    dates = [d if isinstance(d, datetime) else datetime.strptime(d, "%Y-%m-%d") for d in dates]

    def npv(rate):
        """Net Present Value function used in Brent’s method."""
        return sum(float(cf) / ((1 + rate) ** ((d - dates[0]).days / 365.0)) for cf, d in zip(cashflows, dates))

    try:
        return brentq(npv, -0.9999, 10.0)  # Search for the root in a wide range
    except ValueError:
        return None  # No valid root found

def marketdata_api_request(url) -> pd.DataFrame: 
    try:
        response = requests.get(url)
        if response.status_code == 200:
            json_data = response.json()
            json_data = json_data.get("data", [])
            return pd.DataFrame(json_data), response.status_code, "Success"
        else:
            return pd.DataFrame(), response.status_code, f"Error: {response.status_code} - {response.text}"
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None, response.status_code, f"Request failed: {e}"
   
