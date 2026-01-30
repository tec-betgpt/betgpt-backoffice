import {User} from "@/contracts/user";
import {Project} from "@/contracts/project";

export interface UserProject {
  id: number
  user_id: number
  project_id: number
  created_at: string
  updated_at: string
  user: User
  project: Project
}
