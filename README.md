# Workivo — Human Resource Management System

A production-grade, full-stack HRMS developed for a small SaaS company adhering to all specifications and evaluation criteria in the **AppTrait Solutions Practical Assessment: Vibe Coder**.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Demo Credentials](#-demo-credentials)
3. [Technology Stack](#-technology-stack)
4. [System Architecture & Folder Structure](#-system-architecture--folder-structure)
5. [Core Features & Permission Matrix](#-core-features--permission-matrix)
6. [Defensive Business Logic & Edge Cases](#-defensive-business-logic--edge-cases)
7. [Installation & Setup Guide](#-installation--setup-guide)
8. [AI Development Process & Code Review](#-ai-development-process--code-review)
9. [Known Limitations & Future Roadmap](#-known-limitations--future-roadmap)

---

## 🚀 Project Overview

Workivo is designed to manage employee lifecycles, attendance tracking (check-in/check-out with duration calculations), multi-stage leave approvals, and role-specific analytics dashboards for three user tiers:
- **HR / Admin**: Complete organizational oversight, employee creation, deactivation, and global leave/attendance controls.
- **Manager**: Team-scoped oversight, team attendance monitoring, and team leave approvals/rejections with mandatory reasons.
- **Employee**: Self-service portal for punching in/out, viewing personal attendance timeline, applying for leaves, and profile management.

---

## 🔑 Demo Credentials

The database is pre-seeded with realistic organizational data across two distinct departments (Engineering & Sales) to verify team isolation:

| Role | Email | Password | Scope & Notes |
| :--- | :--- | :--- | :--- |
| **HR / Admin** | `admin@company.com` | `Admin@123` | Full access (All employees, attendance, leaves, metrics) |
| **Manager (Eng)** | `manager@company.com` | `Manager@123` | Manages John Doe (`EMP-004`) and Jane Smith (`EMP-005`) |
| **Employee (Eng)**| `employee@company.com` | `Employee@123` | Senior Engineer (John Doe) reporting to Alex Rivera |
| **Manager (Sales)**| `sales.manager@company.com` | `Manager@123` | Manages David Kim (`EMP-006`) — tests team boundary checks |
| **Deactivated User**| `inactive.emp@company.com`| `Employee@123` | Inactive status (tests login block edge case) |

> 💡 **Tip**: The login page includes a **One-Click Demo Credentials** bar to quickly fill and switch accounts without typing!

---

## 🛠️ Technology Stack

- **Frontend**: **React.js 19 (Pure JavaScript)** built with **Vite 8**, **Tailwind CSS 3**, **React Router v7**, and **Lucide React**.
- **Backend**: **Python 3.13 + Django 5.1 + Django REST Framework (DRF)**.
- **Authentication**: **Stateless JWT Tokens** (`djangorestframework-simplejwt`) with **BCrypt password hashing**.
- **Database**: **PostgreSQL** via Django's native ORM (`psycopg2-binary`) with automated fallback to SQLite for zero-friction local testing.
- **Notifications**: **React Hot Toast**.

---

## 📁 System Architecture & Folder Structure

```
HRMS/
├── backend/                      # Python + Django + DRF API
│   ├── manage.py
│   ├── requirements.txt          # Python dependencies
│   ├── tests_edge_cases.py       # Automated unit test suite verifying all 11 edge cases
│   ├── seed_data.py              # Realistic demo seeder
│   ├── hrms_core/                # Django core settings, JWT & global URL routing
│   ├── accounts/                 # Custom User model, BCrypt auth, RBAC permissions
│   ├── employees/                # Employee CRUD, Search, Filter, Deactivate
│   ├── attendance/               # Daily check-in/out, hours computation, history
│   ├── leaves/                   # Leave requests, boundary checks, manager approvals
│   └── dashboard/                # Real-time database KPI aggregates
│
├── frontend/                     # React.js (JavaScript) SPA
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── api/                  # Axios HTTP client with JWT interceptors
│       ├── context/              # AuthContext (user, role, session management)
│       ├── components/           # Navbar, Sidebar, ProtectedRoute, MetricCard, Modal, StatusBadge
│       └── pages/                # Login, Dashboard, Employees, Attendance, Leaves, Profile
│
├── docs/                         # Assessment Specific Documentation
│   ├── PLANNING.md               # Requirement analysis, application flows & DB design
│   └── AI_DEVELOPMENT_REPORT.md  # 5 AI Prompts + 2 AI Code Review Challenges
│
└── README.md                     # Main documentation & setup guide
```

---

## 🛡️ Core Features & Permission Matrix

| Feature | Admin / HR | Manager | Employee | Security Enforcement Rule |
| :--- | :---: | :---: | :---: | :--- |
| **View All Employees** | Yes | No | No | Returns 403 Forbidden for Manager/Employee. |
| **Add Employee** | Yes | No | No | Restricted to `ADMIN`. Generates unique `EMP-XXX`. |
| **Edit Employee** | Yes | No | Own Profile | Employee can only edit personal phone/name; sensitive fields locked. |
| **View Team Employees** | Yes | Yes | No | Manager query scoped strictly to `user.manager == current_user`. |
| **Activate / Deactivate**| Yes | No | No | Inactive accounts are immediately rejected at login. |
| **Mark Attendance** | Optional | Optional | Yes | User ID extracted strictly from verified JWT claims. |
| **View Attendance** | All | Team Only | Own Only | Backend queryset filter prevents unauthorized data leakage. |
| **Apply Leave** | Yes | Yes | Yes | Validated for date order, overlapping intervals, and attendance. |
| **Approve / Reject Leave**| Yes | Team Only | No | Manager cannot approve for other teams (IDOR protection) or approve self. |

---

## 🧪 Defensive Business Logic & Edge Cases

All 11 edge cases specified in PDF Section 7 are handled defensively in the backend API and covered by automated test cases (`python manage.py test tests_edge_cases`):

1. **Overlapping Leave Requests**: Mathematical interval overlap formula (`start_date <= existing.end_date AND end_date >= existing.start_date`) rejects overlapping applications for both `PENDING` and `APPROVED` leaves.
2. **End Date Before Start Date**: Rejected at serializer validation with HTTP 400.
3. **Leave on Date Already Attended**: Checks attendance table; if `PRESENT` or `HALF_DAY` is already recorded, leave submission is blocked.
4. **Employee Cancelling Leave**: Only `PENDING` requests can be cancelled by the requester. `APPROVED` requests require HR intervention.
5. **Manager Approving Another Team's Leave (IDOR)**: API verifies `leave.user.manager == request.user`. Returns HTTP 403 if attempting cross-team action.
6. **Duplicate Daily Check-In**: Database unique constraint on `(user, date)` + view guard returns HTTP 400: *"Already checked in for today."*
7. **Check-Out Without Check-In**: Rejected with HTTP 400: *"Cannot check out without checking in first."*
8. **Check-In While On Approved Leave**: Blocked if today falls within an approved leave range.
9. **Employee Modifying Another's Attendance**: Check-in/out APIs ignore any caller-supplied employee ID and strictly use `request.user` from the authenticated token.
10. **Manager Self-Approval Prevention**: Blocked with HTTP 403: *"You cannot approve your own leave request. It must be approved by HR."*
11. **Deactivated Employee Access**: Blocked at login with HTTP 400: *"Account is deactivated. Please contact HR."*

---

## 💻 Installation & Setup Guide

### Prerequisites
- **Node.js**: v18+ (tested on v24)
- **Python**: v3.10+ (tested on v3.13)
- **Git**
- **PostgreSQL** (optional, SQLite is pre-configured for instant zero-dependency local testing)

---

### Step 1: Backend Setup (Django)

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed demo users and realistic history
python seed_data.py

# Run backend automated edge-case test suite (optional)
python manage.py test tests_edge_cases

# Start Django development server
python manage.py runserver 8000
```
*The Django REST API will be running at `http://localhost:8000/api`.*

---

### Step 2: Frontend Setup (React + Vite)

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```
*The React web portal will be accessible at `http://localhost:5173`.*

---

## 📝 Environment Variables

### Backend (`backend/.env`):
```env
SECRET_KEY=your_django_secret_key
DEBUG=True

# Database Configuration:
# Set USE_POSTGRES=True to connect to a live PostgreSQL database
USE_POSTGRES=False
DB_NAME=hrms_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
```

### Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🤖 AI Development Process & Code Review

Complete details as mandated by PDF Sections 8 & 9 are documented in **[`docs/AI_DEVELOPMENT_REPORT.md`](docs/AI_DEVELOPMENT_REPORT.md)**:
- **5 Detailed AI Prompts**: Covers prompt text, rationale, AI approach, accepted elements, and modifications.
- **2 AI Code Review Challenges**:
  1. *Flawed Date Overlap Validation*: AI used strict subset intervals (`start_date__gte`); fixed with mathematical interval intersection (`start_date__lte=end_date AND end_date__gte=start_date`).
  2. *Insecure Direct Object Reference (IDOR) in Leave Approval*: AI omitted team boundary and self-approval checks; fixed with server-side ownership enforcement.

---

## ⚡ Known Limitations & Future Roadmap

1. **Biometrics & Geofencing**: Per assessment instructions, physical hardware integrations were excluded in favor of clean application logic.
2. **Leave Balance Policies**: Currently records total leave counts; future iterations can add automated annual leave accrual quotas.
3. **Email SMTP Dispatch**: Currently logs leave statuses in-app; can be hooked up to AWS SES or SendGrid for outbound employee emails.

---

*Developed for AppTrait Solutions Assessment | Ghodasar, Ahmedabad.*
