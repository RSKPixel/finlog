from django.db import models


class LedgerMaster(models.Model):
    id = models.AutoField(primary_key=True)
    client_pan = models.CharField(max_length=10, blank=True, null=True)
    ledger_name = models.CharField(max_length=100, unique=True)
    ledger_ref_no = models.CharField(max_length=50, blank=True, null=True)
    ledger_group = models.CharField(max_length=50, blank=True, null=True)
    folio_no = models.CharField(max_length=50, blank=True, null=True)
    folio_name = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'ledger_master'
        managed = True


class LedgerGroups(models.Model):
    id = models.AutoField(primary_key=True)
    ledger_group = models.CharField(max_length=50, unique=True)
    ledger_nature = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'ledger_groups'
        managed = True
