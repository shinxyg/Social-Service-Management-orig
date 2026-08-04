import { NavLink } from "react-router-dom"
import { Building2, ChevronRight, FileText, LayoutGrid, Search } from "lucide-react"
import { moduleRoutes } from "./routes"
import { Tooltip } from "../ui/tooltip"

const portalLinks = [
  { path: "/portal/aics", label: "AICS", icon: FileText },
  { path: "/portal/other-programs", label: "Other Programs", icon: LayoutGrid },
  { path: "/portal/track", label: "Track Application", icon: Search },
]

export function AppSidebar({ open }: { open: boolean }) {
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
            <div>
              <p className="text-xs text-sidebar-foreground/50 leading-tight">
                Social Services Management
              </p>
            </div>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <div>
            {open && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                Modules
              </p>
            )}
            <div className="flex flex-col gap-1">
              {moduleRoutes.map(({ path, label, icon: Icon }) => {
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

                return open ? (
                  link
                ) : (
                  <Tooltip key={path} label={label}>
                    {link}
                  </Tooltip>
                )
              })}
            </div>
          </div>

          {/* Views */}
          <div className="mt-4 pt-4 border-t border-sidebar-foreground/10">
            {open && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                Views
              </p>
            )}
            <div className="flex flex-col gap-1">
              {portalLinks.map(({ path, label, icon: Icon }) => {
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

                return open ? (
                  link
                ) : (
                  <Tooltip key={path} label={label}>
                    {link}
                  </Tooltip>
                )
              })}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}