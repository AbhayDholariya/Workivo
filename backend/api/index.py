import os
import sys
import shutil
from pathlib import Path

# Set Django settings module for Vercel Serverless environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')

# Add backend directory to python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Copy pre-seeded SQLite database to writable /tmp on Vercel container init
try:
    tmp_db = Path('/tmp/db.sqlite3')
    seed_db = Path(BASE_DIR) / 'db.sqlite3'
    if not tmp_db.exists() and seed_db.exists():
        shutil.copy2(seed_db, tmp_db)
except Exception as e:
    print(f"Vercel DB copy notice: {e}")

import django
django.setup()

from django.core.management import call_command
from accounts.models import User

# Ensure database tables exist in /tmp/db.sqlite3
try:
    call_command('migrate', interactive=False)
    if User.objects.count() == 0:
        import seed_data
        seed_data.seed()
except Exception as err:
    print(f"Vercel auto-migration/seed warning: {err}")

from django.core.wsgi import get_wsgi_application

app = get_wsgi_application()
