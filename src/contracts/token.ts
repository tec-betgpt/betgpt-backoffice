export interface Token {
  id: number
  token: string
  key: string
  data: Array<any>
  valid_until: string
  used_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  is_email: boolean
  is_phone: boolean
  is_valid: boolean
}
