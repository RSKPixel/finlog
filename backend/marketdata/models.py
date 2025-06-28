from django.db import models

# Create your models here.
class MutualFundsEod(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.DateField(blank=True, null=True)
    scheme_code = models.CharField(max_length=20, blank=True, null=True, unique=True)
    scheme_name = models.CharField(max_length=255, blank=True, null=True)
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
        unique_together = ('scheme_code', 'date')  # or use UniqueConstraint in Django 2.2+
        managed = True

