# 🎨 Workivo HRMS — Frontend Web Application

The frontend portal for **Workivo HRMS**, built with **React.js 19 (Pure JavaScript)**, **Vite 8**, and **Tailwind CSS 3**.

---

## 🚀 Key Technologies
- **React.js 19**: Modern UI component library with Hooks and Context API.
- **Vite 8**: Ultra-fast build tool and local development server.
- **Tailwind CSS 3**: Clean, responsive styling with utility classes.
- **React Router v7**: Client-side routing with protected role-based routes.
- **Lucide React**: Clean modern icon set.
- **React Hot Toast**: Real-time user notification toasts.

---

## 📁 Directory Structure

```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── vercel.json
├── package.json
└── src/
    ├── api/                  # Axios HTTP client with JWT interceptors
    │   ├── client.js
    │   ├── authApi.js
    │   ├── employeeApi.js
    │   ├── attendanceApi.js
    │   ├── leaveApi.js
    │   └── dashboardApi.js
    ├── context/              # AuthContext session state & user role
    ├── components/           # Reusable UI components
    │   ├── Navbar.jsx
    │   ├── Sidebar.jsx
    │   ├── MetricCard.jsx
    │   ├── StatusBadge.jsx
    │   ├── Modal.jsx
    │   └── ProtectedRoute.jsx
    └── pages/                # Application Views
        ├── LoginPage.jsx
        ├── DashboardPage.jsx
        ├── EmployeesPage.jsx
        ├── AttendancePage.jsx
        ├── LeavesPage.jsx
        └── ProfilePage.jsx
```

---

## 🛠️ Local Setup & Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🌐 Environment Variables

Create a `.env` file in `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```
*(In production, set `VITE_API_BASE_URL` to your live deployed backend URL).*
