from functools import wraps
from rest_framework.response import Response
import jwt

def verify_jwt(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return Response({"status": "error", "message": "Authorization required"}, status=401)
        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            request.client = payload  # Attach user info
        except jwt.ExpiredSignatureError:
            return Response({"status": "error", "message": "Token expired"}, status=401)
        except jwt.InvalidTokenError:
            return Response({"status": "error", "message": "Invalid token"}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper
