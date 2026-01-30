import {Project} from "@/contracts/project";
import {User} from "@/contracts/user";

export interface HistoryExport {
  id: number
  project_id: number
  history: any[]
  user_id: number
  created_at: string | null
  updated_at: string | null
  user: User
  project: Project
}
