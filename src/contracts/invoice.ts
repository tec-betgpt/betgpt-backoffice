import {Service} from "@/contracts/service";
import {User} from "@/contracts/user";
import {ServiceConsumed} from "@/contracts/serviceConsumed";

export interface Invoice {
  id: number
  hash: string
  service_consumed_id: number
  user_id: number
  name: string
  period_started_at: string
  period_ended_at: string
  amount: number
  status: string
  raw: any[] | null
  asaas_payment_id?: string | null
  trust_released_at?: string | null
  due_at?: string
  is_paid?: boolean
  can_trust_release?: boolean
  created_at: string | null
  updated_at: string | null
  user: User
  serviceConsumed: ServiceConsumed
  service: Service
}

export interface InvoicePix {
  qr_code_image: string
  copy_paste: string
  expires_at: string | null
}
