import api from './apiClient'
import { ApiResponse } from '../types'

export const filesApi = {
  uploadFile: async (file: File, folder: string = 'images'): Promise<ApiResponse<{ filePath: string; fileUrl: string }>> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`/files/upload?folder=${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
}
