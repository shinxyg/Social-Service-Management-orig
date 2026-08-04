import { useState, useRef, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { HelpCircle, Bell, Menu, User, Settings, Sun, Moon, ShieldAlert, Users, Baby, GraduationCap, Wallet, LifeBuoy, LogOut } from "lucide-react"
import { moduleRoutes } from "./routes"
import { Tooltip } from "../ui/tooltip"
import { SettingsModal } from "../ui/settings-modal"
import { useLanguage } from "../ui/language-context"

export function AppHeader({
  onToggleSidebar,
  dark,
  onToggleDark,
}: {
  onToggleSidebar: () => void
  dark: boolean
  onToggleDark: () => void
}) {
  const { t, language } = useLanguage()
  const location = useLocation()
  const current = moduleRoutes.find((r) => r.path === location.pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [now, setNow] = useState(new Date())
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const helpRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
  };

  const mockNotifications = [
    {
      id: 1,
      title: t("notifAicsTitle"),
      desc: t("notifAicsDesc"),
      time: t("notifTime5min"),
      unread: true,
    },
    {
      id: 2,
      title: t("notifPwdTitle"),
      desc: t("notifPwdDesc"),
      time: t("notifTime1hour"),
      unread: true,
    },
    {
      id: 3,
      title: t("notifFinancialTitle"),
      desc: t("notifFinancialDesc"),
      time: t("notifTimeYesterday"),
      unread: false,
    },
  ]

  const helpTopics = [
    { icon: ShieldAlert, title: t("helpAicsTitle"), desc: t("helpAicsDesc") },
    { icon: Users, title: t("helpPwdTitle"), desc: t("helpPwdDesc") },
    { icon: Baby, title: t("helpSoloTitle"), desc: t("helpSoloDesc") },
    { icon: GraduationCap, title: t("helpLivelihoodTitle"), desc: t("helpLivelihoodDesc") },
    { icon: Wallet, title: t("helpDisbursementTitle"), desc: t("helpDisbursementDesc") },
  ]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false)
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

  const clockLocale = language === "en" ? "en-PH" : "fil-PH"
  const timeString = now.toLocaleTimeString(clockLocale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const dateString = now.toLocaleDateString(clockLocale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const unreadCount = mockNotifications.filter((n) => n.unread).length

  return (
    <>
    <header className="h-16 sticky top-0 z-40 flex items-center justify-between gap-4 px-4 md:px-6 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <Tooltip label={t("toggleSidebar")}>
          <button
            aria-label={t("toggleSidebar")}
            onClick={onToggleSidebar}
            className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </Tooltip>
        <p className="text-sm font-medium text-foreground truncate">
          {current?.label ?? t("socialServicesManagement")}
        </p>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Live clock */}
        <div className="hidden sm:flex flex-col items-end leading-tight mr-1 select-none">
          <span className="text-sm font-semibold text-foreground tabular-nums">{timeString}</span>
          <span className="text-[10px] text-muted-foreground">{dateString}</span>
        </div>

        <Tooltip label={dark ? t("switchToLightMode") : t("switchToDarkMode")}>
          <button
            aria-label="Toggle theme"
            onClick={onToggleDark}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </Tooltip>

        {/* Help & guides with dropdown */}
        <div className="relative" ref={helpRef}>
          <Tooltip label={t("helpAndGuides")}>
            <button
              aria-label="Help"
              onClick={() => setHelpOpen((v) => !v)}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </Tooltip>

          {helpOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-xl shadow-medium z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{t("helpAndGuides")}</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {helpTopics.map((h, i) => {
                  const Icon = h.icon
                  return (
                    <button
                      key={i}
                      className="w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors flex items-start gap-3"
                    >
                      <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{h.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{h.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="px-4 py-2.5 border-t border-border">
                <button className="w-full text-center text-xs font-medium text-primary hover:underline">
                  {t("viewFullDocumentation")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications with dropdown */}
        <div className="relative" ref={notifRef}>
          <Tooltip label={t("notifications")}>
            <button
              aria-label="Notifications"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
              )}
            </button>
          </Tooltip>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-medium z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{t("notifications")}</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {unreadCount} {t("newLabel")}
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <button
                    key={n.id}
                    className="w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors flex items-start gap-2.5"
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                        n.unread ? "bg-primary" : "bg-transparent"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{n.time}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-border">
                <button className="w-full text-center text-xs font-medium text-primary hover:underline">
                  {t("viewAllNotifications")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu with dropdown (Log Out included) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-foreground leading-tight">{t("socialWorker")}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{t("staffRole")}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-primary to-info flex items-center justify-center text-xs font-semibold text-white shrink-0">
              SW
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-medium py-1.5 z-50">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                <User className="h-4 w-4 text-muted-foreground" />
                {t("profile")}
              </button>
              <button
                onClick={() => {
                  setSettingsOpen(true)
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                {t("settings")}
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("logOut")}
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