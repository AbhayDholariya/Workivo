from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from accounts.models import User
from accounts.permissions import IsActiveUser, IsAdminOrManagerRole
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer, LeaveApplySerializer

class LeaveListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get(self, request):
        user = request.user
        queryset = LeaveRequest.objects.select_related('user', 'actioned_by').all()

        scope = request.query_params.get('scope', 'auto')

        # Role-based scoping
        if user.role == User.Role.ADMIN:
            if scope == 'mine':
                queryset = queryset.filter(user=user)
        elif user.role == User.Role.MANAGER:
            if scope == 'mine':
                queryset = queryset.filter(user=user)
            elif scope == 'team':
                queryset = queryset.filter(user__manager=user)
            else:
                # Default for manager: show team + own
                queryset = queryset.filter(user__manager=user) | queryset.filter(user=user)
        else:
            # Employee can ONLY view own leaves
            queryset = queryset.filter(user=user)

        # Status filter
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        # Employee ID filter
        employee_id = request.query_params.get('employee_id')
        if employee_id and user.role in [User.Role.ADMIN, User.Role.MANAGER]:
            queryset = queryset.filter(user__employee_id=employee_id)

        serializer = LeaveRequestSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = LeaveApplySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        leave = serializer.save(user=request.user)
        return Response(LeaveRequestSerializer(leave).data, status=status.HTTP_201_CREATED)

class LeaveApproveView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser, IsAdminOrManagerRole]

    def post(self, request, pk):
        try:
            leave = LeaveRequest.objects.select_related('user', 'user__manager').get(pk=pk)
        except LeaveRequest.DoesNotExist:
            return Response({'detail': 'Leave request not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Edge Case 10: Can an employee/manager approve their own leave request?
        if leave.user == request.user:
            return Response(
                {'detail': 'You cannot approve your own leave request. It must be approved by HR.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Edge Case 5: Can a manager approve a leave request belonging to another team?
        if request.user.role == User.Role.MANAGER:
            if leave.user.manager != request.user:
                return Response(
                    {'detail': 'Access denied: You can only approve leave requests for your own team members.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        if leave.status != LeaveRequest.Status.PENDING:
            return Response(
                {'detail': f'Cannot approve a request that is already {leave.status.lower()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = LeaveRequest.Status.APPROVED
        leave.actioned_by = request.user
        leave.actioned_at = timezone.now()
        leave.save()

        return Response({
            'message': 'Leave request approved successfully.',
            'leave': LeaveRequestSerializer(leave).data
        }, status=status.HTTP_200_OK)

class LeaveRejectView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser, IsAdminOrManagerRole]

    def post(self, request, pk):
        try:
            leave = LeaveRequest.objects.select_related('user', 'user__manager').get(pk=pk)
        except LeaveRequest.DoesNotExist:
            return Response({'detail': 'Leave request not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Edge Case 10: Can a manager reject their own leave request?
        if leave.user == request.user:
            return Response(
                {'detail': 'You cannot action your own leave request.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Edge Case 5: Boundary check
        if request.user.role == User.Role.MANAGER:
            if leave.user.manager != request.user:
                return Response(
                    {'detail': 'Access denied: You can only reject leave requests for your own team members.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        rejection_reason = request.data.get('rejection_reason', '').strip()
        if not rejection_reason:
            return Response(
                {'detail': 'Rejection reason is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if leave.status != LeaveRequest.Status.PENDING:
            return Response(
                {'detail': f'Cannot reject a request that is already {leave.status.lower()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = LeaveRequest.Status.REJECTED
        leave.rejection_reason = rejection_reason
        leave.actioned_by = request.user
        leave.actioned_at = timezone.now()
        leave.save()

        return Response({
            'message': 'Leave request rejected.',
            'leave': LeaveRequestSerializer(leave).data
        }, status=status.HTTP_200_OK)

class LeaveCancelView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def post(self, request, pk):
        try:
            leave = LeaveRequest.objects.get(pk=pk)
        except LeaveRequest.DoesNotExist:
            return Response({'detail': 'Leave request not found.'}, status=status.HTTP_404_NOT_FOUND)

        # IDOR check: only the owner or admin can cancel
        if leave.user != request.user and request.user.role != User.Role.ADMIN:
            return Response(
                {'detail': 'You can only cancel your own leave requests.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Edge Case 4: Can an employee cancel an already approved or rejected request?
        if leave.status != LeaveRequest.Status.PENDING:
            return Response(
                {'detail': f'Cannot cancel a leave that has already been {leave.status.lower()}. Please contact HR.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = LeaveRequest.Status.CANCELLED
        leave.save(update_fields=['status'])

        return Response({
            'message': 'Leave request cancelled successfully.',
            'leave': LeaveRequestSerializer(leave).data
        }, status=status.HTTP_200_OK)
