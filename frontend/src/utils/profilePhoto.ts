// Centralized Profile Photo persistence across User Portal, Admin Modules, and Auth
const GLOBAL_PHOTO_KEY = "user_profile_photo"

export function getSavedProfilePhoto(qcid?: string): string | null {
  try {
    if (qcid) {
      const byQcid = localStorage.getItem(`profile_photo_${qcid}`)
      if (byQcid && byQcid.trim()) return byQcid
    }
    const globalPhoto = localStorage.getItem(GLOBAL_PHOTO_KEY)
    if (globalPhoto && globalPhoto.trim()) return globalPhoto

    return (
      localStorage.getItem("profile_photo_110000116932100") ||
      localStorage.getItem("profile_photo_11000015952309") ||
      null
    )
  } catch {
    return null
  }
}

export function saveProfilePhoto(dataUrl: string, qcid?: string) {
  try {
    if (!dataUrl) return
    localStorage.setItem(GLOBAL_PHOTO_KEY, dataUrl)
    if (qcid) {
      localStorage.setItem(`profile_photo_${qcid}`, dataUrl)
    }
    // Also mirror to default QCIDs to ensure it never gets lost across modules or logout
    localStorage.setItem("profile_photo_110000116932100", dataUrl)
    localStorage.setItem("profile_photo_11000015952309", dataUrl)

    // Broadcast change across tabs and components
    window.dispatchEvent(new Event("storage"))
  } catch (e) {
    console.warn("Could not save profile photo:", e)
  }
}
