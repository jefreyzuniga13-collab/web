import api from '@/Utils/ApiConfig'

export type UploadForWhatsAppResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  waMediaHandle: any
  fileName: string
  mimeType: string
  publicUrl: string
  waMediaId: string
}

export const MediaService = {
  async uploadForWhatsApp(file: File): Promise<UploadForWhatsAppResult> {
    const fd = new FormData()
    fd.append('files', file)
    const { data } = await api.post<UploadForWhatsAppResult[]>(
      '/Media/upload-for-wh',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    if (!Array.isArray(data) || !data.length) throw new Error('No se pudo subir el media')
    return data[0]
  }
}
