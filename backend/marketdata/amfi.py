
from rest_framework.decorators import api_view
from rest_framework.response import Response
import os
import requests
import pandas as pd
from django.conf import settings
from .models import MutualFundsEod, MutualFundsHistorical
from django.db import transaction
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import numpy as np
BASE_DIR = settings.BASE_DIR
url = "https://www.amfiindia.com/spages/NAVAll.txt"


@api_view(['GET'])
def amfi_download_eod(request):
    try:
        session = requests.Session()
        response = session.get(url)
        response.raise_for_status()  
        data = response.text.splitlines()
        
        nav_amfi_csv = os.path.join(BASE_DIR, "data", "mf_nav_amfi.csv")
        nav_amfi_txt = os.path.join(BASE_DIR, "data", "mf_nav_amfi.txt")
        amc_code_df = pd.read_csv(os.path.join(BASE_DIR, "data", "amfi_amc.csv"))

        with open(nav_amfi_txt, 'wb') as file:
            file.write(response.content)

        with open(nav_amfi_txt, 'r', encoding='utf-8', errors='replace') as infile:
            lines = infile.readlines()

        amc_name = None
        amc_code = None

        with open(nav_amfi_csv, 'w', encoding='utf-8') as outfile:
            for i in range(1, len(lines) - 1):
                current = lines[i].strip()
                prev = lines[i - 1].strip()
                next = lines[i + 1].strip()

                # Check if current line is AMC name (surrounded by blank lines)
                if current and not prev and not next:
                    amc_name = current
                    if amc_name in amc_code_df["amc_name"].values:
                        amc_code = amc_code_df[amc_code_df["amc_name"] == amc_name]["amc_code"].values[0]
                    else:
                        amc_code = None
                    continue

                # Valid data line: 5 semicolons and an AMC name identified
                if lines[i].count(';') == 5 and amc_name:
                    outfile.write(lines[i].strip() + f";{amc_name};{amc_code}\n")

        # Read the cleaned CSV file

        df = pd.read_csv(nav_amfi_csv, sep=';')
        df.columns = ['scheme_code', 'isin_1',
                    'isin_2', 'scheme_name', 'nav', 'nav_date', 'amc_name', 'amc_code']
        
        df = df[['nav_date', 'scheme_code', 'scheme_name','amc_name', 'amc_code', 'isin_1', 'nav', 'isin_2']]

        df['nav_date'] = pd.to_datetime(
            df['nav_date'], format='%d-%b-%Y').dt.strftime('%Y-%m-%d')
        df['nav'] = df['nav'].replace('N.A.', 0)
        df["amc_code"] = df["amc_code"].astype("Int64")
        df["scheme_code"] = df["scheme_code"].astype(str)

        df['nav'] = pd.to_numeric(df['nav'], errors='coerce')
        df = df.rename(columns={
            'nav_date': 'date',
            'scheme_code': 'scheme_code',
            'scheme_name': 'scheme_name',
            'amc_name': 'amc_name',
            'amc_code': 'amc_code',
            'isin_1': 'isin_1',
            'isin_2': 'isin_2',
            'nav': 'nav'
        })
        df = df[['date', 'scheme_code', 'scheme_name', 'amc_code', 'amc_name', 'isin_1', 'isin_2', 'nav' ]]
        df.to_csv(nav_amfi_csv, index=False)

        existing_objs = MutualFundsEod.objects.in_bulk(
            field_name='scheme_code'
        )

        objects_to_create = []
        objects_to_update = []

        for idx, row in df.iterrows():
            obj = MutualFundsEod(
                scheme_code=row['scheme_code'],
                date=row['date'],
                scheme_name=row['scheme_name'],
                amc_code=row['amc_code'],
                amc_name=row['amc_name'],
                isin=row['isin_1'],
                nav=row['nav']
            )

            if row['scheme_code'] in existing_objs:
                obj.id = existing_objs[row['scheme_code']].id  # Needed for bulk_update
                objects_to_update.append(obj)
            else:
                objects_to_create.append(obj)

        # Insert new ones
        if objects_to_create:
            with transaction.atomic():
                MutualFundsEod.objects.bulk_create(objects_to_create, batch_size=500)

        # Update existing
        if objects_to_update:
            with transaction.atomic():
                MutualFundsEod.objects.bulk_update(
                    objects_to_update,
                    fields=['date', 'scheme_name', 'amc_code', 'amc_name', 'isin', 'nav'],
                    batch_size=500
                )

        os.remove(nav_amfi_txt)  
        os.remove(nav_amfi_csv)  
        return Response({"message": f"Data successfully downloaded and save to database Created: {len(objects_to_create)} | Updated: {len(objects_to_update)}", "data": []})
    except requests.RequestException as e:
        os.remove(nav_amfi_txt)  
        os.remove(nav_amfi_csv)  
        return Response({"message": e, "data": []})
    

def amfi_eod_fetch(amc_name=None, isin=None):
    filter_kwargs = {}
    if amc_name:
        filter_kwargs['amc_name'] = amc_name
    if isin:
        filter_kwargs['isin'] = isin

    try:
        data = MutualFundsEod.objects.filter(**filter_kwargs).values()
        data = pd.DataFrame(list(data))
        if not data:
            return "No data found", []
        return "success", data.to_dict(orient='records')
    
    except Exception as e:
        return str(e), []
