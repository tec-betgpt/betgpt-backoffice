import {ProtectionList} from "@/contracts/protectionList";
import {User} from "@/contracts/user";

export interface ProtectionListReport {
  id: number
  user_id: number
  protection_list_id: number
  file_path_csv: string
  file_path_xls: string
  file_name: string
  status: 'completed'|'processing'|'failed'|'pending'
  created_at: string
  updated_at: string
  user: User
  protectionList: ProtectionList
}
