import { ref, onMounted, onUnmounted } from "vue"
import { useWorkspaceStore } from "@/stores/workspace"
import UserErrors from "@/services/userErrors"

const STORAGE_KEY = "pending_user_errors"
const MAX_STORED_ERRORS = 50

interface ErrorData {
  project_id: string | number
  error_type: "js_error" | "unhandled_rejection"
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
    const errors = stored ? JSON.parse(stored) : []
    return errors.filter((error: ErrorData) =>
      error.error_type === "js_error" ||
      error.error_type === "unhandled_rejection"
    )
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

export async function sendPendingErrors() {
  const errors = getStorageErrors()
  if (errors.length === 0) return

  const workspaceStore = useWorkspaceStore()
  const activeGroupProject = workspaceStore.activeGroupProject as { project_id?: string | number } | null
  const projectId = activeGroupProject?.project_id

  if (!projectId) return

  const sessionId = sessionStorage.getItem("session_id") || crypto.randomUUID()
  sessionStorage.setItem("session_id", sessionId)

  const errorsToSend = errors.map(err => ({
    project_id: projectId,
    error_type: err.error_type,
    error_message: err.error_message,
    error_stack: err.error_stack,
    error_url: err.error_url,
    browser_info: err.browser_info || getBrowserInfo(),
    device_info: err.device_info || getDeviceInfo(),
    session_id: sessionId,
  }))

  try {
    await Promise.all(
      errorsToSend.map(errorData => UserErrors.store(errorData))
    )
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error("Failed to send pending errors:", e)
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
    const projectId = workspaceStore.activeGroupProject?.id
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
    sendPendingErrors()
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

  onMounted(() => {
    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)
  })

  onUnmounted(() => {
    window.removeEventListener("error", handleError)
    window.removeEventListener("unhandledrejection", handleUnhandledRejection)
  })

  return {
    captureError,
    sendPendingErrors,
  }
}
