import {User} from "@/contracts/user";
import {ProjectSummary} from "@/contracts/projectSummary";

export interface GeneratedReport {
  id: number
  user_id: number
  project_id: number
  name: string
  file_path: string
  disk: string
  status: string
  expires_at: string | null
  created_at: string | null
  updated_at: string | null
  url: string | null
  project?: ProjectSummary | null
  user: User
}
