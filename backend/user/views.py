from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import UserAccount  
from django.contrib.auth.hashers import make_password, check_password
import datetime
import jwt
from user.decorators import verify_jwt

@api_view(['POST'])
def register(request):

    pan = request.data.get('pan')
    name = request.data.get('name')
    email = request.data.get('email')
    phone = request.data.get('phone')
    password = request.data.get('password')
    password = make_password(password)


    if UserAccount.objects.filter(pan=pan).exists():
        return Response({"status": "error", "message": "PAN already exists.", "data": []})

    user = UserAccount.objects.create(
        pan=pan,
        name=name,
        email=email,
        phone=phone,
        password=password
    )   
    user.save()

    return Response({"status":"success","message": "User registered successfully!", "data": []})

@api_view(['POST'])
def login(request):
    pan = request.data.get('pan')
    password = request.data.get('password')

    client = UserAccount.objects.filter(pan=pan).first()

    if not client:
        return Response({"status": "error", "message": "Invalid PAN or Password", "data": []})
    
    if not check_password(password, client.password):
        return Response({"status": "error", "message": "Invalid PAN or Password", "data": []})
    

    # Here you can implement session management or token generation if needed
    token = "dummy_token"
    payload = {
        "id": client.id, 
        "name": client.name,
        "pan": client.pan,
        "email": client.email,
        "phone": client.phone,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }    
    token = jwt.encode(payload, 'secret', algorithm='HS256')
    return Response({"status": "success", "message": "Login successful!", "data": {
        "token": token, 
        "client": {
            "id": client.id,
            "pan": client.pan, 
            "name": client.name, 
            "email": client.email, 
            "phone": client.phone
        }
    }})

@api_view(['POST'])
@verify_jwt
def validate(request):
    client = request.client

    return Response({"status": "success", "message": "Token is valid", "data": {"client": client}}) 