from django.urls import path
from .views import EmployeeListCreateView, EmployeeDetailUpdateView, EmployeeToggleStatusView

urlpatterns = [
    path('', EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('<int:pk>/', EmployeeDetailUpdateView.as_view(), name='employee-detail-update'),
    path('<int:pk>/toggle_status/', EmployeeToggleStatusView.as_view(), name='employee-toggle-status'),
]
