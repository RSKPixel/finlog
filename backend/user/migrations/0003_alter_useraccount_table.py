# Generated by Django 5.2.1 on 2025-06-26 05:20

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0002_useraccount_password_alter_useraccount_email_and_more'),
    ]

    operations = [
        migrations.AlterModelTable(
            name='useraccount',
            table='user_account',
        ),
    ]
