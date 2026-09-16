from django.contrib import admin
from .models import Attendance

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'check_in', 'check_out', 'total_hours', 'status')
    list_filter = ('status', 'date')
    search_fields = ('user__email', 'user__employee_id')
