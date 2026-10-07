import {User} from "@/contracts/user";
import {Project} from "@/contracts/project";

export interface UserProjectGroup {
  id: number
  uuid: string
  owner_user_id: number
  name: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
  projects: Project[]
  user: User
}

/**
 * Item do filtro de workspace (grupo ou projeto) injetado pelo backend
 * em `user.group_projects` nas respostas de autenticação.
 */
export interface WorkspaceFilterItem {
  id: string
  project_id?: string
  is_selected: boolean
  label: string
  logo: string | null
  name: string
  type: "group" | "project"
}
