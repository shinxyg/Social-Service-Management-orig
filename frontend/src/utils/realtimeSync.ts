// frontend/src/utils/realtimeSync.ts
// Cross-tab and live server synchronization utility for GovServe applications

const CHANNEL_NAME = "govserve_realtime_sync"

let channel: BroadcastChannel | null = null
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME)
  }
} catch (e) {
  console.warn("[RealtimeSync] BroadcastChannel not supported:", e)
}

export interface SyncMessage {
  type: "APPLICATION_SUBMITTED" | "APPLICATION_APPROVED" | "APPLICATION_REJECTED" | "APPLICATION_DELETED" | "STATUS_CHANGED"
  module?: "solo_parent" | "child_welfare" | "pwd_senior" | "aics" | "livelihood" | "case" | "appointment" | "all"
  referenceNumber?: string
  timestamp: number
}

export function notifyApplicationChange(
  type: SyncMessage["type"] = "APPLICATION_SUBMITTED",
  module: SyncMessage["module"] = "all",
  referenceNumber?: string
) {
  const msg: SyncMessage = {
    type,
    module,
    referenceNumber,
    timestamp: Date.now(),
  }

  // 1. BroadcastChannel (instant zero-latency multi-tab dispatch)
  try {
    if (channel) {
      channel.postMessage(msg)
    }
  } catch {}

  // 2. localStorage sync trigger (ensures cross-tab storage event fires)
  try {
    localStorage.setItem("govserve_last_sync_ping", JSON.stringify(msg))
  } catch {}

  // 3. Local window custom events for all modules
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("govserve_realtime_event", { detail: msg }))
    window.dispatchEvent(new Event("solo_parent_applications_updated"))
    window.dispatchEvent(new Event("pwd_senior_applications_updated"))
    window.dispatchEvent(new Event("child_welfare_applications_updated"))
    window.dispatchEvent(new Event("livelihood_status_updated"))
    window.dispatchEvent(new Event("livelihood_applications_updated"))
    window.dispatchEvent(new Event("appointments_updated"))
    window.dispatchEvent(new Event("financial_disbursements_updated"))
    window.dispatchEvent(new Event("financial_aid_updated"))
    window.dispatchEvent(new Event("user_updated"))
    window.dispatchEvent(new Event("case_management_updated"))
    window.dispatchEvent(new Event("applications_updated"))
    window.dispatchEvent(new Event("application_updated"))
    window.dispatchEvent(new Event("storage"))
  }
}

export function subscribeToRealtimeChanges(callback: (msg?: SyncMessage) => void): () => void {
  if (typeof window === "undefined") return () => {}

  // BroadcastChannel listener
  const onChannelMsg = (event: MessageEvent) => {
    callback(event.data)
  }

  // Local custom event listener
  const onWindowEvent = (e: Event) => {
    const customEvt = e as CustomEvent<SyncMessage>
    callback(customEvt.detail)
  }

  // Storage listener for cross-tab ping
  const onStorage = (e: StorageEvent) => {
    if (e.key === "govserve_last_sync_ping" && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue)
        callback(parsed)
      } catch {
        callback()
      }
    }
  }

  // Window focus & visibility change for immediate sync when user switches tabs/devices
  const onVisibilityOrFocus = () => {
    if (document.visibilityState === "visible") {
      callback()
    }
  }

  if (channel) {
    channel.addEventListener("message", onChannelMsg)
  }
  window.addEventListener("govserve_realtime_event", onWindowEvent)
  window.addEventListener("solo_parent_applications_updated", onWindowEvent)
  window.addEventListener("pwd_senior_applications_updated", onWindowEvent)
  window.addEventListener("child_welfare_applications_updated", onWindowEvent)
  window.addEventListener("livelihood_status_updated", onWindowEvent)
  window.addEventListener("livelihood_applications_updated", onWindowEvent)
  window.addEventListener("appointments_updated", onWindowEvent)
  window.addEventListener("financial_disbursements_updated", onWindowEvent)
  window.addEventListener("financial_aid_updated", onWindowEvent)
  window.addEventListener("user_updated", onWindowEvent)
  window.addEventListener("case_management_updated", onWindowEvent)
  window.addEventListener("applications_updated", onWindowEvent)
  window.addEventListener("application_updated", onWindowEvent)
  window.addEventListener("storage", onStorage)
  window.addEventListener("focus", onVisibilityOrFocus)
  document.addEventListener("visibilitychange", onVisibilityOrFocus)

  // Periodic heartbeat every 2.5 seconds for cross-device synchronization
  const heartbeatInterval = setInterval(() => {
    if (document.visibilityState === "visible") {
      callback()
    }
  }, 2500)

  return () => {
    clearInterval(heartbeatInterval)
    if (channel) {
      channel.removeEventListener("message", onChannelMsg)
    }
    window.removeEventListener("govserve_realtime_event", onWindowEvent)
    window.removeEventListener("solo_parent_applications_updated", onWindowEvent)
    window.removeEventListener("pwd_senior_applications_updated", onWindowEvent)
    window.removeEventListener("child_welfare_applications_updated", onWindowEvent)
    window.removeEventListener("livelihood_status_updated", onWindowEvent)
    window.removeEventListener("livelihood_applications_updated", onWindowEvent)
    window.removeEventListener("appointments_updated", onWindowEvent)
    window.removeEventListener("financial_disbursements_updated", onWindowEvent)
    window.removeEventListener("financial_aid_updated", onWindowEvent)
    window.removeEventListener("user_updated", onWindowEvent)
    window.removeEventListener("case_management_updated", onWindowEvent)
    window.removeEventListener("applications_updated", onWindowEvent)
    window.removeEventListener("application_updated", onWindowEvent)
    window.removeEventListener("storage", onStorage)
    window.removeEventListener("focus", onVisibilityOrFocus)
    document.removeEventListener("visibilitychange", onVisibilityOrFocus)
  }
}
