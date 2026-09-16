import os
import sys

# Add parent directory to python path for Django modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from hrms_core.wsgi import application

app = application
