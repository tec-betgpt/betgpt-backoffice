import api from "@/services/base"

export interface UserError {
  id?: number
  project_id: string | number
  user_id?: number
  error_type: "js_error" | "unhandled_rejection"
  error_message: string
  error_stack?: string
  error_url?: string
  browser_info?: string
  device_info?: string
  session_id?: string
  created_at?: string
  updated_at?: string
}

export default {
  store(data: UserError) {
    return api.post("user-errors", data)
  },

  bulkStore(errors: UserError[]) {
    return api.post("user-errors/bulk", { errors })
  },

  index(params: {
    filter_id?: string
    error_type?: string
    search?: string
    page?: number
    per_page?: number
  }) {
    return api.get("user-errors", { params })
  },

  show(id: number) {
    return api.get(`user-errors/${id}`)
  },
}
