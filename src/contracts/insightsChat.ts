import {Chat} from "@/contracts/chat";

export interface InsightsChat {
  id: number
  chat_id: number
  score: number
  feedback: string | null
  keys: any[] | null
  created_at: string | null
  updated_at: string | null
  chat: Chat
}
