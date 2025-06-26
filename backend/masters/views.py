from rest_framework.decorators import api_view
from rest_framework.response import Response
from masters.models import LedgerMaster


@api_view(['POST'])
def update_ledgermaster(request):

    action = request.data.get('action', "")
    client_pan = request.data.get('client_pan', "")
    ledger_name = request.data.get('ledger_name', "")
    ledger_ref_no = request.data.get('ledger_ref_no', "")
    ledger_group = request.data.get('ledger_group', "")

    data = {
        'client_pan': client_pan,
        'ledger_name': str.upper(ledger_name),
        'ledger_ref_no': ledger_ref_no,
        'ledger_group': ledger_group,
    }

    found = LedgerMaster.objects.filter(
        ledger_name=ledger_name).exists()

    if found:
        if action == 'delete':
            LedgerMaster.objects.filter(
                ledger_name=ledger_name).delete()
            return Response({'status': 'success', 'message': 'Instrument deleted successfully', "data": []})

        instrument = LedgerMaster.objects.get(ledger_name=ledger_name)
        for key, value in data.items():
            setattr(instrument, key, value)
        instrument.save()
        return Response({'status': 'success', 'message': 'Instrument updated successfully', "data": []})
    else:
        if action != 'delete':
            instrument = LedgerMaster.objects.create(**data)
            return Response({'status': 'success', 'message': 'Instrument created successfully', "data": []})

    return Response({'status': 'error', 'message': 'Invalid action or instrument not found', "data": []})


@api_view(['POST'])
def search_ledgermaster(request):
    client_pan = request.data.get('client_pan', "")

    instruments = LedgerMaster.objects.filter(client_pan=client_pan).values()

    return Response({'status': 'success', 'data': list(instruments)})


@api_view(['POST'])
def fetch_ledger_groupwise(request):
    client_pan = request.data.get('client_pan', "")
    ledger_group = request.data.get('ledger_group', "")

    try:
        ledgers = LedgerMaster.objects.filter(
            client_pan=client_pan, ledger_group=ledger_group).values()

        data = list(ledgers)
        return Response({'status': 'success', 'data': data})
    except LedgerMaster.DoesNotExist:
        return Response({'status': 'error', 'message': 'Ledger not found', "data": []})
