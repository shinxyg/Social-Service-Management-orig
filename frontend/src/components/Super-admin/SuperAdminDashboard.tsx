import { useState, useEffect } from "react"
import {
  Users, Clock, CheckCircle, AlertCircle,
  TrendingUp, Settings, Bell, ShieldCheck,
  UserCog, UserRound, ArrowUpRight, ChevronDown, LogOut
} from "lucide-react"

// Simple count-up hook — animates a number from 0 to `target` once `start` becomes true
function useCountUp(target: number, start: boolean, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return
    let raf: number
    const startTimer = setTimeout(() => {
      const startTime = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
        setValue(target * eased)
        if (progress < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(startTimer)
      cancelAnimationFrame(raf)
    }
  }, [start, target, duration, delay])

  return value
}

export default function SuperAdminDashboard() {
  const [profileOpen, setProfileOpen] = useState(false)

  // Bars start at 0 and animate to their real value pagka-mount ng component
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userRole")
    window.location.href = "/super-admin/login"
  }


  // ---- Sample stats (palitan mo na lang later ng galing sa API) ----
  const stats = [
    {
      label: "Total Users",
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "from-blue-500 to-blue-600"
    },
    {
      label: "Active Sessions",
      value: "456",
      change: "+8%",
      icon: Clock,
      color: "from-green-500 to-green-600"
    },
    {
      label: "Completed Tasks",
      value: "789",
      change: "+15%",
      icon: CheckCircle,
      color: "from-purple-500 to-purple-600"
    },
    {
      label: "Pending Issues",
      value: "23",
      change: "-5%",
      icon: AlertCircle,
      color: "from-orange-500 to-orange-600"
    }
  ]

  const quickActions = [
    { title: "View Reports", icon: TrendingUp, color: "bg-blue-600 hover:bg-blue-700" },
    { title: "Manage Users", icon: Users, color: "bg-green-600 hover:bg-green-700" },
    { title: "Settings", icon: Settings, color: "bg-purple-600 hover:bg-purple-700" },
    { title: "Notifications", icon: Bell, color: "bg-orange-600 hover:bg-orange-700" }
  ]

  // ---- Role breakdown ----
  const roleBreakdown = [
    { label: "Super Admin", value: 4, total: 1234, icon: ShieldCheck, color: "bg-blue-600", text: "text-blue-600" },
    { label: "Staff", value: 58, total: 1234, icon: UserCog, color: "bg-purple-600", text: "text-purple-600" },
    { label: "Residents", value: 1172, total: 1234, icon: UserRound, color: "bg-green-600", text: "text-green-600" }
  ]

  // ---- User growth (last 6 months, dummy) ----
  const growth = [
    { month: "Mar", value: 820 },
    { month: "Apr", value: 890 },
    { month: "May", value: 960 },
    { month: "Jun", value: 1020 },
    { month: "Jul", value: 1140 },
    { month: "Aug", value: 1234 }
  ]
  const maxGrowth = Math.max(...growth.map((g) => g.value))

  // ---- Module usage (based sa sidebar modules mo) ----
  const moduleUsage = [
    { label: "AICS", value: 312 },
    { label: "Financial Aid", value: 268 },
    { label: "Case Management", value: 201 },
    { label: "Beneficiary Management", value: 174 },
    { label: "Livelihood Training", value: 130 },
    { label: "PWD & Senior Citizen", value: 96 },
    { label: "Solo Parent/Child Welfare", value: 53 }
  ]
  const maxModule = Math.max(...moduleUsage.map((m) => m.value))

  // ---- Recent activity (mas detailed na, may pangalan at module) ----
  const recentActivity = [
    { user: "Maria Santos", action: "Submitted AICS application", module: "AICS", time: "13 hours ago", status: "Pending" },
    { user: "Juan Dela Cruz", action: "Approved financial aid request", module: "Financial Aid", time: "22 hours ago", status: "Approved" },
    { user: "Admin Reyes", action: "Added new staff account", module: "User Management", time: "9 hours ago", status: "Completed" },
    { user: "Liza Cruz", action: "Updated case file #2291", module: "Case Management", time: "1 day ago", status: "Pending" },
    { user: "Mark Villanueva", action: "Enrolled in livelihood training", module: "Livelihood Training", time: "2 days ago", status: "Completed" }
  ]

  const statusStyle: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-green-100 text-green-700",
    Completed: "bg-blue-100 text-blue-700"
  }

  // Animated percentages for System Health / Performance
  const systemHealthValue = useCountUp(98.5, animate, 1200, 300)
  const performanceValue = useCountUp(94.2, animate, 1200, 500)

  return (
    <div>
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition relative">
              <Bell size={24} className="text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  A
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">Admin</p>
                  <p className="text-xs text-slate-500 leading-tight">Super Admin</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-14 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg bg-linear-to-br ${stat.color}`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                    {stat.change}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <button
                  key={idx}
                  className={`${action.color} text-white rounded-lg p-6 flex flex-col items-center gap-3 transition-all hover:shadow-lg active:scale-95`}
                >
                  <Icon size={32} />
                  <span className="font-semibold text-center">{action.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Role Breakdown + User Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Role Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">User Role Breakdown</h2>
            <div className="space-y-5">
              {roleBreakdown.map((role, idx) => {
                const Icon = role.icon
                const pct = ((role.value / role.total) * 100).toFixed(1)
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={18} className={role.text} />
                        <span className="text-sm font-medium text-slate-700">{role.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {role.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${role.color} rounded-full h-2 transition-all duration-1000 ease-out`}
                        style={{
                          width: animate ? `${pct}%` : "0%",
                          transitionDelay: `${idx * 150}ms`
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{pct}% of total users</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">User Growth</h2>
              <span className="flex items-center gap-1 text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                <ArrowUpRight size={14} /> +50% (6 mos)
              </span>
            </div>
            <div className="flex items-end justify-between gap-3 h-48">
              {growth.map((g, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
                  <span className="text-xs font-semibold text-slate-600 mb-2">{g.value}</span>
                  <div
                    className="w-full max-w-10 bg-linear-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-700 ease-out hover:opacity-80"
                    style={{
                      height: animate ? `${(g.value / maxGrowth) * 100}%` : "0%",
                      transitionDelay: `${idx * 180}ms`
                    }}
                  ></div>
                  <span className="text-xs text-slate-500 mt-2">{g.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Module Usage */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Module Usage</h2>
          <div className="space-y-4">
            {moduleUsage.map((mod, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-44 shrink-0 text-sm text-slate-700">{mod.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-purple-500 to-purple-600 rounded-full h-3 transition-all duration-1000 ease-out"
                    style={{
                      width: animate ? `${(mod.value / maxModule) * 100}%` : "0%",
                      transitionDelay: `${idx * 150}ms`
                    }}
                  ></div>
                </div>
                <span className="w-12 shrink-0 text-sm font-semibold text-slate-900 text-right">
                  {mod.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0"></div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.user} <span className="font-normal text-slate-600">— {item.action}</span>
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.module} · {item.time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${statusStyle[item.status]}`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-xl p-6">
              <h3 className="text-sm font-semibold opacity-90 mb-2">System Health</h3>
              <p className="text-3xl font-bold mb-2">{systemHealthValue.toFixed(1)}%</p>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-1000 ease-out"
                  style={{ width: animate ? "98.5%" : "0%", transitionDelay: "300ms" }}
                ></div>
              </div>
              <p className="text-xs opacity-75 mt-3">All systems operational</p>
            </div>

            <div className="bg-linear-to-br from-purple-600 to-purple-700 text-white rounded-xl p-6">
              <h3 className="text-sm font-semibold opacity-90 mb-2">Performance</h3>
              <p className="text-3xl font-bold mb-2">{performanceValue.toFixed(1)}%</p>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-1000 ease-out"
                  style={{ width: animate ? "94.2%" : "0%", transitionDelay: "450ms" }}
                ></div>
              </div>
              <p className="text-xs opacity-75 mt-3">Excellent performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}