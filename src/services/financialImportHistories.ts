import api from './base.js'

interface PreviewResponse {
  headers: string[],
  preview_rows: Array<{
    line: number
    data: Record<string, string>
    status: string
    errors: string[]
  }>
}

export default {
  /**
   * @param {Partial<object>} params
   * @param {string|null} params.format
   */
  async template(params = {}): Promise<Blob> {
    const { data } = await api.get('/financial-import-histories/template', { params, responseType: 'blob' })
    return data
  },

  async preview(formData: FormData): Promise<PreviewResponse> {
    const { data } = await api.post('/financial-import-histories/preview', formData)
    return data
  },

  async process(formData: FormData) {
    const { data } = await api.post('/financial-import-histories/process', formData)
    return data
  }
}
