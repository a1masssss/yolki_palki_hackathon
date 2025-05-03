from django.contrib import admin
from .models import User

# Register your models here.
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'date_joined', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('first_name', 'last_name', 'email', )
    list_filter = ('is_active', 'date_joined', )