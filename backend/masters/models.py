from django.db import models


class LedgerMaster(models.Model):
    id = models.AutoField(primary_key=True)
    client_pan = models.CharField(max_length=10, blank=True, null=True)
    ledger_name = models.CharField(max_length=100, unique=True)
    ledger_ref_no = models.CharField(max_length=50, blank=True, null=True)
    ledger_group = models.CharField(max_length=50, blank=True, null=True)

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

class InsuranceMaster(models.Model):
    id = models.AutoField(primary_key=True)
    client_pan = models.CharField(max_length=10, blank=True, null=True)
    insurance_policy_name = models.CharField(max_length=100, blank=True, null=True)
    insurance_policy_number = models.CharField(max_length=50, blank=True, null=True)
    insurance_company_name = models.CharField(max_length=100, blank=True, null=True)
    insurance_date_of_commencement = models.DateField(blank=True, null=True)
    insurance_date_of_last_premium = models.DateField(blank=True, null=True)
    insurance_date_of_maturity = models.DateField(blank=True, null=True)
    insurance_premium_amount = models.FloatField(blank=True, null=True)
    insurance_sum_assured = models.FloatField(blank=True, null=True)
    insurance_premium_frequency = models.CharField(max_length=50, blank=True, null=True)
    insurance_agent_name = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'insurance_master'
        managed = True