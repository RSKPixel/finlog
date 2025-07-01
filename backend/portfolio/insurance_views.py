from rest_framework.decorators import api_view
from rest_framework.response import Response
from portfolio.models import Insurance


@api_view(['POST'])
def insurance(request):
    client_pan = request.data.get('client_pan')

    if not client_pan:
        return Response({"status": "error","message": "Client PAN is required", "data": []})

    insurances = Insurance.objects.filter(client_pan=client_pan).values()

    if not insurances:
        return Response({"status":"error", "message": "No insurance data found for the given PAN", "data": []})
    
    return Response({"status":"success","message": "Data fetched", "data": list(insurances)})

@api_view(['POST'])
def insurance_save(request):

    action = request.data.get('action')
    client_pan = request.data.get('client_pan')
    policy_name = str.upper(request.data.get('policy_name')) 
    policy_no = request.data.get('policy_no')
    policy_type = request.data.get('policy_type')
    insurer = str.upper(request.data.get('insurer'))
    date_of_commencement = request.data.get('date_of_commencement')
    date_of_last_premium = request.data.get('date_of_last_premium')
    date_of_maturity = request.data.get('date_of_maturity')
    premium_amount = request.data.get('premium_amount')
    sum_assured = request.data.get('sum_assured')
    frequency = request.data.get('frequency')
    agent_name = str.upper(request.data.get('agent_name'))
    policy_status = request.data.get('policy_status')
    remarks = request.data.get('remarks')

    print(client_pan, policy_name, policy_no, policy_type, insurer, date_of_commencement, date_of_last_premium, date_of_maturity, premium_amount, sum_assured, frequency, agent_name, policy_status, remarks)

    if not client_pan or not policy_name or not policy_no:
        return Response({"status": "error", "message": "Client PAN, Policy Name and Policy Number are required"})

    if action == 'new':
        insurance = Insurance(
            client_pan=client_pan,
            policy_name=policy_name,
            policy_no=policy_no,
            policy_type=policy_type,
            insurer=insurer,
            date_of_commencement=date_of_commencement,
            date_of_last_premium=date_of_last_premium,
            date_of_maturity=date_of_maturity,
            premium_amount=premium_amount,
            sum_assured=sum_assured,
            frequency=frequency,
            agent_name=agent_name,
            policy_status=policy_status,
            remarks=remarks
        )
        insurance.save()
        return Response({"status": "success", "message": "Insurance policy added successfully", "data": [] })
    elif action == 'modify':
        try:
            insurance = Insurance.objects.get(client_pan=client_pan, policy_no=policy_no)
            insurance.policy_name = policy_name
            insurance.policy_type = policy_type
            insurance.insurer = insurer
            insurance.date_of_commencement = date_of_commencement
            insurance.date_of_last_premium = date_of_last_premium
            insurance.date_of_maturity = date_of_maturity
            insurance.premium_amount = premium_amount
            insurance.sum_assured = sum_assured
            insurance.frequency = frequency
            insurance.agent_name = agent_name
            insurance.policy_status = policy_status
            insurance.remarks = remarks
            insurance.save()
            return Response({"status": "success", "message": "Insurance policy updated successfully", "data": [] })
        except Insurance.DoesNotExist:
            return Response({"status": "error", "message": "Insurance policy not found", "data": [] })
    elif action == 'delete':
        try:
            insurance = Insurance.objects.get(client_pan=client_pan, policy_no=policy_no)
            insurance.delete()
            return Response({"status": "success", "message": "Insurance policy deleted successfully", "data": [] })
        except Insurance.DoesNotExist:
            return Response({"status": "error", "message": "Insurance policy not found", "data": [] })

    return Response({"status": "error", "message": "Invalid action", "data": [] })
