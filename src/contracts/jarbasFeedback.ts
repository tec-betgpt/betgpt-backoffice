import {JarbasConfig} from "@/contracts/jarbasConfig";

export interface JarbasFeedback {
  id: number
  jarbas_config_id: number
  rating: number
  was_helpful: boolean
  suggestions: string
  feedback_date: string
  created_at: string
  updated_at: string
  config: JarbasConfig
}
