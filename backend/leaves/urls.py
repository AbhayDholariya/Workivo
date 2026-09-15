from django.urls import path
from .views import (
    LeaveListCreateView,
    LeaveApproveView,
    LeaveRejectView,
    LeaveCancelView
)

urlpatterns = [
    path('', LeaveListCreateView.as_view(), name='leave-list-create'),
    path('<int:pk>/approve/', LeaveApproveView.as_view(), name='leave-approve'),
    path('<int:pk>/reject/', LeaveRejectView.as_view(), name='leave-reject'),
    path('<int:pk>/cancel/', LeaveCancelView.as_view(), name='leave-cancel'),
]
