import {User} from "@/contracts/user";
import {Project} from "@/contracts/project";

export interface UserProjectGroup {
  id: number
  user_id: number
  name: string
  created_at: string
  updated_at: string
  projects: Project[]
  user: User
}
