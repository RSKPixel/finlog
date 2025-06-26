from rest_framework.decorators import api_view
from rest_framework.response import Response
import os
import pandas as pd


@api_view(['POST'])
def banking_upload(request):

    file = request.FILES.get('file', None)
    client_pan = request.data.get('client_pan', "")
    ledger_name = request.data.get('ledger_name', "")

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
        df = pd.DataFrame()
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

                data = data[['Value Date', 'Description',
                             'Chq / Ref No.', 'debit', 'credit', 'closing_balance']]
                data.rename(columns={
                    'Value Date': 'transaction_date',
                    'Description': 'description',
                    'Chq / Ref No.': 'reference_no',
                    'debit': 'debit',
                    'credit': 'credit',
                    'closing_balance': 'balance'
                }, inplace=True)
        except Exception as e:
            return Response({'status': 'error', 'message': f'Error processing CSV file: {str(e)}', "data": []})

        data.to_clipboard(index=False)

    if file.name.endswith('.xlsx'):
        # Process Excel file
        # Here you would add your logic to handle the Excel file
        pass

    return Response({'status': 'success', 'message': 'Banking upload endpoint hit successfully', "data": []})
