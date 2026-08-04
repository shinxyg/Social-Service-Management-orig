import { useState } from "react"
import { X, User, Mail, ShieldCheck, AlertTriangle } from "lucide-react"

interface ProfileModalProps {
  open: boolean
  onClose: () => void
  name: string
  email: string
  role: string
  registeredVia?: string
}

export function ProfileModal({
  open,
  onClose,
  name,
  email,
  role,
  registeredVia = "Email / Password",
}: ProfileModalProps) {
  const [tab, setTab] = useState<"account" | "personal">("account")

  if (!open) return null

  const handleDeactivate = () => {
    const confirmed = window.confirm(
      "Deactivating your account is a permanent action. All your data will be removed and you will lose access to the portal. Continue?"
    )
    if (confirmed) {
      // TODO: hook up to real deactivate-account API call
      console.log("Account deactivated")
    }
  }

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Deleting your account cannot be undone. All your data will be permanently removed. Continue?"
    )
    if (confirmed) {
      // TODO: hook up to real delete-account API call
      console.log("Account deleted")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header banner */}
        <div className="bg-primary/90 px-6 py-5 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white font-heading font-semibold text-base truncate">{name}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium bg-white/15 text-white px-2 py-0.5 rounded-md">
              <ShieldCheck className="h-3 w-3" />
              Active
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 pt-4 gap-6">
          <button
            onClick={() => setTab("account")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "account"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Account Information
          </button>
          <button
            onClick={() => setTab("personal")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "personal"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Personal Information
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {tab === "account" && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Email Address
                </label>
                <div className="w-full rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground">
                  {email}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Role
                </label>
                <div className="w-full rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground">
                  {role}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Registered via
                </label>
                <div className="w-full rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground">
                  {registeredVia}
                </div>
              </div>
            </div>
          )}

          {tab === "personal" && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <User className="h-3.5 w-3.5" />
                  Full Name
                </label>
                <div className="w-full rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground">
                  {name}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Contact your administrator to update personal information.
              </p>
            </div>
          )}

          {/* Danger Zone */}
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </div>
            <p className="text-xs text-muted-foreground">
              Deactivating your account is a permanent action. All your data will be removed and
              you will lose access to the portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleDeactivate}
                className="flex-1 h-10 rounded-lg bg-destructive text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Deactivate Account
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-10 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}