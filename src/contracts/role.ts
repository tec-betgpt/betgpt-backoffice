import {Project} from "@/contracts/project";

export interface RolePermission {
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
}

/**
 * Payload do index/show de GET /v1/roles. `last_modified_by` é derivado da
 * última atividade registrada no role.
 */
export interface Role {
  id: number
  name: string
  guard_name: string
  title: string | null
  email: string | null
  scope_access: string | null
  scope_default: boolean | number
  project_id: number | null
  created_at: string
  updated_at: string
  permissions: RolePermission[]
  projects?: Project[]
  last_modified_by?: {
    id: number
    name: string
  } | null
}
