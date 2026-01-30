import {ProjectGoogleAnalytics} from "@/contracts/projectGoogleAnalytics";

export interface ProjectGoogleAnalyticsGroupSession {
  id: number
  project_google_analytics_id: number
  date: string
  dimension: string
  channel: string
  sessions: number
  engaged_sessions: number
  engagement_rate: number
  average_engagement_duration: number
  events_per_session: number
  event_count: number
  key_events: number
  session_key_event_rate: number
  total_revenue: number
  created_at: string
  updated_at: string
  projectGoogleAnalytics: ProjectGoogleAnalytics
}
