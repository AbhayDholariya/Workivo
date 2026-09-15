# AI Development Process & Code Review Report

Prepared for the **AppTrait Solutions Practical Assessment: Vibe Coder**.

---

## 1. AI Development Process (Section 8)

As part of the Vibe Coder workflow, AI tooling was strategically leveraged to accelerate boilerplate creation, architectural modeling, and edge-case discovery. Below is the documentation of 5 pivotal prompts utilized throughout the development cycle.

---

### Prompt 1: Database Schema & Relational Modeling
- **The Prompt**:
  > *"Design a Django model schema for a Mini HRMS with three roles: Admin, Manager, and Employee. We need attendance check-in/out, leave requests, and self-referencing manager hierarchies. Ensure composite unique constraints on daily attendance."*
- **Why You Used It**:
  To quickly outline the foundational relational structure and verify that self-referencing foreign keys for managers and unique constraints on attendance dates are modeled correctly in Django ORM.
- **The AI's Approach / Output**:
  The AI suggested creating a custom user model inheriting `AbstractUser` with `Role` choices, an `Attendance` model with `unique_together = ('user', 'date')`, and a `LeaveRequest` model with a foreign key to `User` for both requester and approver.
- **What You Accepted**:
  Accepted the custom `AbstractUser` pattern, the self-relation `manager = models.ForeignKey('self', ...)` with `related_name='subordinates'`, and the composite constraint on `Attendance`.
- **What You Changed / Rejected**:
  The AI initially suggested using Django's default `username` field as the primary login identifier. Changed `USERNAME_FIELD = 'email'` because corporate SaaS users log in using corporate email, not arbitrary usernames. Also added `employment_status` (`ACTIVE`/`INACTIVE`) to support employee deactivation requirements.

---

### Prompt 2: Robust Date Overlap & Leave Validation
- **The Prompt**:
  > *"Write a Django REST Framework serializer validation method for applying a leave request. We must prevent: 1) end_date before start_date, 2) overlapping with any existing pending or approved leave for the same user, and 3) applying leave on dates where the employee already marked attendance."*
- **Why You Used It**:
  To generate the multi-clause query logic for date overlaps and attendance conflicts without missing boundary edge cases.
- **The AI's Approach / Output**:
  The AI produced a `validate(attrs)` method with standard date comparisons and a filter: `LeaveRequest.objects.filter(user=user, start_date__gte=start_date, end_date__lte=end_date)`.
- **What You Accepted**:
  Accepted the validation structure and the attendance check against `Attendance.objects.filter(...)`.
- **What You Changed / Rejected**:
  **Rejected the AI's date overlap query formula.** The AI's condition (`start_date__gte=start_date, end_date__lte=end_date`) only caught leaves strictly enclosed within the new range, completely failing to catch partial overlaps (e.g. where the new leave starts before and ends midway through an existing leave). Replaced with the mathematically sound interval overlap condition:
  `start_date__lte=new_end_date AND end_date__gte=new_start_date`.

---

### Prompt 3: IDOR Security Guard & Manager Boundary Isolation
- **The Prompt**:
  > *"Implement the leave approval and rejection API views in DRF. Ensure that managers cannot approve leave requests from employees of other teams (IDOR protection) and that a manager cannot approve their own leave request."*
- **Why You Used It**:
  To enforce backend-level authorization rules rather than relying on frontend button visibility.
- **The AI's Approach / Output**:
  The AI generated `LeaveApproveView` checking `request.user.role == 'MANAGER'` and queried the leave object.
- **What You Accepted**:
  Accepted the requirement to check `leave.status == LeaveRequest.Status.PENDING` and updating `actioned_by` and `actioned_at`.
- **What You Changed / Rejected**:
  The AI originally allowed any manager to approve if `request.user.role == 'MANAGER'` without inspecting team membership. Added strict validation:
  `if request.user.role == 'MANAGER' and leave.user.manager != request.user: return Response({'detail': 'Access denied: Employee not in your team'}, status=403)`.
  Also added the self-approval block:
  `if leave.user == request.user: return Response({'detail': 'You cannot approve your own leave request'}, status=403)`.

---

### Prompt 4: Dynamic Real-Database Dashboard Aggregates
- **The Prompt**:
  > *"Create an endpoint /api/dashboard/stats/ that returns real database counts for Admin, Manager, and Employee. No dummy data allowed. For Admin: total headcount, active, present today, on leave today, pending leaves. For Manager: scoped to team. For Employee: today's punch status and leave tallies."*
- **Why You Used It**:
  To aggregate all relevant KPIs in a single round-trip API call for optimal dashboard render performance.
- **The AI's Approach / Output**:
  The AI provided an APIView checking `request.user.role` with `Count()` aggregations and queries for today's records.
- **What You Accepted**:
  Accepted the role-based branching and the calculation of today's attendance status message (`Not Checked In`, `Checked In at HH:MM`, `Checked Out`).
- **What You Changed / Rejected**:
  The AI's original query for `on_leave_today` only checked `start_date == today`. Modified to check active span:
  `start_date__lte=today, end_date__gte=today, status=APPROVED`.

---

### Prompt 5: React Frontend Architecture with 1-Click Demo Fill
- **The Prompt**:
  > *"Scaffold the React login component with Tailwind CSS. Include a 1-click demo credentials bar with quick buttons for Admin, Manager, and Employee so evaluators can test role-based permissions immediately without typing."*
- **Why You Used It**:
  To enhance the evaluator's user experience (UX) during practical assessment grading.
- **The AI's Approach / Output**:
  The AI created a login card with state inputs and three buttons pre-populating email and password state.
- **What You Accepted**:
  Accepted the quick fill buttons, the input fields, and the responsive layout.
- **What You Changed / Rejected**:
  Added immediate `toast.success` notifications indicating which demo account was selected, integrated BCrypt password disclaimer, and handled loading spinners to prevent double submissions.

---

## 2. AI Code Review Challenge (Section 9)

### Challenge Case 1: Flawed Date Overlap Validation in Leave Applications
- **What AI Generated**:
  ```python
  # AI-Generated Code
  overlapping = LeaveRequest.objects.filter(
      user=user,
      status='APPROVED',
      start_date__gte=start_date,
      end_date__lte=end_date
  )
  ```
- **What Was Wrong**:
  1. **Incomplete Overlap Formula**: The `__gte` and `__lte` conditions only detect leaves that are *subsets* of the requested date range. If an existing leave was June 10–15, and the employee applied for June 12–20, this query returned empty because June 10 is not `>= June 12`! The employee could thus book overlapping leaves.
  2. **Ignored Pending Requests**: The AI only filtered by `status='APPROVED'`. An employee could submit multiple `PENDING` leave requests for the exact same week, clogging manager queues.
- **How the Issue Was Identified**:
  During edge-case test suite creation (`tests_edge_cases.py`), test scenario `test_edge_case_1_overlapping_leave` failed when applying for partially overlapping intervals.
- **How It Was Fixed**:
  Implemented the standard mathematical interval intersection formula and included both `PENDING` and `APPROVED` statuses:
  ```python
  # Fixed Code
  overlapping = LeaveRequest.objects.filter(
      user=user,
      status__in=[LeaveRequest.Status.PENDING, LeaveRequest.Status.APPROVED],
      start_date__lte=end_date,
      end_date__gte=start_date
  )
  ```

---

### Challenge Case 2: Insecure Direct Object Reference (IDOR) & Missing Team Isolation
- **What AI Generated**:
  ```python
  # AI-Generated Code
  class LeaveApproveView(APIView):
      permission_classes = [IsAuthenticated]

      def post(self, request, pk):
          if request.user.role not in ['ADMIN', 'MANAGER']:
              return Response({'error': 'Unauthorized'}, status=403)
          
          leave = LeaveRequest.objects.get(pk=pk)
          leave.status = 'APPROVED'
          leave.save()
          return Response({'status': 'approved'})
  ```
- **What Was Wrong**:
  1. **IDOR Vulnerability**: Any manager could pass the ID of any leave request in the database (even from an entirely different department or rival team) and approve it.
  2. **Self-Approval Flaw**: A manager who applied for leave could call this endpoint with their own leave ID and approve their own time off without any HR oversight.
  3. **Already Processed Re-approval**: The code didn't verify if the leave was already `REJECTED` or `CANCELLED`.
- **How the Issue Was Identified**:
  Identified during security architecture audit against PDF Section 14: *"Manager A must not be able to approve leave for another manager's team"* and *"An employee must not be able to approve their own leave request"*.
- **How It Was Fixed**:
  Added defensive verification in `backend/leaves/views.py`:
  ```python
  # Fixed Code
  # 1. Self-approval block
  if leave.user == request.user:
      return Response(
          {'detail': 'You cannot approve your own leave request. It must be approved by HR.'},
          status=status.HTTP_403_FORBIDDEN
      )

  # 2. Team boundary verification
  if request.user.role == User.Role.MANAGER:
      if leave.user.manager != request.user:
          return Response(
              {'detail': 'Access denied: You can only approve leave requests for your own team members.'},
              status=status.HTTP_403_FORBIDDEN
          )

  # 3. State verification
  if leave.status != LeaveRequest.Status.PENDING:
      return Response(
          {'detail': f'Cannot approve a request that is already {leave.status.lower()}.'},
          status=status.HTTP_400_BAD_REQUEST
      )
  ```
