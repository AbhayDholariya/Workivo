from rest_framework import serializers
from accounts.models import User
from django.contrib.auth.hashers import make_password

class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'employee_id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone', 'department', 'designation', 'role',
            'employment_status', 'joining_date', 'manager', 'manager_name'
        ]
        read_only_fields = ['id', 'joining_date']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username

    def get_manager_name(self, obj):
        if obj.manager:
            name = f"{obj.manager.first_name} {obj.manager.last_name}".strip()
            return name if name else obj.manager.username
        return None

class EmployeeCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, default='Employee@123')

    class Meta:
        model = User
        fields = [
            'id', 'employee_id', 'email', 'first_name', 'last_name',
            'phone', 'department', 'designation', 'role',
            'employment_status', 'manager', 'password'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password', 'Employee@123')
        validated_data['username'] = validated_data['email'] # Sync username with email
        validated_data['password'] = make_password(password)
        return super().create(validated_data)

class EmployeeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'department', 
            'designation', 'role', 'employment_status', 'manager'
        ]
