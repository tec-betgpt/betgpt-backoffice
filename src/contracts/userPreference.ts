import {Project} from "@/contracts/project";
import {User} from "@/contracts/user";
import {UserProjectGroup} from "@/contracts/userProjectGroup";

export interface UserPreference {
  id: number
  user_id: number
  selected_group_project: number | null
  communication_emails: boolean
  marketing_emails: boolean
  social_emails: boolean
  security_emails: boolean
  auth2fa: boolean
  auth2fa_secret: string | null
  auth2fa_security_code: string | null
  created_at: string
  updated_at: string
  user: User
  project: Project | null
  user_project_group: UserProjectGroup | null
}
