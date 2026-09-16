from rest_framework import serializers
from django.utils import timezone
from .models import LeaveRequest
from accounts.models import User
from attendance.models import Attendance

class LeaveUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'employee_id', 'full_name', 'email', 'department', 'designation']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username

class LeaveRequestSerializer(serializers.ModelSerializer):
    user = LeaveUserSerializer(read_only=True)
    actioned_by_name = serializers.SerializerMethodField()
    duration_days = serializers.SerializerMethodField()
    approval_display_text = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'user', 'leave_type', 'start_date', 'end_date', 'reason',
            'status', 'manager_approval', 'admin_approval',
            'manager_actioned_at', 'admin_actioned_at',
            'actioned_by', 'actioned_by_name', 'rejection_reason',
            'actioned_at', 'duration_days', 'approval_display_text', 'created_at'
        ]
        read_only_fields = [
            'id', 'status', 'manager_approval', 'admin_approval',
            'manager_actioned_at', 'admin_actioned_at', 'actioned_by',
            'actioned_at', 'created_at'
        ]

    def get_actioned_by_name(self, obj):
        if obj.actioned_by:
            name = f"{obj.actioned_by.first_name} {obj.actioned_by.last_name}".strip()
            return name if name else obj.actioned_by.username
        return None

    def get_duration_days(self, obj):
        if obj.start_date and obj.end_date:
            return (obj.end_date - obj.start_date).days + 1
        return 1

    def get_approval_display_text(self, obj):
        if obj.status == LeaveRequest.Status.APPROVED:
            return "Fully Approved"
        if obj.status == LeaveRequest.Status.REJECTED:
            return "Rejected"
        if obj.status == LeaveRequest.Status.CANCELLED:
            return "Cancelled"
        
        # Requester is a Manager: only HR Approval needed
        if obj.user.role == User.Role.MANAGER:
            return "Awaiting HR / Admin Approval"
        
        # Requester is an Employee: Dual Approval tracking
        if obj.manager_approval == LeaveRequest.ApprovalStatus.APPROVED and obj.admin_approval == LeaveRequest.ApprovalStatus.PENDING:
            return "Manager Approved (Awaiting HR)"
        if obj.admin_approval == LeaveRequest.ApprovalStatus.APPROVED and obj.manager_approval == LeaveRequest.ApprovalStatus.PENDING:
            return "HR Approved (Awaiting Manager)"
        return "Pending Manager & HR Approval"

class LeaveApplySerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ['leave_type', 'start_date', 'end_date', 'reason']

    def validate(self, attrs):
        user = self.context['request'].user
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')

        # Edge Case 2: What happens if the end date is before the start date?
        if end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be earlier than start date.'
            })

        # Edge Case 1: What happens if an employee applies for overlapping leave?
        overlapping = LeaveRequest.objects.filter(
            user=user,
            status__in=[LeaveRequest.Status.PENDING, LeaveRequest.Status.APPROVED],
            start_date__lte=end_date,
            end_date__gte=start_date
        )
        if overlapping.exists():
            existing = overlapping.first()
            raise serializers.ValidationError(
                f"You already have a {existing.status.lower()} leave request overlapping this period ({existing.start_date} to {existing.end_date})."
            )

        # Edge Case 3: What happens if an employee applies for leave on a date they already marked attendance?
        attendance_exists = Attendance.objects.filter(
            user=user,
            date__range=[start_date, end_date],
            status__in=[Attendance.Status.PRESENT, Attendance.Status.HALF_DAY]
        ).exists()
        if attendance_exists:
            raise serializers.ValidationError(
                "You have already marked attendance (Present/Half Day) on one or more dates in this range. Leave cannot be applied."
            )

        return attrs
