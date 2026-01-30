import {TargetAudience} from "@/contracts/targetAudience";

export interface TargetAudienceSync {
  id: number
  target_audience_id: number
  provider: string
  provider_audience_id: string
  status: string
  synced_at: string | null
  last_sync_error: any[] | null
  created_at: string
  updated_at: string
  targetAudience: TargetAudience
}
