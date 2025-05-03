from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from .views import SingUpView, CustomLoginView, logout_view 
urlpatterns = [
    path("register/", SingUpView.as_view(), name="register"),
    path("login/", CustomLoginView.as_view(), name="login"),
    path("logout/", logout_view, name="logout"),
]