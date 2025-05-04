from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from .views import SingUpView, CustomLoginView 

urlpatterns = [
    path("register/", SingUpView.as_view(), name="register"),
    path("api-register/", views.api_register, name="api-register"),
    path("login/", CustomLoginView.as_view(), name="login"),
    path("api-login/", views.api_login, name="api-login"),
    path("logout/", auth_views.LogoutView.as_view(next_page='home',), name="logout"),
    path("api-logout/", views.api_logout, name="api-logout"),
    path("get-csrf/", views.get_csrf_token, name="get-csrf"),
    path("check-auth/", views.check_auth, name="check-auth"),
    path("debug-auth/", views.debug_auth, name="debug-auth"),
]