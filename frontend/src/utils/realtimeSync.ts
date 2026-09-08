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
  module?: "solo_parent" | "child_welfare" | "pwd_senior" | "aics" | "livelihood" | "all"
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

  // 3. Local window custom events
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("govserve_realtime_event", { detail: msg }))
    window.dispatchEvent(new Event("solo_parent_applications_updated"))
    window.dispatchEvent(new Event("pwd_senior_applications_updated"))
    window.dispatchEvent(new Event("child_welfare_applications_updated"))
    window.dispatchEvent(new Event("applications_updated"))
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

  if (channel) {
    channel.addEventListener("message", onChannelMsg)
  }
  window.addEventListener("govserve_realtime_event", onWindowEvent)
  window.addEventListener("solo_parent_applications_updated", onWindowEvent)
  window.addEventListener("pwd_senior_applications_updated", onWindowEvent)
  window.addEventListener("child_welfare_applications_updated", onWindowEvent)
  window.addEventListener("applications_updated", onWindowEvent)
  window.addEventListener("storage", onStorage)

  return () => {
    if (channel) {
      channel.removeEventListener("message", onChannelMsg)
    }
    window.removeEventListener("govserve_realtime_event", onWindowEvent)
    window.removeEventListener("solo_parent_applications_updated", onWindowEvent)
    window.removeEventListener("pwd_senior_applications_updated", onWindowEvent)
    window.removeEventListener("child_welfare_applications_updated", onWindowEvent)
    window.removeEventListener("applications_updated", onWindowEvent)
    window.removeEventListener("storage", onStorage)
  }
}
