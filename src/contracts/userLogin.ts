import {User} from "@/contracts/user";

export interface UserLogin {
  id: number
  user_id: number
  ip: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  user: User
}
