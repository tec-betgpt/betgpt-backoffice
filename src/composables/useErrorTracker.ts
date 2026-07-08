import { ref, onMounted, onUnmounted } from "vue"
import { useWorkspaceStore } from "@/stores/workspace"
import UserErrors from "@/services/userErrors"

const STORAGE_KEY = "pending_user_errors"
const MAX_STORED_ERRORS = 50
const SEND_DEBOUNCE_MS = 1000

let sendTimeout: ReturnType<typeof setTimeout> | null = null
let isSending = false

function isUserErrorsRequest(url: string) {
  return url.includes("/user-errors")
}

interface ErrorData {
  project_id: number
  error_type: "network" | "js_error" | "unhandled_rejection" | "offline" | "timeout"
  error_message: string
  error_stack?: string
  error_url?: string
  browser_info?: string
  device_info?: string
  session_id?: string
  created_at: string
}

function getDeviceInfo(): string {
  return /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop"
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent
  let browser = "Unknown"
  if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("Chrome")) browser = "Chrome"
  else if (ua.includes("Safari")) browser = "Safari"
  else if (ua.includes("Edge")) browser = "Edge"
  else if (ua.includes("Opera")) browser = "Opera"

  const version = ua.match(/(?:Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/)
  return version ? `${browser} ${version[1]}` : browser
}

function getStorageErrors(): ErrorData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveErrorsToStorage(errors: ErrorData[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(errors.slice(-MAX_STORED_ERRORS)))
  } catch (e) {
    console.error("Failed to save errors to storage:", e)
  }
}

function addErrorToStorage(error: ErrorData) {
  const errors = getStorageErrors()
  errors.push(error)
  saveErrorsToStorage(errors)
}

function resolveActiveProjectId(): number | null {
  const workspaceStore = useWorkspaceStore()
  const raw = workspaceStore.activeGroupProject?.project_id

  if (raw === undefined || raw === null || raw === "") {
    return null
  }

  const parsed = Number(raw)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function resolveErrorProjectId(storedProjectId: number | undefined, fallbackProjectId: number): number {
  const parsedStored = Number(storedProjectId)

  if (Number.isFinite(parsedStored) && parsedStored > 0) {
    return parsedStored
  }

  return fallbackProjectId
}

function scheduleSendPendingErrors() {
  if (sendTimeout) {
    clearTimeout(sendTimeout)
  }

  sendTimeout = setTimeout(() => {
    sendTimeout = null
    void sendPendingErrors()
  }, SEND_DEBOUNCE_MS)
}

export async function sendPendingErrors() {
  if (isSending) {
    scheduleSendPendingErrors()
    return
  }

  const errors = getStorageErrors()
  if (errors.length === 0) return

  const projectId = resolveActiveProjectId()

  if (!projectId) return

  const sessionId = sessionStorage.getItem("session_id") || crypto.randomUUID()
  sessionStorage.setItem("session_id", sessionId)

  const errorsToSend = errors.map(err => ({
    project_id: resolveErrorProjectId(err.project_id, projectId),
    error_type: err.error_type,
    error_message: err.error_message,
    error_stack: err.error_stack,
    error_url: err.error_url,
    browser_info: err.browser_info || getBrowserInfo(),
    device_info: err.device_info || getDeviceInfo(),
    session_id: sessionId,
  }))

  isSending = true

  try {
    await UserErrors.bulkStore(errorsToSend)
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error("Failed to send pending errors:", e)
  } finally {
    isSending = false
  }
}

export function useErrorTracker() {
  const workspaceStore = useWorkspaceStore()
  const sessionId = ref(sessionStorage.getItem("session_id") || crypto.randomUUID())

  if (sessionStorage.getItem("session_id") !== sessionId.value) {
    sessionStorage.setItem("session_id", sessionId.value)
  }

  const captureError = (
    errorType: ErrorData["error_type"],
    message: string,
    stack?: string,
    url?: string
  ) => {
    const projectId = resolveActiveProjectId()
    if (!projectId) return

    const errorData: ErrorData = {
      project_id: projectId,
      error_type: errorType,
      error_message: message,
      error_stack: stack,
      error_url: url || window.location.href,
      browser_info: getBrowserInfo(),
      device_info: getDeviceInfo(),
      session_id: sessionId.value,
      created_at: new Date().toISOString(),
    }

    addErrorToStorage(errorData)
    scheduleSendPendingErrors()
  }

  const handleError = (event: ErrorEvent) => {
    captureError(
      "js_error",
      event.message,
      event.error?.stack,
      event.filename
    )
  }

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    captureError(
      "unhandled_rejection",
      event.reason?.message || String(event.reason),
      event.reason?.stack
    )
  }

  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "unknown"
    const skipTracking = isUserErrorsRequest(url)

    try {
      const response = await originalFetch(...args)
      if (
        !skipTracking
        && (!response.ok || (response.status >= 400 && response.status < 600))
      ) {
        captureError(
          "network",
          `HTTP ${response.status}: ${response.statusText}`,
          `Status: ${response.status}`,
          url
        )
      }
      return response
    } catch (error: any) {
      if (!skipTracking) {
        captureError(
          "network",
          error.message || "Network error",
          error.stack,
          url
        )
      }
      throw error
    }
  }

  onMounted(() => {
    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    window.addEventListener("offline", () => {
      captureError("offline", "Connection lost")
    })
  })

  onUnmounted(() => {
    window.removeEventListener("error", handleError)
    window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    window.fetch = originalFetch
  })

  return {
    captureError,
    sendPendingErrors,
  }
}