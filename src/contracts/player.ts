import {Param} from "@/contracts/param";
import {PlayerProfile} from "@/contracts/playerProfile";
import {PlayerLogin} from "@/contracts/playerLogin";
import {Deposit} from "@/contracts/deposit";
import {Withdraw} from "@/contracts/withdraw";
import {PlayerStatus} from "@/contracts/playerStatus";
import {PlayerProject} from "@/contracts/playerProject";
import {PlayerProjectSummary} from "@/contracts/playerProjectSummary";
import {SegmentResult} from "@/contracts/segmentResult";
import {PlayerHistory} from "@/contracts/playerHistory";

export interface Player {
  id: number
  email: string
  name: string
  cpf: string | null
  external_id: string | null
  referrer_id: string | null
  identity_project_id?: number | null
  referrer_player?: {
    id: number
    name: string | null
    email: string
    external_id: string | null
  } | null
  gender: string | null
  birthday: string | null
  phone: string | null
  created_at: string
  updated_at: string
  profiles: PlayerProfile[]
  params: Param[]
  logins: PlayerLogin[]
  projects: PlayerProjectSummary[]
  deposits: Deposit[]
  withdraws: Withdraw[]
  statuses: PlayerStatus[]
  player_projects: PlayerProject[]
  segment_results: SegmentResult[]
  historical: PlayerHistory[]
}

/**
 * Item do index de GET /v1/players: colunas de `players` mais os campos
 * injetados pelo backend a partir do profile do projeto primário.
 * Nota: `conset` é um typo do backend — a chave é enviada assim mesmo.
 */
export interface PlayerListItem {
  id: number
  name: string
  email: string
  cpf: string | null
  phone: string | null
  gender: string | null
  birthday: string | null
  created_at: string
  updated_at: string
  external_id: string | null
  referrer_id: string | null
  referrer_player: {
    id: number
    name: string | null
    email: string
    external_id: string | null
  } | null
  project_status: string | null
  deposit_approved: number | null
  deposit_pending: number | null
  deposit_quantity_approved: number | null
  deposit_quantity_pending: number | null
  withdraw_approved: number | null
  withdraw_pending: number | null
  withdraw_quantity_approved: number | null
  withdraw_quantity_pending: number | null
  ggr: number | null
  first_login_at: string | null
  last_login_at: string | null
  is_online: boolean
  last_presence_at: string | null
  first_deposit_value: number | null
  first_deposit_date: string | null
  first_withdraw_value: number | null
  first_withdraw_date: string | null
  last_deposit_value: number | null
  last_deposit_date: string | null
  last_withdraw_value: number | null
  last_withdraw_date: string | null
  average_transaction_value: number | null
  transaction_frequency: number | null
  customer_retention_time: number | null
  retention_rate: number | null
  last_ip: string | null
  last_device: string | null
  has_tags: boolean | null
  conset: string | null
  projects: PlayerProjectSummary[]
}

/**
 * GET /v1/players usa `simplePaginate`: não há `total`/`last_page`.
 */
export interface PlayerListResponse {
  current_page: number
  data: PlayerListItem[]
  per_page: number
  next_page_url: string | null
  prev_page_url: string | null
  first_page_url?: string | null
  from?: number | null
  path?: string
  links?: unknown[]
}

/**
 * Payload de GET /v1/players/{id} (show): dados do player mais os campos
 * agregados injetados pelo backend.
 */
export interface PlayerDetails {
  id: number
  name: string
  email: string
  cpf: string | null
  document: string | null
  phone: string | null
  gender: string | null
  birthday: string | null
  zip_code?: string | null
  street?: string | null
  address_number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  created_at: string
  updated_at: string
  external_id: string | null
  referrer_id: string | null
  identity_project_id: number | null
  status_projeto: string
  status: "inactive" | "active" | "blocked"
  total_deposits: number
  total_withdrawals: number
  deposits_count: number
  withdrawals_count: number
  total_logins: number
  last_ip: string | null
  last_device: string | null
  first_deposit_at: string | null
  first_deposit_value: number | null
  last_deposit_at: string | null
  last_withdrawal_at: string | null
  last_login_at: string | null
  is_online: boolean
  last_presence_at: string | null
  projects: PlayerProjectSummary[]
  referrer_player: {
    id: number
    name: string | null
    email: string
    external_id: string | null
  } | null
  segments: Array<{ name: string }>
  history?: {
    current_page: number
    data: unknown[]
    last_page: number
    per_page: number
    total: number
  }
}
