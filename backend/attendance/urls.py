from django.urls import path
from .views import AttendanceListView, AttendanceTodayView, CheckInView, CheckOutView

urlpatterns = [
    path('', AttendanceListView.as_view(), name='attendance-list'),
    path('today/', AttendanceTodayView.as_view(), name='attendance-today'),
    path('check_in/', CheckInView.as_view(), name='attendance-check-in'),
    path('check_out/', CheckOutView.as_view(), name='attendance-check-out'),
]
