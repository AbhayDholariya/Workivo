from django.db import models
from django.conf import settings

class LeaveRequest(models.Model):
    class LeaveType(models.TextChoices):
        CASUAL = 'CASUAL', 'Casual Leave'
        SICK = 'SICK', 'Sick Leave'
        PAID = 'PAID', 'Paid Leave'
        UNPAID = 'UNPAID', 'Unpaid Leave'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class ApprovalStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='leaves'
    )
    leave_type = models.CharField(max_length=20, choices=LeaveType.choices, default=LeaveType.CASUAL)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # Dual approval tracking fields
    manager_approval = models.CharField(
        max_length=20, 
        choices=ApprovalStatus.choices, 
        default=ApprovalStatus.PENDING
    )
    admin_approval = models.CharField(
        max_length=20, 
        choices=ApprovalStatus.choices, 
        default=ApprovalStatus.PENDING
    )
    manager_actioned_at = models.DateTimeField(null=True, blank=True)
    admin_actioned_at = models.DateTimeField(null=True, blank=True)
    
    # Approval metadata
    actioned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='actioned_leaves'
    )
    rejection_reason = models.TextField(blank=True, null=True)
    actioned_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.user_id:
            from accounts.models import User
            try:
                user_obj = getattr(self, 'user', None) or User.objects.get(pk=self.user_id)
                if user_obj.role == User.Role.EMPLOYEE:
                    if self.manager_approval == self.ApprovalStatus.APPROVED and self.admin_approval == self.ApprovalStatus.APPROVED:
                        self.status = self.Status.APPROVED
                    elif self.manager_approval == self.ApprovalStatus.REJECTED or self.admin_approval == self.ApprovalStatus.REJECTED:
                        self.status = self.Status.REJECTED
                    elif self.status != self.Status.CANCELLED:
                        self.status = self.Status.PENDING
                elif user_obj.role == User.Role.MANAGER:
                    if self.admin_approval == self.ApprovalStatus.APPROVED:
                        self.status = self.Status.APPROVED
                    elif self.admin_approval == self.ApprovalStatus.REJECTED:
                        self.status = self.Status.REJECTED
                    elif self.status != self.Status.CANCELLED:
                        self.status = self.Status.PENDING
            except Exception:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} [{self.leave_type}] {self.start_date} to {self.end_date} ({self.status})"
