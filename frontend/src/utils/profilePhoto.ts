// Centralized Profile Photo persistence across User Portal, Admin Modules, and Auth
const GLOBAL_PHOTO_KEY = "user_profile_photo"

export function getSavedProfilePhoto(qcid?: string): string | null {
  try {
    if (qcid && qcid.trim()) {
      const clean = qcid.trim()
      const byQcid = localStorage.getItem(`profile_photo_${clean}`)
      if (byQcid && byQcid.trim()) return byQcid
      return null
    }
    const globalPhoto = localStorage.getItem(GLOBAL_PHOTO_KEY)
    if (globalPhoto && globalPhoto.trim()) return globalPhoto

    return null
  } catch {
    return null
  }
}

export function saveProfilePhoto(dataUrl: string, qcid?: string) {
  try {
    if (!dataUrl) return
    localStorage.setItem(GLOBAL_PHOTO_KEY, dataUrl)
    if (qcid && qcid.trim()) {
      const clean = qcid.trim()
      localStorage.setItem(`profile_photo_${clean}`, dataUrl)
    }

    // Broadcast change across tabs and components
    window.dispatchEvent(new Event("storage"))
  } catch (e) {
    console.warn("Could not save profile photo:", e)
  }
}
