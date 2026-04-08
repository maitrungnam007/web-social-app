import api from './apiClient'
import { ApiResponse } from '../types'

// Enum matching backend ReportTargetType (string values)
export enum ReportTargetType {
  Post = 'Post',
  Comment = 'Comment',
  User = 'User'
}

// Enum matching backend ReportReason (string values)
export enum ReportReason {
  Spam = 'Spam',
  Harassment = 'Harassment',
  HateSpeech = 'HateSpeech',
  Violence = 'Violence',
  InappropriateContent = 'InappropriateContent',
  Other = 'Other'
}

// Enum matching backend ReportStatus (string values)
export enum ReportStatus {
  Pending = 'Pending',
  UnderReview = 'UnderReview',
  Resolved = 'Resolved',
  Dismissed = 'Dismissed'
}

export interface CreateReportDto {
  targetType: ReportTargetType
  targetId: string // String de ho tro ca Post/Comment ID (int) va User ID (GUID)
  reason: ReportReason
  description?: string
}

export interface ReportResponse {
  id: number
  targetType: ReportTargetType
  targetId: string // String de ho tro ca Post/Comment ID (int) va User ID (GUID)
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
  reportCount: number // So luong bao cao cho doi tuong nay
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
    targetType?: ReportTargetType,
    search?: string,
    sortBy?: string
  ): Promise<ApiResponse<{ items: ReportResponse[]; totalCount: number; page: number; pageSize: number }>> => {
    let url = `/reports?page=${page}&pageSize=${pageSize}`
    if (status !== undefined) url += `&status=${status}`
    if (targetType !== undefined) url += `&targetType=${targetType}`
    if (search !== undefined && search.trim() !== '') url += `&search=${encodeURIComponent(search)}`
    if (sortBy !== undefined) url += `&sortBy=${sortBy}`
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
