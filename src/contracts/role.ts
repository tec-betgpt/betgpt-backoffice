import {User} from "@/contracts/user";

export interface Role {
  id: number
  name: string
  guard_name: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  permissions: Array<{
    id: number
    name: string
    guard_name: string
    created_at: string
    updated_at: string
    deleted_at?: string | null
    pivot?: {
      role_id: number
      permission_id: number
    }
  }>
  users: User[]
}
