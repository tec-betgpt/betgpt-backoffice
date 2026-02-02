import {ProjectGoogleAnalyticsGroupSession} from "@/contracts/projectGoogleAnalyticsGroupSession";
import {Project} from "@/contracts/project";

export interface ProjectGoogleAnalytics {
  id: number
  project_id: number
  date: string
  new_users: number
  total_users: number
  first_time_purchasers: number
  active_users: number
  returning_users: number
  paying_active_users_7d: number
  paying_active_users_30d: number
  paying_active_users_90d: number
  engagement_rate: number
  bounce_rate: number
  total_revenue: number
  arppu: number
  arpu: number
  engagement_duration_per_sessions: number
  group_sessions: any[]
  created_at: string
  updated_at: string
  project: Project
  groupSessionDetails: ProjectGoogleAnalyticsGroupSession[]
}
