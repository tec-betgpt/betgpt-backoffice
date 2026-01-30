import {Invoice} from "@/contracts/invoice";
import {User} from "@/contracts/user";
import {ServiceConsumed} from "@/contracts/serviceConsumed";

export interface Service {
  id: number
  hash: string
  name: string
  is_active: boolean
  price_user_project: number
  price_project: number
  price_ai_token: number
  price_email: number
  price_sync_google_analytics: number
  price_sms_funnel: number
  price_percent_by_deposit: number
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  users: User[]
  serviceConsumeds: ServiceConsumed[]
  invoices: Invoice[]
}
