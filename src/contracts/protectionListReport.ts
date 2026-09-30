import {User} from "@/contracts/user";

export interface ProtectionListReport {
  id: number
  user_id: number
  project_id: number
  file_name: string
  /** No index são URLs temporárias de S3; no show são os paths crus do arquivo */
  file_path_csv: string | null
  /** No index são URLs temporárias de S3; no show são os paths crus do arquivo */
  file_path_xls: string | null
  status: 'completed'|'processing'|'failed'|'pending'
  created_at: string
  updated_at: string
  user: User
}
