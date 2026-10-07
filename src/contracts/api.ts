/** Envelope das rotas da SPA: `{ success, message, data }`. */
export interface SpaApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
