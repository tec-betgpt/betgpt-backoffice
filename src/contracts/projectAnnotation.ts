export interface ProjectAnnotation {
  id: number
  project_id: number
  user_id: number
  date: string
  title: string
  date_end: string | null
  chart_name: string
  color: string | null
  resource: string | null
  annotation: string | null
  created_at: string | null
  updated_at: string | null
  project: {
    id: number
    name: string
    logo_url?: string | null
  }
}
