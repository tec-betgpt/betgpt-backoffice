import {Service} from "@/contracts/service";
import {User} from "@/contracts/user";
import {Invoice} from "@/contracts/invoice";

export interface ServiceConsumed {
  id: number
  hash: string
  user_id: number
  service_id: number
  user: number
  project: number
  ai_token: number
  email: number
  google_analytics: number
  active_campaign: number
  sms_funnel: number
  deposits: number
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  userRelation: User
  service: Service
  invoices: Invoice[]
}
