from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from attendance.models import Attendance
from leaves.models import LeaveRequest
from django.contrib.auth.hashers import make_password

class EdgeCasesTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Admin
        self.admin = User.objects.create(
            email='admin@test.com', username='admin@test.com', employee_id='EMP-001',
            role=User.Role.ADMIN, password=make_password('pass123')
        )
        
        # Manager 1 (Team A)
        self.manager1 = User.objects.create(
            email='mgr1@test.com', username='mgr1@test.com', employee_id='EMP-002',
            role=User.Role.MANAGER, password=make_password('pass123')
        )
        
        # Manager 2 (Team B)
        self.manager2 = User.objects.create(
            email='mgr2@test.com', username='mgr2@test.com', employee_id='EMP-003',
            role=User.Role.MANAGER, password=make_password('pass123')
        )

        # Employee 1 (Reports to Manager 1)
        self.emp1 = User.objects.create(
            email='emp1@test.com', username='emp1@test.com', employee_id='EMP-004',
            role=User.Role.EMPLOYEE, manager=self.manager1, password=make_password('pass123')
        )

        # Inactive Employee
        self.emp_inactive = User.objects.create(
            email='inactive@test.com', username='inactive@test.com', employee_id='EMP-005',
            role=User.Role.EMPLOYEE, employment_status=User.EmploymentStatus.INACTIVE,
            password=make_password('pass123')
        )

    def test_edge_case_11_inactive_employee_login_blocked(self):
        """Inactive employee cannot log in."""
        res = self.client.post('/api/auth/login/', {'email': 'inactive@test.com', 'password': 'pass123'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('deactivated', str(res.data))

    def test_edge_case_6_check_in_twice(self):
        """Employee cannot check in twice on same day."""
        self.client.force_authenticate(user=self.emp1)
        res1 = self.client.post('/api/attendance/check_in/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        res2 = self.client.post('/api/attendance/check_in/')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Already checked in', str(res2.data))

    def test_edge_case_7_check_out_without_check_in(self):
        """Employee cannot check out without checking in."""
        self.client.force_authenticate(user=self.emp1)
        res = self.client.post('/api/attendance/check_out/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot check out without checking in', str(res.data))

    def test_edge_case_2_end_date_before_start_date(self):
        """Cannot apply leave with end date before start date."""
        self.client.force_authenticate(user=self.emp1)
        today = timezone.localdate()
        res = self.client.post('/api/leaves/', {
            'leave_type': 'CASUAL',
            'start_date': str(today + timedelta(days=5)),
            'end_date': str(today + timedelta(days=2)),
            'reason': 'Vacation'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_edge_case_1_overlapping_leave(self):
        """Cannot apply overlapping leave."""
        self.client.force_authenticate(user=self.emp1)
        today = timezone.localdate()
        # Create first leave
        LeaveRequest.objects.create(
            user=self.emp1,
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=15),
            reason="First trip",
            status=LeaveRequest.Status.APPROVED
        )

        # Attempt overlapping
        res = self.client.post('/api/leaves/', {
            'leave_type': 'CASUAL',
            'start_date': str(today + timedelta(days=12)),
            'end_date': str(today + timedelta(days=18)),
            'reason': 'Overlap trip'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('overlapping', str(res.data).lower())

    def test_edge_case_5_manager_cannot_approve_other_team_leave(self):
        """Manager cannot approve leave for employees not in their team."""
        today = timezone.localdate()
        leave = LeaveRequest.objects.create(
            user=self.emp1, # Belongs to manager1
            start_date=today + timedelta(days=20),
            end_date=today + timedelta(days=22),
            reason="Trip"
        )

        # Manager 2 attempts approval
        self.client.force_authenticate(user=self.manager2)
        res = self.client.post(f'/api/leaves/{leave.id}/approve/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Manager 1 can approve
        self.client.force_authenticate(user=self.manager1)
        res = self.client.post(f'/api/leaves/{leave.id}/approve/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_edge_case_10_manager_self_approval_blocked(self):
        """Manager cannot approve their own leave request."""
        today = timezone.localdate()
        leave = LeaveRequest.objects.create(
            user=self.manager1,
            start_date=today + timedelta(days=25),
            end_date=today + timedelta(days=26),
            reason="Manager day off"
        )
        self.client.force_authenticate(user=self.manager1)
        res = self.client.post(f'/api/leaves/{leave.id}/approve/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('cannot approve your own leave', str(res.data).lower())
