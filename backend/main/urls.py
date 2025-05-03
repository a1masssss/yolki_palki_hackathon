from django.urls import path
from main.views import home, history

urlpatterns = [
    path('', home, name='home'),
    path('history/', history, name='history'),
    
]