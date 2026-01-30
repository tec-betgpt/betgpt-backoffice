import {Deposit} from "@/contracts/deposit";

export interface DepositInformation {
  id: number
  deposit_id: number
  pix_code: string | null
  qr_code: string | null
  coupon: string | null
  created_at: string | null
  updated_at: string | null
  deposit: Deposit
}
