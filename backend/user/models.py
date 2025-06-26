from django.db import models

# Create your models here.


class UserAccount(models.Model):
    id = models.AutoField(primary_key=True)
    pan = models.CharField(max_length=10, unique=True, blank=False, null=False)
    name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    password = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'user_account'
        managed = True
