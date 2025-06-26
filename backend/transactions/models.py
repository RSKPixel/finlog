from django.db import models

# Create your models here.


class BankStatement(models.Model):
    id = models.AutoField(primary_key=True)
    client_pan = models.CharField(max_length=10, blank=True, null=True)
    ledger_name = models.CharField(max_length=100, blank=True, null=True)
    ledger_group = models.CharField(max_length=50, blank=True, null=True)
    transaction_date = models.DateField(blank=True, null=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    ref_no = models.CharField(max_length=50, blank=True, null=True)
    debit = models.FloatField(blank=True, null=True)
    credit = models.FloatField(blank=True, null=True)
    balance = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = 'bank_statement'
        managed = True
