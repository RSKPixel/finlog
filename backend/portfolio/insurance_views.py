from rest_framework.decorators import api_view
from rest_framework.response import Response
from portfolio.models import Insurance, InsuranceTransactions
from django.db.models import Sum
import pandas as pd


@api_view(['POST'])
def insurance(request):
    client_pan = request.data.get('client_pan')

    if not client_pan:
        return Response({"status": "error", "message": "Client PAN is required", "data": []})

    insurances_qs = Insurance.objects.filter(client_pan=client_pan, policy_status__in=['Active', 'Premium Fully Paid'])
    insurances = insurances_qs.values().order_by('date_of_maturity')

    summary = insurances_qs.aggregate(
        total_premium_paid=Sum('total_premium_paid'),
        total_sum_assured=Sum('sum_assured'),
        total_current_value=Sum('current_value')
    )

    transactions = {}
    for insurance in insurances:
        total_premium_paid = InsuranceTransactions.objects.filter(
            client_pan=client_pan,
            policy_no=insurance['policy_no'],
            transaction_type='premium'
        ).aggregate(total_paid=Sum('transaction_amount'))['total_paid']

        Insurance.objects.filter(
            client_pan=client_pan,
            policy_no=insurance['policy_no']
        ).update(total_premium_paid=total_premium_paid)

        trans = InsuranceTransactions.objects.filter(
            client_pan=client_pan,
            policy_no=insurance['policy_no']
        ).values()

        t = InsuranceTransactions.objects.filter(
            client_pan=client_pan,
            policy_no=insurance['policy_no']
        ).values('transaction_date', 'transaction_type', 'transaction_amount')
        transactions[insurance['policy_no']] = list(t)

    # insurances = Insurance.objects.filter(client_pan=client_pan).values()
    df = pd.DataFrame(list(insurances))
    df.fillna(0, inplace=True)

    if not insurances:
        return Response({"status": "error", "message": "No insurance data found for the given PAN", "data": []})

    return Response({"status": "success", "message": "Data fetched", "data": {
        'insurance': df.to_dict(orient='records'),
        'transactions': transactions,
        'summary':  {
            'total_premium_paid': summary['total_premium_paid'] if summary['total_premium_paid'] else 0,
            'total_sum_assured': summary['total_sum_assured'] if summary['total_sum_assured'] else 0,
            'total_current_value': summary['total_current_value'] if summary['total_current_value'] else 0
        }}})


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
    total_premium_paid = request.data.get('total_premium_paid')
    current_value = request.data.get('current_value')
    remarks = request.data.get('remarks')

    print(client_pan, policy_name, policy_no, policy_type, insurer, date_of_commencement, date_of_last_premium,
          date_of_maturity, premium_amount, sum_assured, frequency, agent_name, policy_status, remarks)

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
            total_premium_paid=total_premium_paid,
            current_value=current_value,
            remarks=remarks
        )
        insurance.save()
        return Response({"status": "success", "message": "Insurance policy added successfully", "data": []})
    elif action == 'modify':
        try:
            insurance = Insurance.objects.get(
                client_pan=client_pan, policy_no=policy_no)
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
            insurance.total_premium_paid = total_premium_paid
            insurance.current_value = current_value
            insurance.remarks = remarks

            insurance.save()
            return Response({"status": "success", "message": "Insurance policy updated successfully", "data": []})
        except Insurance.DoesNotExist:
            return Response({"status": "error", "message": "Insurance policy not found", "data": []})
    elif action == 'delete':
        try:
            insurance = Insurance.objects.get(
                client_pan=client_pan, policy_no=policy_no)
            insurance.delete()
            return Response({"status": "success", "message": "Insurance policy deleted successfully", "data": []})
        except Insurance.DoesNotExist:
            return Response({"status": "error", "message": "Insurance policy not found", "data": []})

    return Response({"status": "error", "message": "Invalid action", "data": []})


@api_view(['POST'])
def insurance_transactions(request):
    client_pan = request.data.get('client_pan')
    policy_no = request.data.get('policy_no')

    if not client_pan or not policy_no:
        return Response({"status": "error", "message": "Client PAN and Policy Number are required", "data": []})

    transactions = InsuranceTransactions.objects.filter(
        client_pan=client_pan, policy_no=policy_no).values()

    if not transactions:
        return Response({"status": "error", "message": "No insurance transactions found for the given PAN and Policy Number", "data": []})

    return Response({"status": "success", "message": "Data fetched", "data": list(transactions)})


@api_view(['POST'])
def insurance_transactions_save(request):
    action = request.data.get('action')
    transaction_id = request.data.get('transaction_id', None)
    client_pan = request.data.get('client_pan')
    policy_no = request.data.get('policy_no')
    transaction_date = request.data.get('transaction_date')
    transaction_type = request.data.get('transaction_type')
    transaction_amount = request.data.get('transaction_amount')

    
    if (not client_pan or not policy_no or not transaction_date or not transaction_type or not transaction_amount) and action != 'delete':
        return Response({"status": "error", "message": "Client PAN, Policy Number, Transaction Date, Transaction Type and Transaction Amount are required", "data": []})

    if action == 'new':
        insurance_transaction = InsuranceTransactions(
            client_pan=client_pan,
            policy_no=policy_no,
            transaction_date=transaction_date,
            transaction_type=transaction_type,
            transaction_amount=transaction_amount,
        )
        insurance_transaction.save()
        return Response({"status": "success", "message": "Insurance transaction added successfully", "data": []})
    elif action == 'modify':
        try:
            insurance_transaction = InsuranceTransactions.objects.get(
                id=transaction_id)
            insurance_transaction.transaction_type = transaction_type
            insurance_transaction.transaction_amount = transaction_amount

            insurance_transaction.save()
            return Response({"status": "success", "message": "Insurance transaction updated successfully", "data": []})
        except InsuranceTransactions.DoesNotExist:
            return Response({"status": "error", "message": "Insurance transaction not found", "data": []})
    elif action == 'delete':
        try:
            insurance_transaction = InsuranceTransactions.objects.get(
                client_pan=client_pan, id=transaction_id)
            insurance_transaction.delete()
            return Response({"status": "success", "message": "Insurance transaction deleted successfully", "data": []})
        except InsuranceTransactions.DoesNotExist:
            return Response({"status": "error", "message": "Insurance transaction not found", "data": []})

    return Response({"status": "success", "message": "Insurance transaction saved successfully", "data": []})
