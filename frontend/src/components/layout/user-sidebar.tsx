import { NavLink } from "react-router-dom"
import { Building2, ChevronRight, LogOut, FileText, LayoutGrid, Search } from "lucide-react"
import { useLanguage } from "../ui/language-context"

export function UserSidebar({ open }: { open: boolean }) {
  const { t } = useLanguage()

  const portalLinks = [
    { path: "/portal/aics", label: t("navAICS"), icon: FileText },
    { path: "/portal/other-programs", label: t("navOtherPrograms"), icon: LayoutGrid },
    { path: "/portal/track", label: t("navTrackApplication"), icon: Search },
  ]

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
  };

  return (
    <aside
      className={`shrink-0 gradient-sidebar flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-300 ${
        open ? "w-64" : "w-16"
      }`}
    >
      <div className={`flex flex-col h-full ${open ? "w-64" : "w-16"}`}>
        <div className={`p-5 flex items-center gap-3 ${!open && "justify-center px-0"}`}>
          <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          {open && (
            <p className="text-xs text-sidebar-foreground/50 leading-tight">
              {t("socialServicesManagement")}
            </p>
          )}
        </div>

        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          {open && (
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              {t("residentPortal")}
            </p>
          )}
          <div className="flex flex-col gap-1">
            {portalLinks.map(({ path, label, icon: Icon }) => (
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
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-foreground/10">
          <div
            onClick={handleLogout}
            className={`flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-red-500/10 hover:text-red-400 text-sidebar-foreground transition-colors cursor-pointer ${
              !open && "justify-center px-0"
            }`}
          >
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-sidebar-primary to-primary flex items-center justify-center text-xs font-semibold text-white shrink-0">
              U
            </div>
            {open && (
              <>
                <p className="text-sm font-medium truncate flex-1">{t("logOut")}</p>
                <LogOut className="h-4 w-4 text-sidebar-foreground/40 shrink-0" />
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}