export interface ProjectAnnotation {
  id: number
  project_id: number
  user_id: number
  date: string
  chart_name: string
  color: string | null
  annotation: string
  created_at: string | null
  updated_at: string | null
}
