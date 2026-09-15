from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from accounts.models import User
from accounts.permissions import IsActiveUser, IsAdminUserRole, IsAdminOrManagerRole
from .serializers import EmployeeSerializer, EmployeeCreateSerializer, EmployeeUpdateSerializer

class EmployeeListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser, IsAdminOrManagerRole]

    def get(self, request):
        user = request.user
        queryset = User.objects.all().select_related('manager')

        # Role-based scoping
        if user.role == User.Role.MANAGER:
            queryset = queryset.filter(manager=user)
        elif user.role != User.Role.ADMIN:
            return Response(
                {'detail': 'You do not have permission to view employees.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Search filter
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(employee_id__icontains=search_query)
            )

        # Attribute filters
        department = request.query_params.get('department', '').strip()
        if department:
            queryset = queryset.filter(department__iexact=department)

        employment_status = request.query_params.get('status', '').strip()
        if employment_status:
            queryset = queryset.filter(employment_status=employment_status.upper())

        role_filter = request.query_params.get('role', '').strip()
        if role_filter:
            queryset = queryset.filter(role=role_filter.upper())

        serializer = EmployeeSerializer(queryset.order_by('employee_id'), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {'detail': 'Only HR / Admin can add new employees.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = EmployeeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = serializer.save()
        return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)

class EmployeeDetailUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get_object(self, pk, user):
        try:
            employee = User.objects.select_related('manager').get(pk=pk)
        except User.DoesNotExist:
            return None

        # IDOR and permission check
        if user.role == User.Role.ADMIN:
            return employee
        if user.role == User.Role.MANAGER:
            if employee.id == user.id or employee.manager_id == user.id:
                return employee
            return False
        if user.role == User.Role.EMPLOYEE:
            if employee.id == user.id:
                return employee
            return False
        return False

    def get(self, request, pk):
        employee = self.get_object(pk, request.user)
        if employee is None:
            return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
        if employee is False:
            return Response(
                {'detail': 'Access denied: You cannot view this employee profile.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response(EmployeeSerializer(employee).data)

    def patch(self, request, pk):
        employee = self.get_object(pk, request.user)
        if employee is None:
            return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
        if employee is False:
            return Response(
                {'detail': 'Access denied: You cannot modify this employee.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # If employee is modifying own profile, prevent privilege escalation
        if request.user.role == User.Role.EMPLOYEE:
            allowed_fields = ['phone', 'first_name', 'last_name']
            cleaned_data = {k: v for k, v in request.data.items() if k in allowed_fields}
            serializer = EmployeeUpdateSerializer(employee, data=cleaned_data, partial=True)
        else:
            # Admin can edit all
            serializer = EmployeeUpdateSerializer(employee, data=request.data, partial=True)

        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(EmployeeSerializer(updated).data)

class EmployeeToggleStatusView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser, IsAdminUserRole]

    def post(self, request, pk):
        try:
            employee = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)

        if employee.id == request.user.id:
            return Response(
                {'detail': 'You cannot deactivate your own admin account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_status = (
            User.EmploymentStatus.INACTIVE 
            if employee.employment_status == User.EmploymentStatus.ACTIVE 
            else User.EmploymentStatus.ACTIVE
        )
        employee.employment_status = new_status
        employee.save(update_fields=['employment_status'])
        
        return Response({
            'message': f"Employee status changed to {new_status}.",
            'employee': EmployeeSerializer(employee).data
        }, status=status.HTTP_200_OK)
