import { useState, useEffect, useRef, useCallback } from "react"
import { Clock, ShieldAlert, LogIn, AlertTriangle } from "lucide-react"

// 15 Minutes Inactivity Timeout in milliseconds
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ExpiryReason = "inactivity" | "concurrent" | null;

export function SessionInactivityWatcher() {
  const [expiryReason, setExpiryReason] = useState<ExpiryReason>(null);
  const [newDeviceInfo, setNewDeviceInfo] = useState<string>("");
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
    const directEmail = sessionStorage.getItem("user_email") || localStorage.getItem("user_email");
    if (directEmail) return directEmail.toLowerCase().trim();
    try {
      const rawUser = sessionStorage.getItem("currentUser") || localStorage.getItem("currentUser");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        return (parsed.email || "").toLowerCase().trim();
      }
    } catch {}
    return "";
  }, []);

  const getSessionToken = useCallback(() => {
    let token = sessionStorage.getItem("sessionToken") || localStorage.getItem("sessionToken");
    if (!token && checkIsAuth()) {
      token = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      sessionStorage.setItem("sessionToken", token);
      localStorage.setItem("sessionToken", token);
    }
    return token || "";
  }, [checkIsAuth]);

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
        if (data.newDevice) {
          const dev = data.newDevice;
          setNewDeviceInfo(`${dev.device_name || dev.device_type || 'Another Device'}${dev.os ? ` (${dev.os})` : ''}`);
        }
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

    // Initial check for concurrent session immediately
    verifyConcurrentSession();

    // Real-time periodic check every 1.5 seconds for concurrent device login
    verifyIntervalRef.current = setInterval(() => {
      verifyConcurrentSession();
    }, 1500);

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border text-center space-y-5 animate-in zoom-in-95 duration-150 ${
        isConcurrent ? "border-red-200" : "border-slate-200"
      }`}>
        {/* Header Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm border ${
            isConcurrent
              ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
              : "bg-amber-50 border-amber-200 text-amber-600"
          }`}
        >
          {isConcurrent ? (
            <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
          ) : (
            <Clock className="w-8 h-8 stroke-[2.2]" />
          )}
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1.5">
            {isConcurrent && <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />}
            <h3
              className={`text-2xl font-black tracking-tight ${
                isConcurrent ? "text-red-700" : "text-slate-900"
              }`}
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              {isConcurrent ? "Na-access sa Ibang Device" : "Session Expired"}
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {isConcurrent
              ? newDeviceInfo
                ? `May nag-login sa iyong account gamit ang bagong device: ${newDeviceInfo}. Na-logout ang device na ito para sa iyong seguridad.`
                : "May bagong device na nag-login sa iyong account. Para sa iyong seguridad, na-terminate ang session sa device na ito sa real-time."
              : "Your session has timed out due to inactivity."}
          </p>
        </div>

        {isConcurrent && (
          <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>Single active session rule: 1 device lamang kada account.</span>
          </div>
        )}

        {/* Re-login Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleReLogin}
            className={`w-full py-3.5 px-6 rounded-xl text-white text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] ${
              isConcurrent
                ? "bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-200"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-200"
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>OK / Mag-login Ulit</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionInactivityWatcher;
