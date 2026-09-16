import os
import sys

# Set Django settings module for Vercel Serverless environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')

# Add backend directory to python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from django.core.wsgi import get_wsgi_application

app = get_wsgi_application()
