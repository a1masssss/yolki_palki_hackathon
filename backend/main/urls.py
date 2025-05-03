from django.urls import path
from main.views import home, practice
urlpatterns = [
    path('', home, name = 'home'),
    path('practice/', practice, name = 'practice')
]