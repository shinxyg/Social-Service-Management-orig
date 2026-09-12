import { useState, useEffect, useRef, useCallback } from "react"
import { Clock, Smartphone, LogIn } from "lucide-react"

// 15 Minutes Inactivity Timeout in milliseconds
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ExpiryReason = "inactivity" | "concurrent" | null;

export function SessionInactivityWatcher() {
  const [expiryReason, setExpiryReason] = useState<ExpiryReason>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);
  const verifyIntervalRef = useRef<any>(null);

  // Check if currently authenticated
  const checkIsAuth = useCallback(() => {
    return (
      sessionStorage.getItem("isAuthenticated") === "true" ||
      localStorage.getItem("isAuthenticated") === "true" ||
      Boolean(sessionStorage.getItem("currentUser"))
    );
  }, []);

  const getCurrentUserEmail = useCallback(() => {
    try {
      const rawUser = sessionStorage.getItem("currentUser") || localStorage.getItem("currentUser");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        return parsed.email || "";
      }
    } catch {}
    return "";
  }, []);

  const getSessionToken = useCallback(() => {
    return sessionStorage.getItem("sessionToken") || "";
  }, []);

  const handleUserActivity = useCallback(() => {
    if (!expiryReason) {
      lastActivityRef.current = Date.now();
    }
  }, [expiryReason]);

  const clearAuthSession = useCallback(() => {
    try {
      sessionStorage.clear();
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userRole");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("user_profile");
      localStorage.removeItem("token");
    } catch {}
  }, []);

  // Check if account was logged into on another device (Single Active Session rule)
  const verifyConcurrentSession = useCallback(async () => {
    if (!checkIsAuth() || expiryReason) return;
    const email = getCurrentUserEmail();
    const token = getSessionToken();

    if (!email || !token) return;

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-session?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email,
          "x-session-token": token,
        },
      });
      const data = await res.json();
      if (data && data.isSessionTerminated) {
        clearAuthSession();
        setExpiryReason("concurrent");
      }
    } catch {
      // Ignore transient network errors during background check
    }
  }, [checkIsAuth, expiryReason, getCurrentUserEmail, getSessionToken, clearAuthSession]);

  useEffect(() => {
    if (!checkIsAuth()) {
      return;
    }

    lastActivityRef.current = Date.now();

    // Listen to user interaction events for 15-minute inactivity tracker
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check every 5 seconds for 15-minute inactivity
    timerRef.current = setInterval(() => {
      if (checkIsAuth()) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          clearAuthSession();
          setExpiryReason("inactivity");
        }
      }
    }, 5000);

    // Initial check for concurrent session
    verifyConcurrentSession();

    // Periodic check every 5 seconds for concurrent device login
    verifyIntervalRef.current = setInterval(() => {
      verifyConcurrentSession();
    }, 5000);

    // Also check immediately when window gains focus or tab becomes visible
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        verifyConcurrentSession();
      }
    };
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (verifyIntervalRef.current) {
        clearInterval(verifyIntervalRef.current);
      }
    };
  }, [checkIsAuth, handleUserActivity, verifyConcurrentSession, clearAuthSession]);

  if (!expiryReason) {
    return null;
  }

  const handleReLogin = () => {
    window.location.href = "/login";
  };

  const isConcurrent = expiryReason === "concurrent";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200 text-center space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xs border ${
            isConcurrent
              ? "bg-blue-50 border-blue-200 text-blue-600"
              : "bg-amber-50 border-amber-200 text-amber-600"
          }`}
        >
          {isConcurrent ? (
            <Smartphone className="w-8 h-8 stroke-[2.2]" />
          ) : (
            <Clock className="w-8 h-8 stroke-[2.2]" />
          )}
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h3
            className="text-2xl font-black text-slate-900 tracking-tight"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            {isConcurrent ? "Session Terminated" : "Session Expired"}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {isConcurrent
              ? "Your account was accessed from another device. You have been logged out for security."
              : "Your session has timed out due to inactivity."}
          </p>
        </div>

        {/* Re-login Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleReLogin}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <LogIn className="w-4 h-4" />
            <span>OK / Re-login</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionInactivityWatcher;
