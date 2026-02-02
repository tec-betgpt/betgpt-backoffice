import {User} from "@/contracts/user";

export interface UserMetadata {
  id: number
  user_id: number
  first_login_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
  user: User
}

