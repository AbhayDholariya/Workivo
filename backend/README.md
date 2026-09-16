# ⚙️ Workivo HRMS — Backend API

The backend REST API engine for **Workivo HRMS**, built with **Python 3.13**, **Django 5.1**, and **Django REST Framework (DRF)**.

---

## 🚀 Key Technologies
- **Python 3.13 + Django 5.1**: High-performance backend framework.
- **Django REST Framework (DRF)**: RESTful API serialization and endpoints.
- **SimpleJWT**: Stateless JWT authentication (`Bearer` tokens).
- **WhiteNoise & Gunicorn**: Production static asset serving and WSGI HTTP server.
- **SQLite / PostgreSQL**: Dual database support (`USE_POSTGRES` flag).

---

## 📁 Directory Structure

```
backend/
├── manage.py
├── requirements.txt          # Python dependencies
├── seed_data.py              # Seeder for demo organizational data
├── tests_edge_cases.py       # Automated 9-point edge case test suite
├── api/
│   └── index.py              # Vercel Serverless Function entrypoint
├── hrms_core/                # Django core settings & URL routes
├── accounts/                 # Custom User model & BCrypt authentication
├── employees/                # Employee CRUD & EMP-E{xx} auto-ID generator
├── attendance/               # Daily check-in/out logic & timeline
├── leaves/                   # Dual approval pipeline & date overlap validation
└── dashboard/                # Aggregate KPI statistics & metrics
```

---

## 🛠️ Local Setup & Commands

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed organizational data
python seed_data.py

# Run automated tests
python manage.py test tests_edge_cases

# Start local dev server
python manage.py runserver 8000
```

---

## 🧪 Edge Case Verification

Run the automated test suite to verify business rules:
```bash
python manage.py test tests_edge_cases
```

All 9 test cases cover:
- Dual approval requirement.
- Overlapping leave application rejection.
- Attendance conflict blocking.
- Single daily check-in constraint.
- Check-out without check-in prevention.
- Self-approval block for managers.
- HR self-leave application block.
- Inactive user login rejection.
