
export type ThemeMode = "auto" | "light" | "dark";

export function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
}

export function getThemePreference(): ThemeMode {
  try {
    const mode = localStorage.getItem("theme_mode");
    if (mode === "dark" || mode === "light") {
      return mode;
    }
    return "auto";
  } catch {
    return "auto";
  }
}

export function getEffectiveTheme(mode: ThemeMode = getThemePreference()): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return isNightTime();
}

export function getInitialTheme(): boolean {

  return isNightTime();
}

export function applyTheme(isDark: boolean = isNightTime(), persist: boolean = false) {
  try {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    if (persist) {
      localStorage.setItem("theme_mode", isDark ? "dark" : "light");
    }
  } catch {}
}

export function setThemeMode(mode: ThemeMode) {
  try {
    if (mode === "auto") {
      localStorage.removeItem("theme_mode");
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme_mode", mode);
      localStorage.setItem("theme", mode);
    }
    const isDark = getEffectiveTheme(mode);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new CustomEvent("theme_changed", { detail: { mode, isDark } }));
  } catch {}
}
