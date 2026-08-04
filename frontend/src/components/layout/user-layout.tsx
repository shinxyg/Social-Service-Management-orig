import { useState, useRef, useEffect } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  ShieldAlert,
  Users,
  Baby,
  GraduationCap,
  Wallet,
  Moon,
  Sun,
  HelpCircle,
  Bell,
  Menu,
  LogOut,
  Building2,
  ChevronRight,
} from "lucide-react"
import { Tooltip } from "../ui/tooltip"
import { AIChatWidget } from "../ui/ai-chat-widget"
import { SettingsModal } from "../ui/settings-modal"

const residentNav = [
  { path: "/portal/aics", label: "AICS", icon: ShieldAlert },
  { path: "/portal/apply-pwd-senior", label: "PWD & Senior Citizen Services", icon: Users },
  { path: "/portal/apply-solo-parent", label: "Solo Parent & Child Welfare", icon: Baby },
  { path: "/portal/apply-livelihood", label: "Livelihood & Training Program", icon: GraduationCap },
  { path: "/portal/apply-financial-aid", label: "Financial Aid Disbursement", icon: Wallet },
]

function Avatar({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-linear-to-br from-primary to-info flex items-center justify-center text-xs font-semibold text-white shrink-0"
    >
      RS
    </div>
  )
}

function ResidentSidebar({ open }: { open: boolean }) {
  return (
    <aside
      className={`shrink-0 gradient-sidebar flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-300 ${
        open ? "w-64" : "w-16"
      }`}
    >
      <div className={`flex flex-col h-full ${open ? "w-64" : "w-16"}`}>
        {/* Brand */}
        <div className={`p-5 flex items-center gap-3 ${!open && "justify-center px-0"}`}>
          <Tooltip label="Social Services Management">
            <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </Tooltip>
          {open && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground leading-tight truncate">
                Social Services
              </p>
              <p className="text-xs text-sidebar-foreground/50 leading-tight">Resident Portal</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <div>
            {open && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                Apply for assistance
              </p>
            )}
            <div className="flex flex-col gap-1">
              {residentNav.map(({ path, label, icon: Icon }) => {
                const link = (
                  <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        !open && "justify-center px-0"
                      } ${
                        isActive
                          ? "bg-sidebar-primary/15 text-sidebar-foreground shadow-soft"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-4.5 w-4.5 shrink-0 ${
                            isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                          }`}
                        />
                        {open && (
                          <>
                            <span className="flex-1 text-left">{label}</span>
                            {isActive && <ChevronRight className="h-4 w-4 text-sidebar-primary" />}
                          </>
                        )}
                      </>
                    )}
                  </NavLink>
                )
                return open ? link : <Tooltip key={path} label={label}>{link}</Tooltip>
              })}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}

function ResidentHeader({
  onToggleSidebar,
  dark,
  onToggleDark,
}: {
  onToggleSidebar: () => void
  dark: boolean
  onToggleDark: () => void
}) {
  const location = useLocation()
  const current = residentNav.find((r) => r.path === location.pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [now, setNow] = useState(new Date())
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userRole")
    window.location.href = "/login"
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Live clock — ticks every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const timeString = now.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const dateString = now.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return (
    <>
    <header className="h-16 sticky top-0 z-40 flex items-center justify-between gap-4 px-4 md:px-6 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <Tooltip label="Toggle sidebar">
          <button
            aria-label="Toggle sidebar"
            onClick={onToggleSidebar}
            className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </Tooltip>
        <p className="text-sm font-medium text-foreground truncate">{current?.label ?? "Welcome"}</p>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Live clock */}
        <div className="hidden sm:flex flex-col items-end leading-tight mr-1 select-none">
          <span className="text-sm font-semibold text-foreground tabular-nums">{timeString}</span>
          <span className="text-[10px] text-muted-foreground">{dateString}</span>
        </div>

        <Tooltip label={dark ? "Switch to light mode" : "Switch to dark mode"}>
          <button
            aria-label="Toggle theme"
            onClick={onToggleDark}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </Tooltip>

        <Tooltip label="Help">
          <button
            aria-label="Help"
            className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </Tooltip>

        <Tooltip label="Notifications">
          <button
            aria-label="Notifications"
            className="relative h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>
        </Tooltip>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-foreground leading-tight">Resident</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Applicant</p>
            </div>
            <Avatar />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-medium py-1.5 z-50">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                Profile
              </button>
              <button
                onClick={() => {
                  setSettingsOpen(true)
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                Settings
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

export default function UserLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <div className="flex min-h-screen bg-background">
      <ResidentSidebar open={sidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <ResidentHeader
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          dark={dark}
          onToggleDark={() => setDark((v) => !v)}
        />
        <main
          key={location.pathname}
          className="flex-1 overflow-y-auto animate-fade-in-up"
          style={{ scrollbarGutter: "stable" }}
        >
          <Outlet />
        </main>
      </div>
      <AIChatWidget />
    </div>
  )
}