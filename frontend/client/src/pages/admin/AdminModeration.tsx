import { useState, useEffect } from 'react'
import { reportsApi, ReportStatus, ReportTargetType, ReportReason, ReportResponse } from '../../services'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  reportId: number
  action: 'resolve' | 'dismiss'
}

export default function AdminModeration() {
  const [reports, setReports] = useState<ReportResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(10)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>(undefined)
  const [typeFilter, setTypeFilter] = useState<ReportTargetType | undefined>(undefined)
  
  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    reportId: 0,
    action: 'resolve'
  })

  const loadReports = async () => {
    setLoading(true)
    try {
      const response = await reportsApi.getReports(page, pageSize, statusFilter, typeFilter)
      if (response.success && response.data) {
        setReports(response.data.items)
        setTotalCount(response.data.totalCount)
      }
    } catch (error) {
      toast.error('Không thể tải danh sách báo cáo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [page, statusFilter, typeFilter])

  const handleResolve = (reportId: number) => {
    setConfirm({
      isOpen: true,
      title: 'Xử lý báo cáo',
      message: 'Bạn có chắc muốn đánh dấu báo cáo này đã được xử lý?',
      reportId,
      action: 'resolve'
    })
  }

  const handleDismiss = (reportId: number) => {
    setConfirm({
      isOpen: true,
      title: 'Bỏ qua báo cáo',
      message: 'Bạn có chắc muốn bỏ qua báo cáo này?',
      reportId,
      action: 'dismiss'
    })
  }

  const executeAction = async () => {
    const { reportId, action } = confirm
    setConfirm(prev => ({ ...prev, isOpen: false }))
    
    try {
      const status = action === 'resolve' ? ReportStatus.Resolved : ReportStatus.Dismissed
      const response = await reportsApi.resolveReport(reportId, {
        status,
        notes: action === 'resolve' ? 'Đã xử lý' : 'Bỏ qua'
      })
      
      if (response.success) {
        toast.success(action === 'resolve' ? 'Đã xử lý báo cáo' : 'Đã bỏ qua báo cáo')
        loadReports()
      } else {
        toast.error(response.message || 'Không thể xử lý')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const getStatusBadge = (status: ReportStatus) => {
    const styles = {
      [ReportStatus.Pending]: 'bg-yellow-100 text-yellow-800',
      [ReportStatus.UnderReview]: 'bg-blue-100 text-blue-800',
      [ReportStatus.Resolved]: 'bg-green-100 text-green-800',
      [ReportStatus.Dismissed]: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      [ReportStatus.Pending]: 'Chờ xử lý',
      [ReportStatus.UnderReview]: 'Đang xem xét',
      [ReportStatus.Resolved]: 'Đã xử lý',
      [ReportStatus.Dismissed]: 'Bỏ qua'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getTypeBadge = (type: ReportTargetType) => {
    const styles = {
      [ReportTargetType.Post]: 'bg-purple-100 text-purple-800',
      [ReportTargetType.Comment]: 'bg-indigo-100 text-indigo-800',
      [ReportTargetType.User]: 'bg-pink-100 text-pink-800'
    }
    const labels = {
      [ReportTargetType.Post]: 'Bài viết',
      [ReportTargetType.Comment]: 'Bình luận',
      [ReportTargetType.User]: 'Người dùng'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
        {labels[type]}
      </span>
    )
  }

  const getReasonLabel = (reason: ReportReason) => {
    const labels = {
      [ReportReason.Spam]: 'Spam',
      [ReportReason.Harassment]: 'Quấy phá',
      [ReportReason.HateSpeech]: 'Phân biệt đối xử',
      [ReportReason.Violence]: 'Bạo lực',
      [ReportReason.InappropriateContent]: 'Nội dung không phù hợp',
      [ReportReason.Other]: 'Khác'
    }
    return labels[reason]
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt nội dung</h1>
        <p className="text-gray-500 mt-1">Quản lý các báo cáo nội dung từ người dùng</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={statusFilter ?? ''}
              onChange={(e) => {
                setStatusFilter(e.target.value ? Number(e.target.value) as ReportStatus : undefined)
                setPage(1)
              }}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value={ReportStatus.Pending}>Chờ xử lý</option>
              <option value={ReportStatus.UnderReview}>Đang xem xét</option>
              <option value={ReportStatus.Resolved}>Đã xử lý</option>
              <option value={ReportStatus.Dismissed}>Bỏ qua</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại đối tượng</label>
            <select
              value={typeFilter ?? ''}
              onChange={(e) => {
                setTypeFilter(e.target.value ? Number(e.target.value) as ReportTargetType : undefined)
                setPage(1)
              }}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value={ReportTargetType.Post}>Bài viết</option>
              <option value={ReportTargetType.Comment}>Bình luận</option>
              <option value={ReportTargetType.User}>Người dùng</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter(undefined)
                setTypeFilter(undefined)
                setPage(1)
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có báo cáo nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nội dung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người báo cáo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lý do
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{report.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(report.targetType)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {report.postContent || report.commentContent || report.reportedUserName || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.reporterName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getReasonLabel(report.reason)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {report.status === ReportStatus.Pending && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleResolve(report.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Xử lý
                          </button>
                          <button
                            onClick={() => handleDismiss(report.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      )}
                      {report.status !== ReportStatus.Pending && (
                        <span className="text-gray-400 text-xs">
                          {report.resolvedByName && `by ${report.resolvedByName}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị
                  <span className="font-medium">{(page - 1) * pageSize + 1}</span> đến{' '}
                  <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> trong{' '}
                  <span className="font-medium">{totalCount}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.action === 'resolve' ? 'Xu ly' : 'Bo qua'}
        confirmVariant={confirm.action === 'resolve' ? 'primary' : 'danger'}
        onConfirm={executeAction}
        onCancel={() => setConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
