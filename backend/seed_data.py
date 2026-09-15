import os
import django
from datetime import timedelta, date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
django.setup()

from django.utils import timezone
from accounts.models import User
from attendance.models import Attendance
from leaves.models import LeaveRequest
from django.contrib.auth.hashers import make_password

def seed():
    print("Clearing old demo data...")
    LeaveRequest.objects.all().delete()
    Attendance.objects.all().delete()
    User.objects.all().delete()

    print("Creating Demo Users...")
    # 1. HR / Admin
    admin_user = User.objects.create(
        email='admin@company.com',
        username='admin@company.com',
        employee_id='EMP-001',
        first_name='Sarah',
        last_name='Connor',
        phone='+1-555-0100',
        department='Human Resources',
        designation='HR Director',
        role=User.Role.ADMIN,
        employment_status=User.EmploymentStatus.ACTIVE,
        password=make_password('Admin@123')
    )

    # 2. Manager - Engineering
    eng_manager = User.objects.create(
        email='manager@company.com',
        username='manager@company.com',
        employee_id='EMP-002',
        first_name='Alex',
        last_name='Rivera',
        phone='+1-555-0101',
        department='Engineering',
        designation='Engineering Lead',
        role=User.Role.MANAGER,
        employment_status=User.EmploymentStatus.ACTIVE,
        password=make_password('Manager@123')
    )

    # 3. Manager - Sales
    sales_manager = User.objects.create(
        email='sales.manager@company.com',
        username='sales.manager@company.com',
        employee_id='EMP-003',
        first_name='Marcus',
        last_name='Vance',
        phone='+1-555-0102',
        department='Sales & Marketing',
        designation='Sales Director',
        role=User.Role.MANAGER,
        employment_status=User.EmploymentStatus.ACTIVE,
        password=make_password('Manager@123')
    )

    # 4. Employee - Engineering (Reports to Alex)
    emp1 = User.objects.create(
        email='employee@company.com',
        username='employee@company.com',
        employee_id='EMP-004',
        first_name='John',
        last_name='Doe',
        phone='+1-555-0103',
        department='Engineering',
        designation='Senior Software Engineer',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.ACTIVE,
        manager=eng_manager,
        password=make_password('Employee@123')
    )

    # 5. Employee - Engineering 2 (Reports to Alex)
    emp2 = User.objects.create(
        email='jane@company.com',
        username='jane@company.com',
        employee_id='EMP-005',
        first_name='Jane',
        last_name='Smith',
        phone='+1-555-0104',
        department='Engineering',
        designation='Frontend Developer',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.ACTIVE,
        manager=eng_manager,
        password=make_password('Employee@123')
    )

    # 6. Employee - Sales (Reports to Marcus)
    emp_sales = User.objects.create(
        email='sales.emp@company.com',
        username='sales.emp@company.com',
        employee_id='EMP-006',
        first_name='David',
        last_name='Kim',
        phone='+1-555-0105',
        department='Sales & Marketing',
        designation='Account Executive',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.ACTIVE,
        manager=sales_manager,
        password=make_password('Employee@123')
    )

    # 7. Inactive Employee (Deactivated to test inactive login edge case)
    User.objects.create(
        email='inactive.emp@company.com',
        username='inactive.emp@company.com',
        employee_id='EMP-007',
        first_name='Robert',
        last_name='Deact',
        phone='+1-555-0106',
        department='Support',
        designation='Support Analyst',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.INACTIVE,
        manager=admin_user,
        password=make_password('Employee@123')
    )

    print("Creating Sample Attendance Records...")
    today = timezone.localdate()
    yesterday = today - timedelta(days=1)
    two_days_ago = today - timedelta(days=2)

    # History for John Doe
    Attendance.objects.create(
        user=emp1,
        date=two_days_ago,
        check_in=timezone.now() - timedelta(days=2, hours=9),
        check_out=timezone.now() - timedelta(days=2, hours=1),
        total_hours=8.0,
        status=Attendance.Status.PRESENT,
        notes="Regular full working day"
    )

    Attendance.objects.create(
        user=emp1,
        date=yesterday,
        check_in=timezone.now() - timedelta(days=1, hours=8),
        check_out=timezone.now() - timedelta(days=1, hours=3, minutes=30),
        total_hours=4.5,
        status=Attendance.Status.HALF_DAY,
        notes="Half day approved for doctor appointment"
    )

    # Jane's attendance
    Attendance.objects.create(
        user=emp2,
        date=yesterday,
        check_in=timezone.now() - timedelta(days=1, hours=9),
        check_out=timezone.now() - timedelta(days=1, hours=1),
        total_hours=8.0,
        status=Attendance.Status.PRESENT
    )

    print("Creating Sample Leave Requests...")
    # Pending leave request from John Doe to Alex Rivera
    LeaveRequest.objects.create(
        user=emp1,
        leave_type=LeaveRequest.LeaveType.CASUAL,
        start_date=today + timedelta(days=5),
        end_date=today + timedelta(days=6),
        reason="Family function and travel back home",
        status=LeaveRequest.Status.PENDING
    )

    # Approved leave request for Jane Smith
    LeaveRequest.objects.create(
        user=emp2,
        leave_type=LeaveRequest.LeaveType.SICK,
        start_date=today + timedelta(days=10),
        end_date=today + timedelta(days=11),
        reason="Scheduled medical procedure and recovery",
        status=LeaveRequest.Status.APPROVED,
        actioned_by=eng_manager,
        actioned_at=timezone.now()
    )

    # Pending leave request from David Kim to Marcus Vance
    LeaveRequest.objects.create(
        user=emp_sales,
        leave_type=LeaveRequest.LeaveType.PAID,
        start_date=today + timedelta(days=7),
        end_date=today + timedelta(days=9),
        reason="Personal vacation trip",
        status=LeaveRequest.Status.PENDING
    )

    print("\n Seed completed successfully!")
    print("="*60)
    print("DEMO CREDENTIALS READY FOR TESTING:")
    print("HR / Admin : admin@company.com         / Admin@123")
    print("Manager    : manager@company.com       / Manager@123")
    print("Employee   : employee@company.com      / Employee@123")
    print("Sales Mgr  : sales.manager@company.com / Manager@123")
    print("="*60)

if __name__ == '__main__':
    seed()
