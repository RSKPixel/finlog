from django.db import models

class PortfolioTransactions(models.Model):
    id = models.AutoField(primary_key=True)
    client_pan = models.CharField(max_length=12, db_index=True)
    portfolio = models.CharField(max_length=50)
    asset_class = models.CharField(max_length=50)
    folio_id = models.CharField(max_length=50, blank=True, null=True)
    folio_name = models.CharField(max_length=100, blank=True, null=True)
    instrument_id = models.CharField(max_length=50)
    instrument_name = models.CharField(max_length=100)
    transaction_date = models.DateField(blank=True, null=True)
    transaction_id = models.CharField(max_length=50, blank=True, null=True)
    transaction_type = models.CharField(max_length=20)
    amount = models.FloatField(blank=True, null=True)
    units = models.FloatField(blank=True, null=True)
    unit_price = models.FloatField(blank=True, null=True)
    balance_units = models.FloatField(blank=True, null=True)
    holding_value = models.FloatField(blank=True, null=True)
    goalpot = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'portfolio_transactions'
        managed = True


class PortfolioHoldings(models.Model):
    id = models.AutoField(primary_key=True)
    client_pan = models.CharField(max_length=12, db_index=True)
    portfolio = models.CharField(max_length=50)
    asset_class = models.CharField(max_length=50)
    folio_id = models.CharField(max_length=50, blank=True, null=True)
    folio_name = models.CharField(max_length=100, blank=True, null=True)
    instrument_id = models.CharField(max_length=50)
    instrument_name = models.CharField(max_length=100)
    holding_value = models.FloatField(blank=True, null=True)
    holding_units = models.FloatField(blank=True, null=True)
    holding_price = models.FloatField(blank=True, null=True)
    current_value = models.FloatField(blank=True, null=True)
    pl = models.FloatField(blank=True, null=True)
    plp = models.FloatField(blank=True, null=True)
    cagr = models.FloatField(blank=True, null=True)
    xirr = models.FloatField(blank=True, null=True)
    current_price_date = models.DateField(blank=True, null=True)
    current_price = models.FloatField(blank=True, null=True)
    goalpot = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'portfolio_holdings'
        managed = True

class FixedIncome(models.Model):
    id = models.AutoField(primary_key=True)
    client_pan = models.CharField(max_length=12, db_index=True)
    portfolio = models.CharField(max_length=50)
    asset_class = models.CharField(max_length=50)
    instrument_id = models.CharField(max_length=50)
    instrument_name = models.CharField(max_length=100)
    folio_id = models.CharField(max_length=50, blank=True, null=True)
    folio_name = models.CharField(max_length=100, blank=True, null=True)
    invested_amount = models.FloatField(blank=True, null=True)
    interest_rate = models.FloatField(blank=True, null=True)
    compunding_frequency = models.CharField(max_length=20, blank=True, null=True)
    date_of_investment = models.DateField(blank=True, null=True)
    maturity_date = models.DateField(blank=True, null=True)
    interest_payout = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'fixed_income'
        managed = True

class Insurance(models.Model):
    id = models.AutoField(primary_key=True)
    client_pan = models.CharField(max_length=10, blank=True, null=True)
    policy_name = models.CharField(max_length=100, blank=True, null=True)
    policy_no = models.CharField(max_length=50, blank=True, null=True)
    policy_type = models.CharField(max_length=50, blank=True, null=True)
    insurer = models.CharField(max_length=100, blank=True, null=True)
    date_of_commencement = models.DateField(blank=True, null=True)
    date_of_last_premium = models.DateField(blank=True, null=True)
    date_of_maturity = models.DateField(blank=True, null=True)
    premium_amount = models.FloatField(blank=True, null=True)
    sum_assured = models.FloatField(blank=True, null=True)
    frequency = models.CharField(max_length=50, blank=True, null=True)
    agent_name = models.CharField(max_length=100, blank=True, null=True)
    policy_status = models.CharField(max_length=50, blank=True, null=True)
    total_premium_paid = models.FloatField(blank=True, null=True)
    current_value = models.FloatField(blank=True, null=True)
    remarks = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'insurance'
        managed = True