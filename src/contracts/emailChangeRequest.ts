import {User} from "@/contracts/user";

export interface EmailChangeRequest {
  id: number
  user_id: number
  new_email: string
  token: string
  created_at: string | null
  updated_at: string | null
  user: User
}
