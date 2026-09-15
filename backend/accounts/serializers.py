from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'employee_id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone', 'department', 'designation', 'role',
            'employment_status', 'joining_date', 'manager', 'manager_name'
        ]
        read_only_fields = ['id', 'employee_id', 'joining_date']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username

    def get_manager_name(self, obj):
        if obj.manager:
            name = f"{obj.manager.first_name} {obj.manager.last_name}".strip()
            return name if name else obj.manager.username
        return None

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError('Both email and password are required.')

        user = authenticate(username=email, password=password)
        if not user:
            # Fallback if username wasn't synced
            try:
                user_obj = User.objects.get(email=email)
                if user_obj.check_password(password):
                    user = user_obj
            except User.DoesNotExist:
                user = None

        if not user:
            raise serializers.ValidationError('Invalid email or password.')

        if user.employment_status != User.EmploymentStatus.ACTIVE:
            raise serializers.ValidationError('Account is deactivated. Please contact HR.')

        attrs['user'] = user
        return attrs
