import { Outlet } from "react-router-dom"
import { SidebarProvider, useSidebar } from "./SidebarContext"
import SuperAdminSidebar from "./SuperAdminSidebar"

function LayoutContent() {
  const { isOpen } = useSidebar()
  return (
    <div className="min-h-screen bg-slate-100">
      <SuperAdminSidebar />
      <main className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-20"} bg-white`}>
        <Outlet />
      </main>
    </div>
  )
}

export default function SuperAdminLayout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  )
}