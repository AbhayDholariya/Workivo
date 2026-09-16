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

    print("Creating Demo HR/Admin & 6 Department Managers...")
    # 0. HR / Admin
    admin_user = User.objects.create(
        email='admin@company.com',
        username='admin@company.com',
        employee_id='EMP-A01',
        first_name='Admin',
        last_name='User',
        phone='9876543210',
        department='Human Resources',
        designation='HR Director',
        role=User.Role.ADMIN,
        employment_status=User.EmploymentStatus.ACTIVE,
        joining_date=date(2024, 1, 15),
        is_staff=True,
        is_superuser=True,
        password=make_password('Admin@123')
    )

    # 1. Anil Ahluwalia (Software Development)
    mgr_soft = User.objects.create(
        email='anil@company.com',
        username='anil@company.com',
        employee_id='EMP-M01',
        first_name='Anil',
        last_name='Ahluwalia',
        phone='9876543211',
        department='Software Development',
        designation='Software Development Manager',
        role=User.Role.MANAGER,
        employment_status=User.EmploymentStatus.ACTIVE,
        joining_date=date(2024, 2, 1),
        password=make_password('Manager@123')
    )

    # 2. Ankit Aggarwal (QA Testing)
    mgr_qa = User.objects.create(
        email='ankit@company.com',
        username='ankit@company.com',
        employee_id='EMP-M02',
        first_name='Ankit',
        last_name='Aggarwal',
        phone='9876543212',
        department='QA Testing',
        designation='QA Testing Manager',
        role=User.Role.MANAGER,
        employment_status=User.EmploymentStatus.ACTIVE,
        joining_date=date(2024, 2, 5),
        password=make_password('Manager@123')
    )

    # 3. Balfour Manuel (CyberSecurity)
    mgr_cyber = User.objects.create(
        email='balfour@company.com',
        username='balfour@company.com',
        employee_id='EMP-M03',
        first_name='Balfour',
        last_name='Manuel',
        phone='9876543213',
        department='CyberSecurity',
        designation='CyberSecurity Manager',
        role=User.Role.MANAGER,
        employment_status=User.EmploymentStatus.ACTIVE,
        joining_date=date(2024, 2, 10),
        password=make_password('Manager@123')
    )

    # 4. Harsh Patel (UI/UX Designer)
    mgr_design = User.objects.create(
        email='harsh@company.com',
        username='harsh@company.com',
        employee_id='EMP-M04',
        first_name='Harsh',
        last_name='Patel',
        phone='9876543214',
        department='UI/UX Designer',
        designation='Design Lead',
        role=User.Role.MANAGER,
        employment_status=User.EmploymentStatus.ACTIVE,
        joining_date=date(2024, 3, 1),
        password=make_password('Manager@123')
    )

    # 5. Sarah Connor (Sales & Marketing)
    mgr_sales = User.objects.create(
        email='sarah@company.com',
        username='sarah@company.com',
        employee_id='EMP-M05',
        first_name='Sarah',
        last_name='Connor',
        phone='9876543215',
        department='Sales & Marketing',
        designation='Sales Manager',
        role=User.Role.MANAGER,
        employment_status=User.EmploymentStatus.ACTIVE,
        joining_date=date(2024, 3, 15),
        password=make_password('Manager@123')
    )

    # 6. Alex Ferguson (Technical Support)
    mgr_support = User.objects.create(
        email='alex@company.com',
        username='alex@company.com',
        employee_id='EMP-M06',
        first_name='Alex',
        last_name='Ferguson',
        phone='9876543216',
        department='Technical Support',
        designation='Support Manager',
        role=User.Role.MANAGER,
        employment_status=User.EmploymentStatus.ACTIVE,
        joining_date=date(2024, 4, 1),
        password=make_password('Manager@123')
    )

    print("Creating Respected Employees across all 6 Departments...")

    # EMP-E01 (Software Development)
    emp1 = User.objects.create(
        email='employee@company.com',
        username='employee@company.com',
        employee_id='EMP-E01',
        first_name='John',
        last_name='Doe',
        phone='9876543220',
        department='Software Development',
        designation='Senior Software Developer',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.ACTIVE,
        manager=mgr_soft,
        joining_date=date(2024, 5, 10),
        password=make_password('Employee@123')
    )

    # EMP-E02 (Software Development)
    emp2 = User.objects.create(
        email='rohan@company.com',
        username='rohan@company.com',
        employee_id='EMP-E02',
        first_name='Rohan',
        last_name='Sharma',
        phone='9876543221',
        department='Software Development',
        designation='Backend Developer',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.ACTIVE,
        manager=mgr_soft,
        joining_date=date(2024, 5, 15),
        password=make_password('Employee@123')
    )

    # EMP-E03 (QA Testing)
    emp3 = User.objects.create(
        email='jane@company.com',
        username='jane@company.com',
        employee_id='EMP-E03',
        first_name='Jane',
        last_name='Smith',
        phone='9876543222',
        department='QA Testing',
        designation='Automation QA Engineer',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.ACTIVE,
        manager=mgr_qa,
        joining_date=date(2024, 6, 1),
        password=make_password('Employee@123')
    )

    # EMP-E04 (QA Testing)
    emp4 = User.objects.create(
        email='priya@company.com',
        username='priya@company.com',
        employee_id='EMP-E04',
        first_name='Priya',
        last_name='Verma',
        phone='9876543223',
        department='QA Testing',
        designation='Manual Tester',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.ACTIVE,
        manager=mgr_qa,
        joining_date=date(2024, 6, 10),
        password=make_password('Employee@123')
    )

    # EMP-E05 (CyberSecurity)
    emp5 = User.objects.create(
        email='amit@company.com',
        username='amit@company.com',
        employee_id='EMP-E05',
        first_name='Amit',
        last_name='Kumar',
        phone='9876543224',
        department='CyberSecurity',
        designation='Security Analyst',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.ACTIVE,
        manager=mgr_cyber,
        joining_date=date(2024, 7, 1),
        password=make_password('Employee@123')
    )

    # EMP-E06 (UI/UX Designer)
    emp6 = User.objects.create(
        email='neha@company.com',
        username='neha@company.com',
        employee_id='EMP-E06',
        first_name='Neha',
        last_name='Gupta',
        phone='9876543225',
        department='UI/UX Designer',
        designation='Product Designer',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.ACTIVE,
        manager=mgr_design,
        joining_date=date(2024, 7, 15),
        password=make_password('Employee@123')
    )

    # EMP-E07 (Sales & Marketing)
    emp7 = User.objects.create(
        email='sales.emp@company.com',
        username='sales.emp@company.com',
        employee_id='EMP-E07',
        first_name='David',
        last_name='Kim',
        phone='9876543226',
        department='Sales & Marketing',
        designation='Account Executive',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.ACTIVE,
        manager=mgr_sales,
        joining_date=date(2024, 8, 1),
        password=make_password('Employee@123')
    )

    # EMP-E08 (Technical Support)
    emp8 = User.objects.create(
        email='vikram@company.com',
        username='vikram@company.com',
        employee_id='EMP-E08',
        first_name='Vikram',
        last_name='Singh',
        phone='9876543227',
        department='Technical Support',
        designation='L2 Support Specialist',
        role=User.Role.EMPLOYEE,
        employment_status=User.EmploymentStatus.ACTIVE,
        manager=mgr_support,
        joining_date=date(2024, 8, 10),
        password=make_password('Employee@123')
    )

    print("Creating Sample Attendance Records...")
    today = timezone.localdate()
    yesterday = today - timedelta(days=1)
    two_days_ago = today - timedelta(days=2)

    Attendance.objects.create(
        user=emp1,
        date=two_days_ago,
        check_in=timezone.now() - timedelta(days=2, hours=9),
        check_out=timezone.now() - timedelta(days=2, hours=1),
        total_hours=8.0,
        status=Attendance.Status.PRESENT,
        notes="Full working day"
    )

    Attendance.objects.create(
        user=emp1,
        date=yesterday,
        check_in=timezone.now() - timedelta(days=1, hours=8),
        check_out=timezone.now() - timedelta(days=1, hours=3, minutes=30),
        total_hours=4.5,
        status=Attendance.Status.HALF_DAY
    )

    Attendance.objects.create(
        user=emp3,
        date=yesterday,
        check_in=timezone.now() - timedelta(days=1, hours=9),
        check_out=timezone.now() - timedelta(days=1, hours=1),
        total_hours=8.0,
        status=Attendance.Status.PRESENT
    )

    print("Creating Sample Leave Requests...")
    LeaveRequest.objects.create(
        user=emp1,
        leave_type=LeaveRequest.LeaveType.CASUAL,
        start_date=today + timedelta(days=5),
        end_date=today + timedelta(days=6),
        reason="Personal work at home",
        status=LeaveRequest.Status.PENDING,
        manager_approval=LeaveRequest.ApprovalStatus.PENDING,
        admin_approval=LeaveRequest.ApprovalStatus.PENDING,
    )

    LeaveRequest.objects.create(
        user=emp3,
        leave_type=LeaveRequest.LeaveType.SICK,
        start_date=today + timedelta(days=10),
        end_date=today + timedelta(days=11),
        reason="Medical checkup",
        status=LeaveRequest.Status.APPROVED,
        manager_approval=LeaveRequest.ApprovalStatus.APPROVED,
        admin_approval=LeaveRequest.ApprovalStatus.APPROVED,
        actioned_by=mgr_qa,
        actioned_at=timezone.now()
    )

    print("\n Seed completed successfully!")
    print("="*60)
    print("WORKIVO DEMO CREDENTIALS READY:")
    print("HR / Admin       : admin@company.com    / Admin@123 (EMP-A01)")
    print("Software Mgr     : anil@company.com     / Manager@123 (EMP-M01)")
    print("QA Manager       : ankit@company.com    / Manager@123 (EMP-M02)")
    print("CyberSec Manager : balfour@company.com  / Manager@123 (EMP-M03)")
    print("UI/UX Manager    : harsh@company.com    / Manager@123 (EMP-M04)")
    print("Sales Manager    : sarah@company.com    / Manager@123 (EMP-M05)")
    print("Support Manager  : alex@company.com     / Manager@123 (EMP-M06)")
    print("Employee         : employee@company.com / Employee@123 (EMP-E01)")
    print("="*60)

if __name__ == '__main__':
    seed()
