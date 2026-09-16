from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root_view(request):
    return JsonResponse({
        'status': 'online',
        'app': 'Workivo HRMS API Engine',
        'message': 'Workivo HRMS Backend is running successfully on Vercel!',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/login/',
            'employees': '/api/employees/',
            'attendance': '/api/attendance/',
            'leaves': '/api/leaves/',
            'dashboard': '/api/dashboard/stats/'
        }
    })

urlpatterns = [
    path('', api_root_view),
    path('api/', api_root_view),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/employees/', include('employees.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/leaves/', include('leaves.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]
