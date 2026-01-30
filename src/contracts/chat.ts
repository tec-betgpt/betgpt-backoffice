import {User} from "@/contracts/user";
import {Project} from "@/contracts/project";
import {InsightsChat} from "@/contracts/insightsChat";

export interface Chat {
  id: number
  user_id: number
  project_id: number
  title: string | null
  provider: string
  model: string
  temperature: number
  max_tokens: number | null
  stream_enabled: boolean
  mcp_enabled: boolean
  messages: Array<any> | null
  system_prompt: Array<any> | null
  mcp_servers: Array<any> | null
  tools: Array<any> | null
  metadata: Array<any> | null
  total_tokens: number
  total_input_tokens: number
  total_output_tokens: number
  estimated_cost: number
  status: string
  last_message_at: string | null
  last_message_id: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  message_count: number
  last_message: Array<any> | null
  has_attachments: boolean
  stats: Array<any>
  user: User | null
  project: Project | null
  insights_chats: Array<InsightsChat>
}
