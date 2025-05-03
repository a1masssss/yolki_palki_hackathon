from django.shortcuts import render

def home(request):
    return render(request, 'main/home.html')


def practice(request):
    return render(request, 'main/practice.html')