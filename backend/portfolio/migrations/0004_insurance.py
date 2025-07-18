# Generated by Django 5.2.1 on 2025-07-01 14:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0003_portfoliotransactions_goalpot'),
    ]

    operations = [
        migrations.CreateModel(
            name='Insurance',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('client_pan', models.CharField(blank=True, max_length=10, null=True)),
                ('policy_name', models.CharField(blank=True, max_length=100, null=True)),
                ('policy_number', models.CharField(blank=True, max_length=50, null=True)),
                ('policy_type', models.CharField(blank=True, max_length=50, null=True)),
                ('insurer', models.CharField(blank=True, max_length=100, null=True)),
                ('date_of_commencement', models.DateField(blank=True, null=True)),
                ('date_of_last_premium', models.DateField(blank=True, null=True)),
                ('date_of_maturity', models.DateField(blank=True, null=True)),
                ('premium_amount', models.FloatField(blank=True, null=True)),
                ('sum_assured', models.FloatField(blank=True, null=True)),
                ('frequency', models.CharField(blank=True, max_length=50, null=True)),
                ('agent_name', models.CharField(blank=True, max_length=100, null=True)),
                ('policy_status', models.CharField(blank=True, max_length=50, null=True)),
                ('remarks', models.CharField(blank=True, max_length=255, null=True)),
            ],
            options={
                'db_table': 'insurance',
                'managed': True,
            },
        ),
    ]
