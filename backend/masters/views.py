from rest_framework.decorators import api_view
from rest_framework.response import Response
from masters.models import Instruments


@api_view(['POST'])
def update_instrumentmaster(request):

    action = request.data.get('action', "")
    client_pan = request.data.get('client_pan', "")
    instrument_name = request.data.get('instrument_name', "")
    instrument_id = request.data.get('instrument_id', "")
    instrument_group = request.data.get('instrument_group', "")
    folio_no = request.data.get('folio_no', "")
    folio_name = request.data.get('folio_name', "")

    data = {
        'client_pan': client_pan,
        'instrument_name': str.upper(instrument_name),
        'instrument_id': instrument_id,
        'instrument_group': instrument_group,
        'folio_no': folio_no,
        'folio_name': str.upper(folio_name)
    }

    found = Instruments.objects.filter(
        instrument_name=instrument_name).exists()

    if found:
        if action == 'delete':
            Instruments.objects.filter(
                instrument_name=instrument_name).delete()
            return Response({'status': 'success', 'message': 'Instrument deleted successfully', "data": []})

        instrument = Instruments.objects.get(instrument_name=instrument_name)
        for key, value in data.items():
            setattr(instrument, key, value)
        instrument.save()
        return Response({'status': 'success', 'message': 'Instrument updated successfully', "data": []})
    else:
        if action != 'delete':
            instrument = Instruments.objects.create(**data)
            return Response({'status': 'success', 'message': 'Instrument created successfully', "data": []})

    return Response({'status': 'error', 'message': 'Invalid action or instrument not found', "data": []})


@api_view(['POST'])
def search_instrumentmaster(request):
    client_pan = request.data.get('client_pan', "")

    instruments = Instruments.objects.filter(client_pan=client_pan).values()

    return Response({'status': 'success', 'data': list(instruments)})
