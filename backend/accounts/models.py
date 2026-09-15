from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'HR / Admin'
        MANAGER = 'MANAGER', 'Manager'
        EMPLOYEE = 'EMPLOYEE', 'Employee'

    class EmploymentStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'

    # Overwrite email to be unique and required
    email = models.EmailField(unique=True)
    employee_id = models.CharField(max_length=30, unique=True)
    phone = models.CharField(max_length=25, blank=True, null=True)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    employment_status = models.CharField(
        max_length=20, 
        choices=EmploymentStatus.choices, 
        default=EmploymentStatus.ACTIVE
    )
    joining_date = models.DateField(auto_now_add=True)
    
    # Manager hierarchy (Self-relation)
    manager = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='subordinates'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'employee_id', 'department', 'designation']

    def __str__(self):
        full_name = self.get_full_name() or self.username
        return f"{self.employee_id} - {full_name} ({self.role})"
