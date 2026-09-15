from rest_framework import serializers
from .models import Attendance
from accounts.models import User

class AttendanceUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'employee_id', 'full_name', 'email', 'department', 'designation']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username

class AttendanceSerializer(serializers.ModelSerializer):
    user = AttendanceUserSerializer(read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'user', 'date', 'check_in', 'check_out', 'total_hours', 'status', 'notes']
        read_only_fields = ['id', 'date', 'check_in', 'check_out', 'total_hours', 'status']
