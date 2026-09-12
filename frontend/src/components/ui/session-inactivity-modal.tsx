import React, { useState, useEffect, useRef, useCallback } from "react"
import { Lock, LogIn } from "lucide-react"

// 15 Minutes Inactivity Timeout in milliseconds
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export function SessionInactivityWatcher() {
  const [isExpired, setIsExpired] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  // Check if currently authenticated
  const checkIsAuth = useCallback(() => {
    return (
      sessionStorage.getItem("isAuthenticated") === "true" ||
      localStorage.getItem("isAuthenticated") === "true" ||
      Boolean(sessionStorage.getItem("currentUser"))
    );
  }, []);

  const handleUserActivity = useCallback(() => {
    if (!isExpired) {
      lastActivityRef.current = Date.now();
    }
  }, [isExpired]);

  const handleLogoutAndExpire = useCallback(() => {
    try {
      sessionStorage.clear();
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userRole");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("user_profile");
      localStorage.removeItem("token");
    } catch {}
    setIsExpired(true);
  }, []);

  useEffect(() => {
    if (!checkIsAuth()) {
      return;
    }

    lastActivityRef.current = Date.now();

    // Listen to user interaction events
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check every 5 seconds if 15 minutes of inactivity has elapsed
    timerRef.current = setInterval(() => {
      if (checkIsAuth()) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          handleLogoutAndExpire();
        }
      }
    }, 5000);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [checkIsAuth, handleUserActivity, handleLogoutAndExpire]);

  if (!isExpired) {
    return null;
  }

  const handleReLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200 text-center space-y-5 animate-in zoom-in-95 duration-150">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h3
            className="text-2xl font-black text-slate-900 tracking-tight"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            🔒 Session Expired
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Your session has timed out due to inactivity.
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
