from django.db import models

# Create your models here.


class MutualFundsEod(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.DateField(blank=True, null=True)
    scheme_code = models.CharField(
        max_length=20, blank=True, null=True, unique=True)
    scheme_name = models.CharField(max_length=255, blank=True, null=True)
    asset_class = models.CharField(max_length=50, blank=True, null=True)
    scheme_type = models.CharField(max_length=50, blank=True, null=True)
    amc_code = models.CharField(max_length=20, blank=True, null=True)
    amc_name = models.CharField(max_length=255, blank=True, null=True)
    isin = models.CharField(max_length=20, blank=True, null=True)
    nav = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = 'mutualfunds_eod'
        managed = True


class MutualFundsHistorical(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.DateField(blank=True, null=True)
    scheme_code = models.CharField(max_length=20, blank=True, null=True)
    isin = models.CharField(max_length=20, blank=True, null=True)
    scheme_name = models.CharField(max_length=255, blank=True, null=True)
    amc_name = models.CharField(max_length=255, blank=True, null=True)
    nav = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = 'mutualfunds_historical'
        # or use UniqueConstraint in Django 2.2+
        unique_together = ('scheme_code', 'date')
        managed = True


class NSEEod(models.Model):
    id = models.AutoField(primary_key=True)
    trade_date = models.DateField(blank=True, null=True)
    symbol = models.CharField(
        max_length=20, blank=True, null=True, unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    prev_close = models.FloatField(blank=True, null=True)
    open = models.FloatField(blank=True, null=True)
    high = models.FloatField(blank=True, null=True)
    low = models.FloatField(blank=True, null=True)
    close = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = 'nse_eod'
        # or use UniqueConstraint in Django 2.2+
        unique_together = ('symbol', 'trade_date')
        managed = True


class NSEEodHistorical(models.Model):
    id = models.AutoField(primary_key=True)
    symbol = models.CharField(max_length=20, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    open = models.FloatField(blank=True, null=True)
    high = models.FloatField(blank=True, null=True)
    low = models.FloatField(blank=True, null=True)
    close = models.FloatField(blank=True, null=True)
    last = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = 'nse_historical'
        managed = True
