from django.shortcuts import render
from users.forms import UserRegisterForm, CustomAuthenticationForm
from django.views.generic import CreateView
from django.views.generic.edit import FormView
from django.urls import reverse_lazy
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import MultiPartParser, FormParser


class SingUpView(CreateView):
    form_class = UserRegisterForm
    success_url = reverse_lazy("login")
    template_name = "users/register.html"


class CustomLoginView(FormView):
    template_name = "users/login.html"
    form_class = CustomAuthenticationForm
    success_url = reverse_lazy("home")

    def form_valid(self, form):
        email = form.cleaned_data.get('username')
        password = form.cleaned_data.get('password')
        user = authenticate(self.request, username=email, password=password)

        if user: 
            login(self.request, user)
            return redirect('home')
        else:
            form.add_error(None, "Incorrect pass or email") 
            return self.form_invalid(form)


@ensure_csrf_cookie
@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """
    API view to get CSRF token
    This endpoint should be called before any POST/PUT/DELETE requests
    """
    return Response({"detail": "CSRF cookie set"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth(request):
    """
    API view to check if user is authenticated
    Returns user info if authenticated
    """
    user = request.user
    return Response({
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    """
    API view for user registration
    Handles form data submitted via AJAX
    """
    form = UserRegisterForm(request.data)
    if form.is_valid():
        user = form.save()
        return Response({"detail": "User registered successfully"}, status=201)
    
    return Response(form.errors, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def debug_auth(request):
    """
    Debug endpoint to check cookies and session
    """
    # Check what's in the request
    cookies = {k: v for k, v in request.COOKIES.items()}
    session_keys = list(request.session.keys()) if hasattr(request, 'session') else []
    is_authenticated = request.user.is_authenticated if hasattr(request, 'user') else False
    
    return Response({
        "cookies": cookies,
        "session_keys": session_keys,
        "is_authenticated": is_authenticated,
        "user_id": request.user.id if is_authenticated else None,
        "csrf_token_present": "csrftoken" in cookies,
        "sessionid_present": "sessionid" in cookies,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    """
    API view for user login
    Handles form data submitted via AJAX
    """
    email = request.data.get('username')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {"detail": "Email and password are required"}, 
            status=400
        )
    
    user = authenticate(request, username=email, password=password)
    
    if user:
        login(request, user)
        
        # Get the session ID after login
        session_id = request.session.session_key
        print(f"Session ID after login: {session_id}")
        
        # Make sure the session is saved
        request.session.save()
        
        # Return user data with session details for debugging
        response = Response({
            "detail": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "debug": {
                "session_id": session_id,
                "session_keys": list(request.session.keys())
            }
        })
        
        return response
    else:
        return Response(
            {"detail": "Invalid credentials"}, 
            status=401
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def api_logout(request):
    """
    API view for user logout
    """
    if request.user.is_authenticated:
        # Get session info before logout for debugging
        session_id_before = request.session.session_key
        session_keys_before = list(request.session.keys())
        
        # Perform logout
        logout(request)
        
        return Response({
            "detail": "Logout successful",
            "debug": {
                "session_id_before": session_id_before,
                "session_keys_before": session_keys_before,
            }
        })
    else:
        return Response({
            "detail": "You were not logged in", 
        })

