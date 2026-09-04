import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"


import UserLayout from "./components/layout/user-layout"
import SocialServicesLayout from "./components/layout/layout"

import { moduleRoutes, defaultModulePath } from "./components/layout/routes"
import { Login } from "./components/entry-login/Login"
import { Register } from "./components/entry-login/Register"
import LandingPage from "./pages/landing"

import AICSUser from "./components/user-portal/aics-user"
import ApplyPWDSenior from "./components/user-portal/apply-pwd-senior"
import ApplySoloParent from "./components/user-portal/apply-solo-parent"
import ApplyLivelihood from "./components/user-portal/apply-livelihood"
import ApplyFinancialAid from "./components/user-portal/apply-financial-aid"
import MyApplications from "./components/user-portal/my-applications"

// Super Admin imports
import SuperAdminLayout from "./components/Super-admin/SuperAdminLayout"
import SuperAdminLogin from "./components/Super-admin/SuperAdminLogin"
import SuperAdminDashboard from "./components/Super-admin/SuperAdminDashboard"
import UserManagement from "./components/Super-admin/UserManagement"
import ModuleAccessControl from "./components/Super-admin/ModuleAccessControl"
import Reports from "./components/Super-admin/Reports"
import ActivityLog from "./components/Super-admin/ActivityLog"
import SystemSettings from "./components/Super-admin/SystemSettings"
import StaffManagement from "./components/Super-admin/StaffManagement"

import { LanguageProvider } from "./components/ui/language-context"

export default function App() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole'); // 'super_admin' | 'staff' | 'user'
  const isSuperAdmin = isAuthenticated && userRole === 'super_admin'
  const isStaff = isAuthenticated && userRole === 'staff';
  const isResident = isAuthenticated && userRole === 'user';
  const homePath = isSuperAdmin ? "/super-admin" : isStaff ? defaultModulePath : "/portal/aics"

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to={homePath} replace />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={homePath} replace />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={homePath} replace />} />

          {/* Super Admin Routes */}
          <Route path="/super-admin/login" element={!isAuthenticated ? <SuperAdminLogin /> : <Navigate to={homePath} replace />} />

          {isSuperAdmin && (
            <Route path="/super-admin" element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="module-access-control" element={<ModuleAccessControl />} />
              <Route path="reports" element={<Reports />} />
              <Route path="activity-log" element={<ActivityLog />} />
              <Route path="settings" element={<SystemSettings />} />
              <Route path="staff-management" element={<StaffManagement />} />
            </Route>
          )}

          {/* Staff Routes */}
          {isStaff && (
            <Route element={<SocialServicesLayout />}>
              <Route index element={<Navigate to={defaultModulePath} replace />} />
              {moduleRoutes.map((mod) => (
                <Route
                  key={mod.path}
                  path={mod.path.slice(1)}
                  element={<mod.Component />}
                />
              ))}
            </Route>
          )}

          {/* Resident Routes */}
          {isResident && (
            <Route element={<UserLayout />}>
              <Route index element={<Navigate to="/portal/aics" replace />} />
              <Route path="/portal" element={<Navigate to="/portal/aics" replace />} />
              <Route path="/portal/aics" element={<AICSUser />} />
              <Route path="/portal/apply-pwd-senior" element={<ApplyPWDSenior />} />
              <Route path="/portal/apply-solo-parent" element={<ApplySoloParent />} />
              <Route path="/portal/apply-livelihood" element={<ApplyLivelihood />} />
              <Route path="/portal/apply-financial-aid" element={<ApplyFinancialAid />} />
              <Route path="/portal/financial-aid" element={<ApplyFinancialAid />} />
              <Route path="/portal/my-applications" element={<MyApplications />} />
            </Route>
          )}

          {/* Catch all */}
          <Route path="*" element={<Navigate to={isAuthenticated ? homePath : "/"} replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}