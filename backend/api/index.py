import os
import sys

# Set Django settings module for Vercel Serverless environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')

# Add backend directory to python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import django
django.setup()

from django.core.management import call_command
from accounts.models import User

# Auto-migrate and seed demo database on Vercel container start
try:
    call_command('migrate', interactive=False)
    if User.objects.count() == 0:
        import seed_data
        seed_data.seed()
except Exception as err:
    print(f"Vercel auto-migration/seed warning: {err}")

from django.core.wsgi import get_wsgi_application

app = get_wsgi_application()
