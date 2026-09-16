from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'email', 'first_name', 'last_name', 'role', 'department', 'designation', 'employment_status')
    search_fields = ('employee_id', 'email', 'first_name', 'last_name', 'department')
    list_filter = ('role', 'employment_status', 'department')
