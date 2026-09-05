import { useState, useRef, useEffect } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  ShieldAlert,
  Users,
  Baby,
  HeartHandshake,
  GraduationCap,
  Moon,
  Sun,
  Bell,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronDown,
  X,
  FileText,
  Wallet,
} from "lucide-react"
import { Tooltip } from "../ui/tooltip"
import { AIChatWidget } from "../ui/ai-chat-widget"
import { ProfileModal } from "../ui/profile-modal"
import { useLanguage } from "../ui/language-context"
import { getSavedProfilePhoto } from "../../utils/profilePhoto"
import { getCurrentUserProfile, getLoggedInUserQcid } from "../../utils/userProfile"
import { API_BASE } from "../../config/api"

function WheelchairIcon({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="11" cy="5" r="2" />
      <path d="M11 7v8h4l4 5" />
      <path d="M11 11h5" />
      <path d="M7 11.5a5 5 0 1 0 6 7.5" />
      <path d="m14 19 3 3" />
    </svg>
  )
}

interface NavChild {
  path: string
  label: string
}

interface ResidentNavItem {
  id: string
  path?: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavChild[]
}

function getResidentNav(t: (key: string, vars?: Record<string, string>) => string): ResidentNavItem[] {
  return [
    {
      id: "aics",
      label: t("navAICSAssistance"),
      icon: ShieldAlert,
      children: [
        { path: "/portal/aics?type=medical", label: t("aicsMedical") },
        { path: "/portal/aics?type=funeral", label: t("aicsFuneral") },
        { path: "/portal/aics?type=educational", label: t("assistEducational") },
        { path: "/portal/aics?type=material", label: t("aicsMaterial") },
        { path: "/portal/aics?type=food", label: t("aicsFood") },
        { path: "/portal/aics?type=transportation", label: t("aicsTransportation") },
      ],
    },
    {
      id: "pwd",
      label: t("navPWDServices"),
      icon: WheelchairIcon,
      children: [
        { path: "/portal/apply-pwd-senior?category=pwd&type=new", label: t("navNewPwdId") },
        { path: "/portal/apply-pwd-senior?category=pwd&type=renewal", label: t("navRenewalPwdId") },
        { path: "/portal/apply-pwd-senior?category=pwd&type=loss", label: t("navLossPwdId") },
        { path: "/portal/apply-pwd-senior?category=pwd&type=assistance", label: t("navPwdAssistance") },
      ],
    },
    {
      id: "senior",
      label: t("navSeniorServices"),
      icon: Users,
      children: [
        { path: "/portal/apply-pwd-senior?category=senior&type=new", label: t("navNewSeniorId") },
        { path: "/portal/apply-pwd-senior?category=senior&type=renewal", label: t("navRenewalSeniorId") },
        { path: "/portal/apply-pwd-senior?category=senior&type=loss", label: t("navLossSeniorId") },
        { path: "/portal/apply-pwd-senior?category=senior&type=medicine-booklet", label: t("navSeniorMedicineBooklet") },
        { path: "/portal/apply-pwd-senior?category=senior&type=movie-booklet", label: t("navSeniorMovieBooklet") },
        { path: "/portal/apply-pwd-senior?category=senior&type=social-assistance", label: t("navSeniorSocialAssistance") },
      ],
    },
    {
      id: "soloParent",
      label: t("navSoloParentServices"),
      icon: Baby,
      children: [
        { path: "/portal/apply-solo-parent?category=solo-parent&type=new", label: t("navNewSoloParent") },
        { path: "/portal/apply-solo-parent?category=solo-parent&type=renewal", label: t("navRenewalSoloParent") },
        { path: "/portal/apply-solo-parent?category=solo-parent&type=loss", label: t("navLossSoloParent") },
      ],
    },
    {
      id: "childWelfare",
      label: t("navChildWelfareServices"),
      icon: HeartHandshake,
      children: [
        { path: "/portal/apply-solo-parent?category=child-welfare&program=nutritional-assistance", label: t("navChildNutritional") || "Nutritional Assistance" },
        { path: "/portal/apply-solo-parent?category=child-welfare&program=child-protection", label: t("navChildProtection") || "Child Protection Assistance" },
        { path: "/portal/apply-solo-parent?category=child-welfare&program=emergency-assistance", label: t("navChildEmergency") || "Emergency Assistance" },
      ],
    },
    {
      id: "livelihood",
      label: t("navLivelihoodTraining"),
      icon: GraduationCap,
      children: [
        { path: "/portal/apply-livelihood?category=livelihood", label: t("navLivelihoodProgram") },
        { path: "/portal/apply-livelihood?category=training", label: t("navTrainingProgram") },
      ],
    },
    { id: "financialAid", path: "/portal/financial-aid", label: "Financial Aid Disbursement", icon: Wallet },
    { id: "myApplications", path: "/portal/my-applications", label: t("navMyApplications") || "History Application", icon: FileText },
  ]
}


interface AicsNotification {
  id: string
  title: string
  desc: string
  time: string
  unread: boolean
  reason?: string | null
}

function getReadNotifIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem("aics_read_notifs") || "[]")
  } catch {
    return []
  }
}

function markNotifAsRead(id: string) {
  const readIds = getReadNotifIds()
  if (!readIds.includes(id)) {
    localStorage.setItem("aics_read_notifs", JSON.stringify([...readIds, id]))
  }
}

function getDismissedNotifIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem("aics_dismissed_notifs") || "[]")
  } catch {
    return []
  }
}

function dismissNotif(id: string) {
  const dismissedIds = getDismissedNotifIds()
  if (!dismissedIds.includes(id)) {
    localStorage.setItem("aics_dismissed_notifs", JSON.stringify([...dismissedIds, id]))
  }
}

function Avatar({ size = 36 }: { size?: number }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    const readPhoto = () => {
      const qcid = getLoggedInUserQcid()
      const photo = getSavedProfilePhoto(qcid)
      setPhotoUrl(photo)
      setImgFailed(false)
    }
    readPhoto()

    // Basahin ulit kapag na-update ang photo (hal. galing sa ibang tab/window)
    window.addEventListener("storage", readPhoto)
    return () => window.removeEventListener("storage", readPhoto)
  }, [])

  if (photoUrl && !imgFailed) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-xl overflow-hidden shrink-0"
      >
        <img
          src={photoUrl}
          alt="Profile"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-linear-to-br from-primary to-info flex items-center justify-center text-xs font-semibold text-white shrink-0"
    >
      CD
    </div>
  )
}


function ResidentSidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t } = useLanguage()
  const residentNav = getResidentNav(t)
  const location = useLocation()
  const currentFullUrl = location.pathname + location.search

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    aics: true,
    pwd: true,
    senior: true,
    soloParent: true,
    childWelfare: true,
    livelihood: true,
  })

  const toggleExpand = (id: string) => {
    setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleNavClick = (e: React.MouseEvent, targetPath: string) => {
    if (currentFullUrl === targetPath) return
    if ((window as any).__isFormDirty) {
      const confirmLeave = window.confirm("Sigurado ka bang nais mong lumipat ng serbisyo? Mawawala ang kasalukuyang impormasyon na iyong sinasagutan.")
      if (!confirmLeave) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      (window as any).__isFormDirty = false
    }
  }

  return (
    <aside
      className={`shrink-0 gradient-sidebar flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-300 ${
        open ? "w-64" : "w-16"
      }`}
    >
      <div className={`flex flex-col h-full ${open ? "w-64" : "w-16"}`}>
        {/* Brand + Toggle */}
        <div className={`p-5 flex items-center gap-3 ${!open ? "flex-col justify-center px-0" : "justify-between"}`}>
          <div className={`flex items-center gap-3 ${!open && "justify-center"}`}>
            <div className="h-11 w-11 flex items-center justify-center shrink-0">
              <img
                src="/samples/Government Service Integrity Seal.png"
                alt="GovServe"
                className="h-9 w-9 object-contain"
              />
            </div>
            {open && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
                  GovServe
                </p>
                <p className="text-[10px] text-sidebar-foreground/60 font-semibold leading-tight truncate">
                  Citizen Portal
                </p>
              </div>
            )}
          </div>

          <Tooltip label={open ? t("collapseSidebar") : t("expandSidebar")}>
            <button
              aria-label="Toggle sidebar"
              onClick={onToggle}
              className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer ${
                !open && "mt-1"
              }`}
            >
              {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
            </button>
          </Tooltip>
        </div>

        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <div>
            <div className="flex flex-col gap-1.5">
              {residentNav.map((item) => {
                const Icon = item.icon
                const isGroup = !!item.children && item.children.length > 0

                if (isGroup && item.children) {
                  const isAnyChildActive = item.children.some(
                    (child) => currentFullUrl === child.path || (location.pathname === "/portal/apply-pwd-senior" && child.path.includes(location.search))
                  )
                  const isExpanded = expandedMenus[item.id] ?? false

                  const groupHeader = (
                    <div key={item.id} className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                          !open && "justify-center px-0"
                        } ${
                          isAnyChildActive
                            ? "bg-sidebar-primary/10 text-sidebar-foreground"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}
                      >
                        <Icon
                          className={`h-4.5 w-4.5 shrink-0 ${
                            isAnyChildActive ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                          }`}
                        />
                        {open && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown
                              className={`h-4 w-4 text-sidebar-foreground/60 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-sidebar-primary" : ""
                              }`}
                            />
                          </>
                        )}
                      </button>

                      {/* Dropdown items */}
                      {open && isExpanded && (
                        <div className="flex flex-col gap-1 mt-1 pl-4 pr-1">
                          {item.children.map((child) => {
                            const isChildActive = currentFullUrl === child.path

                            return (
                              <NavLink
                                key={child.path}
                                to={child.path}
                                onClick={(e) => handleNavClick(e, child.path)}
                                className={`flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                                  isChildActive
                                    ? "bg-sidebar-primary/20 text-sidebar-primary font-bold shadow-xs border-l-2 border-sidebar-primary"
                                    : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                }`}
                              >
                                <span className="truncate">{child.label}</span>
                              </NavLink>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )

                  return open ? groupHeader : <Tooltip key={item.id} label={item.label}>{groupHeader}</Tooltip>
                }

                // Standard single link
                const path = item.path || ""
                const link = (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={(e) => handleNavClick(e, path)}
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
                            <span className="flex-1 text-left">{item.label}</span>
                            {isActive && <ChevronRight className="h-4 w-4 text-sidebar-primary" />}
                          </>
                        )}
                      </>
                    )}
                  </NavLink>
                )
                const rendered = open ? link : <Tooltip key={path} label={item.label}>{link}</Tooltip>

                // Divider + section label bago ang My Applications (Histories)
                if (item.id === "myApplications" || path === "/portal/my-applications") {
                  return (
                    <div key={`section-${item.id || path}`}>
                      <div className={`my-3 border-t border-sidebar-foreground/10 ${!open && "mx-2"}`} />
                      {open && (
                        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 select-none">
                          {t("navHistories") || "HISTORIES"}
                        </p>
                      )}
                      {rendered}
                    </div>
                  )
                }

                return rendered
              })}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}

function ResidentHeader({
  dark,
  onToggleDark,
}: {
  dark: boolean
  onToggleDark: () => void
}) {
  const { t } = useLanguage()
  const residentNav = getResidentNav(t)
  const location = useLocation()
  const currentFullUrl = location.pathname + location.search

  let currentTitle = "Welcome"
  // 1. Search for exact full URL match (with search params) across ALL items
  for (const item of residentNav) {
    if (item.children) {
      const exactChild = item.children.find((c) => {
        if (c.path === currentFullUrl) return true
        const [cPath, cSearch] = c.path.split("?")
        if (cPath !== location.pathname) return false
        if (!cSearch) return false
        const cParams = new URLSearchParams(cSearch)
        const curParams = new URLSearchParams(location.search)
        let allMatch = true
        cParams.forEach((val, key) => {
          if (curParams.get(key) !== val) allMatch = false
        })
        return allMatch
      })
      if (exactChild) {
        currentTitle = `${item.label} — ${exactChild.label}`
        break
      }
    }
  }

  // 2. If no exact child matched, fall back to pathname matching
  if (currentTitle === "Welcome") {
    for (const item of residentNav) {
      if (item.path === location.pathname) {
        currentTitle = item.label
        break
      }
      if (item.children) {
        const baseChild = item.children.find((c) => c.path.split("?")[0] === location.pathname)
        if (baseChild) {
          currentTitle = item.label
          break
        }
      }
    }
  }
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<AicsNotification[]>([])
  const [selectedNotif, setSelectedNotif] = useState<AicsNotification | null>(null)
  const [now, setNow] = useState(new Date())
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

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
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
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

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const readIds = getReadNotifIds()
        const dismissedIds = getDismissedNotifIds()
        const items: AicsNotification[] = []
        const prof = getCurrentUserProfile()
        const userQcId = prof.qcidNumber || prof.qcidNo || getLoggedInUserQcid()
        const userEmail = (prof.email || "").toLowerCase().trim()
        const userId = String(prof.id || "1")

        // ---- AICS (Only for this logged-in user) ----
        if (userQcId) {
          try {
            const aicsRes = await fetch(`${API_BASE}/api/aics/applications?qcId=${userQcId}`)
            if (aicsRes.ok) {
              const aicsData = await aicsRes.json()
              const relevant = (aicsData.applications || []).filter(
                (app: any) =>
                  (app.status === "approved" || app.status === "rejected") &&
                  (app.qc_id === userQcId || (userEmail && (app.email || "").toLowerCase() === userEmail)) &&
                  !dismissedIds.includes(`aics-${app.id}-${app.status}`)
              )
              relevant.forEach((app: any) => {
                const notifId = `aics-${app.id}-${app.status}`
                const isApproved = app.status === "approved"
                items.push({
                  id: notifId,
                  title: isApproved ? "Na-approve ang AICS Aplikasyon" : "Hindi Na-approve ang AICS Aplikasyon",
                  desc: `${app.assistance_type} — Ref: ${app.reference_no || app.qc_id}`,
                  time: new Date(app.updated_at || app.created_at).toLocaleString("en-PH"),
                  unread: !readIds.includes(notifId),
                })
              })
            }
          } catch {}
        }

        // ---- PWD & Senior Citizen (Only for this user) ----
        try {
          const storedPwd = localStorage.getItem("pwd_senior_applications")
          if (storedPwd) {
            const parsedPwd = JSON.parse(storedPwd)
            if (Array.isArray(parsedPwd)) {
              const userPwdApps = parsedPwd.filter(
                (app: any) =>
                  (app.qcid === userQcId || app.qcId === userQcId || (userEmail && (app.email || "").toLowerCase() === userEmail)) &&
                  (app.status === "approved" || app.status === "rejected") &&
                  !dismissedIds.includes(`pwd-${app.id}-${app.status}`)
              )
              userPwdApps.forEach((app: any) => {
                const notifId = `pwd-${app.id}-${app.status}`
                const isApproved = app.status === "approved"
                items.push({
                  id: notifId,
                  title: isApproved ? "Na-approve ang PWD / Senior Application" : "Hindi Na-approve ang PWD / Senior Application",
                  desc: `${app.serviceType || "PWD/Senior Service"} — Ref: ${app.id}`,
                  time: new Date(app.approvedDate || app.submissionDate || Date.now()).toLocaleString("en-PH"),
                  unread: !readIds.includes(notifId),
                })
              })
            }
          }
        } catch {}

        // ---- Solo Parent (Only for this user) ----
        try {
          const spRes = await fetch(`${API_BASE}/api/solo-parent/user/${userId}`)
          if (spRes.ok) {
            const spData = await spRes.json()
            const relevant = (spData.applications || []).filter(
              (app: any) =>
                (app.application_status === "approved" || app.application_status === "rejected") &&
                !dismissedIds.includes(`sp-${app.id}-${app.application_status}`)
            )
            relevant.forEach((app: any) => {
              const notifId = `sp-${app.id}-${app.application_status}`
              const isApproved = app.application_status === "approved"
              items.push({
                id: notifId,
                title: isApproved ? "Na-approve ang Solo Parent Aplikasyon" : "Hindi Na-approve ang Solo Parent Aplikasyon",
                desc: `Solo Parent — Ref: ${app.reference_number}`,
                time: new Date(app.updated_at || app.created_at).toLocaleString("en-PH"),
                unread: !readIds.includes(notifId),
                reason: app.rejection_reason || null,
              })
            })
          }
        } catch {}

        // ---- Child Welfare (Only for this user) ----
        try {
          const cwRes = await fetch(`${API_BASE}/api/child-welfare/user/${userId}`)
          if (cwRes.ok) {
            const cwData = await cwRes.json()
            const relevant = (cwData.applications || []).filter(
              (app: any) =>
                (app.application_status === "approved" || app.application_status === "rejected") &&
                !dismissedIds.includes(`cw-${app.id}-${app.application_status}`)
            )
            relevant.forEach((app: any) => {
              const notifId = `cw-${app.id}-${app.application_status}`
              const isApproved = app.application_status === "approved"
              items.push({
                id: notifId,
                title: isApproved ? "Na-approve ang Child Welfare Aplikasyon" : "Hindi Na-approve ang Child Welfare Aplikasyon",
                desc: `Child Welfare — Ref: ${app.reference_number}`,
                time: new Date(app.updated_at || app.created_at).toLocaleString("en-PH"),
                unread: !readIds.includes(notifId),
              })
            })
          }
        } catch {}

        // ---- Livelihood & Training (Only for this user) ----
        try {
          const storedLiv = localStorage.getItem("livelihood_applications")
          if (storedLiv) {
            const parsedLiv = JSON.parse(storedLiv)
            if (Array.isArray(parsedLiv)) {
              const userLivApps = parsedLiv.filter(
                (app: any) =>
                  (app.qcId === userQcId || app.qcid === userQcId || (userEmail && (app.email || "").toLowerCase() === userEmail)) &&
                  (app.status === "approved" || app.status === "rejected") &&
                  !dismissedIds.includes(`liv-${app.id}-${app.status}`)
              )
              userLivApps.forEach((app: any) => {
                const notifId = `liv-${app.id}-${app.status}`
                const isApproved = app.status === "approved"
                items.push({
                  id: notifId,
                  title: isApproved ? "Na-approve ang Livelihood Application" : "Hindi Na-approve ang Livelihood Application",
                  desc: `${app.programName || "Livelihood"} — Ref: ${app.id}`,
                  time: new Date(app.approvedDate || app.createdAt || Date.now()).toLocaleString("en-PH"),
                  unread: !readIds.includes(notifId),
                })
              })
            }
          }
        } catch {}

        items.sort((a, b) => Number(b.unread) - Number(a.unread))
        setNotifications(items)
      } catch {}
    }

    fetchNotifs()
    const interval = setInterval(fetchNotifs, 4000)
    const handleNotifUpdate = () => fetchNotifs()
    window.addEventListener("user_notifications_updated", handleNotifUpdate)
    window.addEventListener("storage", handleNotifUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener("user_notifications_updated", handleNotifUpdate)
      window.removeEventListener("storage", handleNotifUpdate)
    }
  }, [])

  const unreadNotifCount = notifications.filter((n) => n.unread).length

  const handleNotifClick = (id: string) => {
    markNotifAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
    const notif = notifications.find((n) => n.id === id)
    if (notif) {
      setSelectedNotif(notif)
      setNotifOpen(false)
    }
  }

  const handleDismissNotif = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    dismissNotif(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

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
        <p className="text-sm font-semibold text-foreground truncate">{currentTitle}</p>
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
                <div className="relative" ref={notifRef}>
          <Tooltip label={t("notifications")}>
            <button
              aria-label={t("notifications")}
              onClick={() => setNotifOpen((v) => !v)}
              className="relative h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                </span>
              )}
            </button>
          </Tooltip>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-medium z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{t("notifications")}</span>
                {unreadNotifCount > 0 && (
                  <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {t("newBadge", { count: String(unreadNotifCount) })}
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n.id)}
                      className="w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors flex items-start gap-2.5 cursor-pointer group"
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
                      <button
                        onClick={(e) => handleDismissNotif(e, n.id)}
                        aria-label="Alisin ang notification"
                        className="shrink-0 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("noNewNotifications")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-muted transition-colors cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-foreground leading-tight">{t("hiUserShort", { name: (() => {
                try {
                  const u = JSON.parse(localStorage.getItem("currentUser") || "{}");
                  return u.firstName || u.first_name || "Resident";
                } catch {
                  return "Resident";
                }
              })() })}</p>            
            </div>
            <Avatar />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-medium py-1.5 z-50">
              <button
                onClick={() => {
                  setProfileOpen(true)
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                {t("profile")}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                {t("logOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    <ProfileModal
      open={profileOpen}
      onClose={() => setProfileOpen(false)}
      role="Resident"
    />
    {selectedNotif && (
  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-medium p-5 mx-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{selectedNotif.title}</h3>
        <button
          onClick={() => setSelectedNotif(null)}
          className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{selectedNotif.desc}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{selectedNotif.time}</p>

      {selectedNotif.reason ? (
        <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5">
          <p className="text-xs font-semibold text-destructive">Rason ng Pagtanggi</p>
          <p className="text-sm text-destructive/90 mt-1">{selectedNotif.reason}</p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground italic">Walang karagdagang detalye.</p>
      )}

      <button
        onClick={() => setSelectedNotif(null)}
        className="mt-4 w-full rounded-xl bg-muted hover:bg-muted/70 text-foreground text-sm font-medium py-2 transition-colors"
      >
        Isara
      </button>
    </div>
  </div>
)}
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

  useEffect(() => {
    const handlePopState = () => {
      if ((window as any).__isFormDirty) {
        const confirmLeave = window.confirm("Sigurado ka bang nais mong bumalik? Mawawala ang kasalukuyang impormasyon na iyong sinasagutan.")
        if (!confirmLeave) {
          window.history.pushState(null, "", window.location.href)
        } else {
          (window as any).__isFormDirty = false
        }
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ResidentSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      <div className="flex-1 flex flex-col min-w-0">
        <ResidentHeader
          dark={dark}
          onToggleDark={() => setDark((v) => !v)}
        />
        <main
          key={location.pathname}
          className="flex-1 overflow-y-auto animate-fade-in-up relative"
          style={{ scrollbarGutter: "stable" }}
        >
          <Outlet />
        </main>
      </div>
      <AIChatWidget />
    </div>
  )
}