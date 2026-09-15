from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import date
from accounts.models import User
from accounts.permissions import IsActiveUser
from leaves.models import LeaveRequest
from .models import Attendance
from .serializers import AttendanceSerializer

class AttendanceListView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get(self, request):
        user = request.user
        queryset = Attendance.objects.select_related('user').all()

        # Role-based scoping
        if user.role == User.Role.ADMIN:
            # HR/Admin can view all
            pass
        elif user.role == User.Role.MANAGER:
            # Manager can view their own team's attendance and their own
            queryset = queryset.filter(user__manager=user)
        else:
            # Employee can only view their own attendance
            queryset = queryset.filter(user=user)

        # Filters
        filter_date = request.query_params.get('date')
        if filter_date:
            queryset = queryset.filter(date=filter_date)

        employee_id = request.query_params.get('employee_id')
        if employee_id and user.role in [User.Role.ADMIN, User.Role.MANAGER]:
            queryset = queryset.filter(user__employee_id=employee_id)

        serializer = AttendanceSerializer(queryset[:100], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AttendanceTodayView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get(self, request):
        today = timezone.localdate()
        record = Attendance.objects.filter(user=request.user, date=today).first()
        
        # Also check if on approved leave today
        on_leave = LeaveRequest.objects.filter(
            user=request.user,
            status=LeaveRequest.Status.APPROVED,
            start_date__lte=today,
            end_date__gte=today
        ).first()

        return Response({
            'date': today,
            'hasCheckedIn': bool(record and record.check_in),
            'hasCheckedOut': bool(record and record.check_out),
            'record': AttendanceSerializer(record).data if record else None,
            'onLeave': bool(on_leave),
            'leaveDetails': {
                'type': on_leave.leave_type,
                'reason': on_leave.reason
            } if on_leave else None
        }, status=status.HTTP_200_OK)

class CheckInView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def post(self, request):
        user = request.user
        today = timezone.localdate()
        now = timezone.now()

        # Edge Case 8: Check if user is on approved leave today
        on_leave = LeaveRequest.objects.filter(
            user=user,
            status=LeaveRequest.Status.APPROVED,
            start_date__lte=today,
            end_date__gte=today
        ).first()
        if on_leave:
            return Response(
                {'detail': 'You have an approved leave scheduled for today. Please contact HR if you wish to work.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Edge Case 6: What happens if an employee clicks Check-in twice?
        attendance, created = Attendance.objects.get_or_create(
            user=user,
            date=today,
            defaults={'check_in': now, 'status': Attendance.Status.PRESENT}
        )

        if not created and attendance.check_in:
            check_in_local = timezone.localtime(attendance.check_in).strftime('%H:%M:%S')
            return Response(
                {'detail': f'Already checked in for today at {check_in_local}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not created and not attendance.check_in:
            attendance.check_in = now
            attendance.status = Attendance.Status.PRESENT
            attendance.save()

        return Response({
            'message': 'Checked in successfully.',
            'attendance': AttendanceSerializer(attendance).data
        }, status=status.HTTP_200_OK)

class CheckOutView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def post(self, request):
        user = request.user
        today = timezone.localdate()
        now = timezone.now()

        # Edge Case 7: What happens if an employee tries to Check-out without checking in?
        attendance = Attendance.objects.filter(user=user, date=today).first()
        if not attendance or not attendance.check_in:
            return Response(
                {'detail': 'Cannot check out without checking in first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if attendance.check_out:
            check_out_local = timezone.localtime(attendance.check_out).strftime('%H:%M:%S')
            return Response(
                {'detail': f'Already checked out for today at {check_out_local}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Record check out and compute total working hours
        attendance.check_out = now
        duration_seconds = (now - attendance.check_in).total_seconds()
        total_hours = round(duration_seconds / 3600.0, 2)
        attendance.total_hours = total_hours

        # Attendance status logic: >= 8 hrs = Present, 4 to < 8 hrs = Half Day, < 4 hrs = Half Day / Present with low hours
        if total_hours >= 8.0:
            attendance.status = Attendance.Status.PRESENT
        elif total_hours >= 4.0:
            attendance.status = Attendance.Status.HALF_DAY
        else:
            attendance.status = Attendance.Status.HALF_DAY

        attendance.save()

        return Response({
            'message': f'Checked out successfully. Total hours worked: {total_hours} hrs.',
            'attendance': AttendanceSerializer(attendance).data
        }, status=status.HTTP_200_OK)
