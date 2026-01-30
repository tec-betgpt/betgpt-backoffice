import {User} from "@/contracts/user";

export interface Language {
  id: number
  name: string
  slug: string
  default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  users: User[]
}
