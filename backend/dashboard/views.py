from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from accounts.models import User
from accounts.permissions import IsActiveUser
from attendance.models import Attendance
from attendance.serializers import AttendanceSerializer
from leaves.models import LeaveRequest
from leaves.serializers import LeaveRequestSerializer

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get(self, request):
        user = request.user
        today = timezone.localdate()

        if user.role == User.Role.ADMIN:
            # HR / Admin Metrics
            total_employees = User.objects.count()
            active_employees = User.objects.filter(employment_status=User.EmploymentStatus.ACTIVE).count()
            present_today = Attendance.objects.filter(date=today, check_in__isnull=False).count()
            
            # Employees on leave today (active approved leaves)
            on_leave_today = LeaveRequest.objects.filter(
                status=LeaveRequest.Status.APPROVED,
                start_date__lte=today,
                end_date__gte=today
            ).count()
            
            pending_leave_requests = LeaveRequest.objects.filter(
                status=LeaveRequest.Status.PENDING
            ).count()

            recent_leaves = LeaveRequest.objects.select_related('user').filter(
                status=LeaveRequest.Status.PENDING
            )[:5]

            return Response({
                'role': 'ADMIN',
                'stats': {
                    'totalEmployees': total_employees,
                    'activeEmployees': active_employees,
                    'presentToday': present_today,
                    'onLeaveToday': on_leave_today,
                    'pendingLeaveRequests': pending_leave_requests,
                },
                'recentLeaves': LeaveRequestSerializer(recent_leaves, many=True).data
            }, status=status.HTTP_200_OK)

        elif user.role == User.Role.MANAGER:
            # Manager Metrics (Scoped to team)
            team_members = User.objects.filter(manager=user)
            team_ids = team_members.values_list('id', flat=True)

            total_team_members = team_members.count()
            present_today = Attendance.objects.filter(
                user_id__in=team_ids, 
                date=today, 
                check_in__isnull=False
            ).count()

            team_on_leave_today = LeaveRequest.objects.filter(
                user_id__in=team_ids,
                status=LeaveRequest.Status.APPROVED,
                start_date__lte=today,
                end_date__gte=today
            ).count()

            pending_approvals = LeaveRequest.objects.filter(
                user_id__in=team_ids,
                status=LeaveRequest.Status.PENDING
            ).count()

            recent_team_requests = LeaveRequest.objects.select_related('user').filter(
                user_id__in=team_ids,
                status=LeaveRequest.Status.PENDING
            )[:5]

            return Response({
                'role': 'MANAGER',
                'stats': {
                    'totalTeamMembers': total_team_members,
                    'presentToday': present_today,
                    'teamOnLeaveToday': team_on_leave_today,
                    'pendingApprovals': pending_approvals,
                },
                'recentRequests': LeaveRequestSerializer(recent_team_requests, many=True).data
            }, status=status.HTTP_200_OK)

        else:
            # Employee Metrics
            today_record = Attendance.objects.filter(user=user, date=today).first()
            total_leaves = LeaveRequest.objects.filter(user=user).count()
            pending_leaves = LeaveRequest.objects.filter(user=user, status=LeaveRequest.Status.PENDING).count()
            approved_leaves = LeaveRequest.objects.filter(user=user, status=LeaveRequest.Status.APPROVED).count()
            rejected_leaves = LeaveRequest.objects.filter(user=user, status=LeaveRequest.Status.REJECTED).count()

            recent_attendance = Attendance.objects.filter(user=user).order_by('-date')[:5]

            # Today status message
            if not today_record or not today_record.check_in:
                attendance_status_text = 'Not Checked In'
            elif today_record.check_in and not today_record.check_out:
                check_in_local = timezone.localtime(today_record.check_in).strftime('%I:%M %p')
                attendance_status_text = f'Checked In at {check_in_local}'
            else:
                attendance_status_text = f'Checked Out ({today_record.total_hours} hrs)'

            return Response({
                'role': 'EMPLOYEE',
                'stats': {
                    'attendanceStatus': attendance_status_text,
                    'totalLeaves': total_leaves,
                    'pendingLeaves': pending_leaves,
                    'approvedLeaves': approved_leaves,
                    'rejectedLeaves': rejected_leaves,
                },
                'todayRecord': AttendanceSerializer(today_record).data if today_record else None,
                'recentAttendance': AttendanceSerializer(recent_attendance, many=True).data
            }, status=status.HTTP_200_OK)
