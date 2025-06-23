from django.db import models

# Create your models here.
class UserAccount(models.Model):
    id = models.AutoField(primary_key=True)
    pan= models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    phone = models.CharField(max_length=15, unique=True)
    date_of_birth = models.DateField

    class Meta:
        db_table = 'UserAccount'
        managed = True
