import {JarbasFeedback} from "@/contracts/jarbasFeedback";
import {User} from "@/contracts/user";
import {Project} from "@/contracts/project";

export interface JarbasConfig {
  id: number
  user_id: number
  project_id: number
  whatsapp_number: string
  bot_active: boolean
  user_name: string
  user_role: string
  bot_traits: any[]
  additional_info: string | null
  deactivation_message: string | null
  scheduled_deactivation: string | null
  last_deactivation_date: string | null
  created_at: string
  updated_at: string
  user: User
  project: Project
  feedbacks: JarbasFeedback[]
  latestFeedback: JarbasFeedback | null
}
