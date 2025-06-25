from django.db import models

class Instruments(models.Model):
    id = models.AutoField(primary_key=True)
    client_pan = models.CharField(max_length=10, blank=True, null=True)
    instrument_name = models.CharField(max_length=100, unique=True)
    instrument_id = models.CharField(max_length=50, blank=True, null=True)
    instrument_group = models.CharField(max_length=50, blank=True, null=True)
    folio_number = models.CharField(max_length=50, blank=True, null=True)
    folio_name = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'instruments'
        managed = True
    
class InstrumentGroups(models.Model):
    id = models.AutoField(primary_key=True)
    instrument_group = models.CharField(max_length=50, unique=True)
    instrument_nature = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'instrument_groups'
        managed = True