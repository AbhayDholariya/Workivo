from rest_framework.permissions import BasePermission

class IsActiveUser(BasePermission):
    """Allows access only to active employees."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.employment_status == 'ACTIVE'
        )

class IsAdminUserRole(BasePermission):
    """Allows access only to HR / Admin users."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.employment_status == 'ACTIVE' and 
            request.user.role == 'ADMIN'
        )

class IsManagerRole(BasePermission):
    """Allows access only to Managers."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.employment_status == 'ACTIVE' and 
            request.user.role == 'MANAGER'
        )

class IsAdminOrManagerRole(BasePermission):
    """Allows access to either Admins or Managers."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.employment_status == 'ACTIVE' and 
            request.user.role in ['ADMIN', 'MANAGER']
        )
