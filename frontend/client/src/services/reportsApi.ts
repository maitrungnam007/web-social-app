import api from './apiClient'
import { ApiResponse } from '../types'

// Enum matching backend ReportTargetType
export enum ReportTargetType {
  Post = 0,
  Comment = 1,
  User = 2
}

// Enum matching backend ReportReason
export enum ReportReason {
  Spam = 0,
  Harassment = 1,
  HateSpeech = 2,
  Violence = 3,
  InappropriateContent = 4,
  Other = 5
}

// Enum matching backend ReportStatus
export enum ReportStatus {
  Pending = 0,
  UnderReview = 1,
  Resolved = 2,
  Dismissed = 3
}

export interface CreateReportDto {
  targetType: ReportTargetType
  targetId: number
  reason: ReportReason
  description?: string
}

export interface ReportResponse {
  id: number
  targetType: ReportTargetType
  targetId: number
  postContent?: string
  commentContent?: string
  reportedUserName?: string
  reporterId: string
  reporterName: string
  reason: ReportReason
  description?: string
  status: ReportStatus
  createdAt: string
  resolvedAt?: string
  resolvedByName?: string
  resolutionNotes?: string
}

export const reportsApi = {
  // Tạo báo cáo mới
  createReport: async (data: CreateReportDto): Promise<ApiResponse<boolean>> => {
    const response = await api.post('/reports', data)
    return response.data
  },

  // Lấy danh sách báo cáo (Admin)
  getReports: async (
    page: number = 1,
    pageSize: number = 20,
    status?: ReportStatus,
    targetType?: ReportTargetType
  ): Promise<ApiResponse<{ items: ReportResponse[]; totalCount: number; page: number; pageSize: number }>> => {
    let url = `/reports?page=${page}&pageSize=${pageSize}`
    if (status !== undefined) url += `&status=${status}`
    if (targetType !== undefined) url += `&targetType=${targetType}`
    const response = await api.get(url)
    return response.data
  },

  // Xử lý báo cáo (Admin)
  resolveReport: async (
    reportId: number,
    data: { status: ReportStatus; notes?: string }
  ): Promise<ApiResponse<boolean>> => {
    const response = await api.put(`/reports/${reportId}/resolve`, data)
    return response.data
  }
}
