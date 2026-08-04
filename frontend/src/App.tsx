import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import SocialServicesLayout from "./components/layout/layout"
import UserLayout from "./components/layout/user-layout"

import { moduleRoutes, defaultModulePath } from "./components/layout/routes"
import { Login } from "./components/entry-login/Login"
import { Register } from "./components/entry-login/Register"

import AICSUser from "./components/user-portal/aics-user"
import ApplyPWDSenior from "./components/user-portal/apply-pwd-senior"
import ApplySoloParent from "./components/user-portal/apply-solo-parent"
import ApplyLivelihood from "./components/user-portal/apply-livelihood"
import ApplyFinancialAid from "./components/user-portal/apply-financial-aid"

import { LanguageProvider } from "./components/ui/language-context"

export default function App() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole') === 'staff' ? 'staff' : 'user';
  const isStaff = isAuthenticated && userRole === 'staff';
  const isResident = isAuthenticated && userRole === 'user';
  const homePath = isStaff ? defaultModulePath : "/portal/aics";

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={homePath} replace />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={homePath} replace />} />

          {isStaff && (
            <Route element={<SocialServicesLayout />}>
              <Route index element={<Navigate to={defaultModulePath} replace />} />
              {moduleRoutes.map(({ path, Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
              <Route path="/portal" element={<Navigate to="/portal/aics" replace />} />
              <Route path="/portal/aics" element={<AICSUser />} />
              <Route path="/portal/apply-pwd-senior" element={<ApplyPWDSenior />} />
              <Route path="/portal/apply-solo-parent" element={<ApplySoloParent />} />
              <Route path="/portal/apply-livelihood" element={<ApplyLivelihood />} />
              <Route path="/portal/apply-financial-aid" element={<ApplyFinancialAid />} />
            </Route>
          )}

          {isResident && (
            <Route element={<UserLayout />}>
              <Route index element={<Navigate to="/portal/aics" replace />} />
              <Route path="/portal" element={<Navigate to="/portal/aics" replace />} />
              <Route path="/portal/aics" element={<AICSUser />} />
              <Route path="/portal/apply-pwd-senior" element={<ApplyPWDSenior />} />
              <Route path="/portal/apply-solo-parent" element={<ApplySoloParent />} />
              <Route path="/portal/apply-livelihood" element={<ApplyLivelihood />} />
              <Route path="/portal/apply-financial-aid" element={<ApplyFinancialAid />} />
            </Route>
          )}

          <Route path="*" element={<Navigate to={isAuthenticated ? homePath : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}