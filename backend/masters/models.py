from django.db import models

class Ledger(models.Model):
    id = models.AutoField(primary_key=True)
    client_pan = models.CharField(max_length=10, blank=True, null=True)
    ledger_name = models.CharField(max_length=100, unique=True)
    ledger_type = models.CharField(max_length=50, blank=True, null=True)
    instrument_id = models.CharField(max_length=50, blank=True, null=True)
    folio_number = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'ledger'
        managed = True
    
class LedgerTypes(models.Model):
    id = models.AutoField(primary_key=True)
    ledger_type = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'ledger_types'
        managed = True