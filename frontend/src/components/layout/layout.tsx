import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { AIChatWidget } from "../ui/ai-chat-widget"

export default function SocialServicesLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar open={sidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
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