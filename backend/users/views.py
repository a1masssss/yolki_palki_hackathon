from django.shortcuts import render
from users.forms import UserRegisterForm, CustomAuthenticationForm
from django.views.generic import CreateView
from django.views.generic.edit import FormView
from django.urls import reverse_lazy
from django.contrib.auth import authenticate, login
from django.shortcuts import redirect


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

