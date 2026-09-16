import re
from rest_framework import serializers
from accounts.models import User
from django.contrib.auth.hashers import make_password
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError as DjangoValidationError

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
        read_only_fields = ['id']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username

    def get_manager_name(self, obj):
        if obj.manager:
            name = f"{obj.manager.first_name} {obj.manager.last_name}".strip()
            return name if name else obj.manager.username
        return None

def validate_phone_number(value):
    if value:
        cleaned = re.sub(r'[\s\-\(\)]', '', value)
        if not re.match(r'^\+?[0-9]{10,15}$', cleaned):
            raise serializers.ValidationError("Please enter a valid 10-digit mobile number.")
    return value

class EmployeeCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, default='Employee@123')
    role = serializers.CharField(default='EMPLOYEE', required=False)

    class Meta:
        model = User
        fields = [
            'id', 'employee_id', 'email', 'first_name', 'last_name',
            'phone', 'department', 'designation', 'role',
            'employment_status', 'joining_date', 'manager', 'password'
        ]

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        try:
            django_validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError("Enter a valid email address (e.g. user@company.com).")
        
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An employee with this email already exists.")
        return value

    def validate_phone(self, value):
        return validate_phone_number(value)

    def create(self, validated_data):
        password = validated_data.pop('password', 'Employee@123')
        if not validated_data.get('role'):
            validated_data['role'] = 'EMPLOYEE'
        validated_data['username'] = validated_data['email']
        validated_data['password'] = make_password(password)
        return super().create(validated_data)

class EmployeeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'department', 
            'designation', 'role', 'employment_status', 'joining_date', 'manager'
        ]

    def validate_phone(self, value):
        return validate_phone_number(value)
