from django.contrib import admin
from .models import LeaveRequest

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'leave_type', 'start_date', 'end_date', 'status', 'actioned_by')
    list_filter = ('status', 'leave_type', 'start_date')
    search_fields = ('user__email', 'user__employee_id', 'reason')
