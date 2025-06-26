from rest_framework.decorators import api_view
from rest_framework.response import Response
from transactions.models import BankStatement
import os
import pandas as pd
import numpy as np


@api_view(['POST'])
def bank_statement_reconfirmed(request):
    data = request.data.get('transactions', None)

    if not data:
        return Response({'status': 'error', 'message': 'No transactions provided', "data": []})

    data = pd.DataFrame(data)
    print(list(data.columns))
    if list(data.columns) != ['client_pan', 'ledger_name', 'ledger_group', 'transaction_date', 'description', 'debit', 'credit', 'balance']:
        return Response({'status': 'error', 'message': 'Invalid data format', "data": []})

    for index, row in data.iterrows():
        # create or update the bank statement record
        bank_statement, created = BankStatement.objects.update_or_create(
            client_pan=row['client_pan'],
            bank_ledger_name=row['ledger_name'],
            transaction_date=row['transaction_date'],
            description= row['description'],
            debit=row['debit'],
            credit=row['credit'],
            balance=row['balance'],
        )

    return Response({
        'status': 'success',
        'message': 'Bank statement saved to database successfully',
        'data': []
    })


@api_view(['POST'])
def banking_upload(request):

    file = request.FILES.get('file', None)
    client_pan = request.data.get('client_pan', "")
    ledger_name = request.data.get('ledger_name', "")
    data = pd.DataFrame()

    if not file:
        return Response({'status': 'error', 'message': 'No file provided', "data": []})

    if file.name.endswith('.csv'):
        # Process CSV file
        save_path = os.path.join('uploads', file.name)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        with open(save_path, 'wb+') as f:
            for chunk in file.chunks():
                f.write(chunk)

        with open(save_path, 'r') as f:
            # Here you would add your logic to handle the CSV file
            all_lines = f.readlines()

        lookfor_templates = [
            "Sl. No.,Transaction Date,Value Date,Description,Chq / Ref No.,Amount,Dr / Cr,Balance,Dr / Cr"
        ]

        identified_template = None
        for template in lookfor_templates:
            if any(line.strip().startswith(template) for line in all_lines):
                identified_template = template
                break

        header_index = None
        for index, line in enumerate(all_lines):
            if any(line.strip().startswith(template) for template in lookfor_templates):
                header_index = index
                break

        if header_index is not None:
            data = pd.read_csv(save_path, skiprows=header_index)
            data.columns = [col.strip() for col in data.columns]

        for col in data.columns:
            try:
                data[col] = data[col].astype(str).str.replace(
                    ',', '').astype(float)
            except ValueError:
                continue

        try:
            if identified_template == "Sl. No.,Transaction Date,Value Date,Description,Chq / Ref No.,Amount,Dr / Cr,Balance,Dr / Cr":
                data['client_pan'] = client_pan
                data['ledger_name'] = ledger_name
                data['ledger_group'] = 'Banking'
                data['Value Date'] = pd.to_datetime(
                    data['Value Date'], format='%d-%m-%Y', errors='coerce').dt.strftime('%Y-%m-%d')
                data['Amount'] = data['Amount'].astype(float)
                data['Balance'] = data['Balance'].astype(float)
                data['Dr / Cr'] = data['Dr / Cr'].astype(
                    str).str.strip().str.lower()
                data['Dr / Cr.1'] = data['Dr / Cr.1'].astype(
                    str).str.strip().str.lower()
                data["debit"] = data.apply(
                    lambda x: x['Amount'] if x['Dr / Cr'] == 'dr' else 0, axis=1)
                data["credit"] = data.apply(
                    lambda x: x['Amount'] if x['Dr / Cr'] == 'cr' else 0, axis=1)
                data["closing_balance"] = data.apply(
                    lambda x: x['Balance'] if x['Dr / Cr.1'] == 'cr' else -x['Balance'], axis=1)

                data = data[['client_pan',
                             'ledger_name',
                             'ledger_group',
                             'Value Date',
                             'Description',
                             'debit',
                             'credit',
                             'closing_balance']]
                data.rename(columns={
                    'Value Date': 'transaction_date',
                    'Description': 'description',
                    'debit': 'debit',
                    'credit': 'credit',
                    'closing_balance': 'balance'
                }, inplace=True)
                data.dropna(inplace=True, how='all')
                data = data.dropna(subset=["transaction_date"])
                data = data[data["description"].notna()]
                data.replace([np.inf, -np.inf], np.nan, inplace=True)

        except Exception as e:
            return Response({'status': 'error', 'message': f'Error processing CSV file: {str(e)}', "data": []})

    if file.name.endswith('.xlsx'):
        # Process Excel file
        # Here you would add your logic to handle the Excel file
        pass

    if data.empty:
        return Response({'status': 'error', 'message': 'Invalid statement format or empty data...', "data": []})

    return Response({'status': 'success', 'message': 'Bank statement successfully processed', "data": data.to_dict(orient='records')})
