import { useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard, Users, ShieldCheck, BarChart3,
  ScrollText, Settings, UserCog, ChevronLeft, ChevronRight, LogOut
} from "lucide-react"
import { useSidebar } from "./SidebarContext"

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/super-admin", icon: LayoutDashboard },
  { key: "user-management", label: "User Management", path: "/super-admin/user-management", icon: Users },
  { key: "module-access", label: "Module Access Control", path: "/super-admin/module-access-control", icon: ShieldCheck },
  { key: "reports", label: "Reports & Analytics", path: "/super-admin/reports", icon: BarChart3 },
  { key: "activity-log", label: "Audit Log", path: "/super-admin/activity-log", icon: ScrollText },
  { key: "settings", label: "System Settings", path: "/super-admin/settings", icon: Settings },
  { key: "staff", label: "Staff Management", path: "/super-admin/staff-management", icon: UserCog }
]

export default function SuperAdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isOpen, toggleSidebar } = useSidebar()

  const isActive = (path: string) =>
    path === "/super-admin" ? location.pathname === "/super-admin" : location.pathname.startsWith(path)

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userRole")
    window.location.href = "/super-admin/login"
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-900 text-white shadow-2xl transition-all duration-300 z-40 border-r border-slate-700 flex flex-col ${
        isOpen ? "w-64" : "w-20"
      }`}
      style={{ background: "linear-gradient(to bottom, #0f172a, #1e293b)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        {isOpen && (
          <h2 className="text-lg font-bold bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            SuperAdmin
          </h2>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-600 rounded-lg transition-all duration-200 ml-auto"
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? (
            <ChevronLeft size={24} className="text-blue-400" />
          ) : (
            <ChevronRight size={24} className="text-blue-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 overflow-y-auto flex-1 pb-20">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                active ? "bg-blue-600 text-white shadow-lg" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
              title={item.label}
            >
              <Icon
                size={22}
                className={`shrink-0 transition-transform group-hover:scale-110 ${
                  active ? "text-white" : "text-slate-400 group-hover:text-slate-300"
                }`}
              />
              {isOpen && <span className="font-medium text-sm">{item.label}</span>}
              {active && !isOpen && <div className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-lg"></div>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700 bg-slate-800/30">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors ${
            !isOpen && "justify-center"
          }`}
          title="Logout"
        >
          <LogOut size={20} className="shrink-0" />
          {isOpen && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  )
}