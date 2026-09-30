export interface UtmTrackChart {
  labels: string[];
  data: number[];
}

export interface UtmTrack {
  id: number;
  name: string;
  value: string;
  model_type: string;
  project_id: number;
}

export interface UtmTracksPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * Resposta de GET /v1/utm-tracks.
 */
export interface UtmTracksIndexResponse {
  registers_utm_tracks: UtmTrackChart;
  deposits_utm_tracks: UtmTrackChart;
  utm_tracks: UtmTrack[];
  order: string;
  direction: string;
  pagination: UtmTracksPagination;
  meta: Record<string, string>;
}
