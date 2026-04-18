import { useState, useEffect } from 'react'
import { usersApi, reportsApi, ReportResponse, ReportStatus } from '../../services'
import { User } from '../../types'
import { getAvatarUrl } from '../../utils/avatar'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'User' | 'Admin'>('all')
  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    userId: '',
    action: 'ban' as 'ban' | 'unban',
    banReason: '',
    banDays: 0,
    isPermanent: true
  })
  const [actionLoading, setActionLoading] = useState(false)
  const [showDetails, setShowDetails] = useState<User | null>(null)
  const [userReports, setUserReports] = useState<ReportResponse[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [allActiveCount, setAllActiveCount] = useState(0)
  const [allBannedCount, setAllBannedCount] = useState(0)
  const [allAdminCount, setAllAdminCount] = useState(0)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadUsers()
  }, [page, debouncedSearch, statusFilter, roleFilter])

  // Load th?ng kê t?ng m?t l?n khi mount
  useEffect(() => {
    loadStats()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await usersApi.getAllUsers(page, pageSize, debouncedSearch || undefined)
      if (response.success && response.data) {
        let filteredUsers = response.data.items
        
        // Filter by status
        if (statusFilter === 'active') {
          filteredUsers = filteredUsers.filter(u => !u.isBanned)
        } else if (statusFilter === 'banned') {
          filteredUsers = filteredUsers.filter(u => u.isBanned)
        }
        
        // Filter by role
        if (roleFilter !== 'all') {
          filteredUsers = filteredUsers.filter(u => u.role === roleFilter)
        }
        
        setUsers(filteredUsers)
        setTotalCount(response.data.totalCount)
      }
    } catch (error) {
      console.error('Failed to load users')
      toast.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await usersApi.getAllUsers(1, 1000)
      if (response.success && response.data) {
        const allUsers = response.data.items
        setAllActiveCount(allUsers.filter(u => !u.isBanned).length)
        setAllBannedCount(allUsers.filter(u => u.isBanned).length)
        setAllAdminCount(allUsers.filter(u => u.role === 'Admin').length)
      }
    } catch (error) {
      console.error('L?i khi load stats')
    }
  }

  const handleBan = (userId: string, userName: string) => {
    setConfirm({
      isOpen: true,
      title: 'Cấm người dùng',
      message: `Bạn có chắc muốn cấm người dùng "${userName}"?`,
      userId,
      action: 'ban',
      banReason: '',
      banDays: 0,
      isPermanent: false
    })
  }

  const executeAction = async () => {
    const { userId, action, banReason, banDays, isPermanent } = confirm
    setConfirm(prev => ({ ...prev, isOpen: false }))
    
    setActionLoading(true)
    try {
      if (action === 'ban') {
        const duration = isPermanent ? 'permanent' : banDays.toString()
        await usersApi.banUser(userId, banReason || 'Vi phạm quy định', duration)
        toast.success(isPermanent ? 'Đã cấm vĩnh viễn' : `Đã cấm trong ${banDays} ngày`)
      } else {
        await usersApi.unbanUser(userId)
        toast.success('Đã gỡ cấm người dùng')
      }
      loadStats()
      loadUsers()
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnban = (userId: string, userName: string) => {
    setConfirm({
      isOpen: true,
      title: 'Gỡ cấm người dùng',
      message: `Bạn có chắc muốn gỡ cấm người dùng "${userName}"?`,
      userId,
      action: 'unban',
      banReason: '',
      banDays: 0,
      isPermanent: false
    })
  }

  const handleViewDetails = async (user: User) => {
    setShowDetails(user)
    setLoadingReports(true)
    try {
      const response = await reportsApi.getReportsByUser(user.id)
      if (response.success && response.data) {
        setUserReports(response.data)
      }
    } catch (error) {
      toast.error('Không thể tải chi tiết')
    } finally {
      setLoadingReports(false)
    }
  }

  const getStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.Pending: return 'Chờ xử lý'
      case ReportStatus.UnderReview: return 'Đang xem xét'
      case ReportStatus.Resolved: return 'Đã xử lý'
      case ReportStatus.Dismissed: return 'Bỏ qua'
      default: return status
    }
  }

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.Pending: return 'bg-yellow-100 text-yellow-800'
      case ReportStatus.UnderReview: return 'bg-blue-100 text-blue-800'
      case ReportStatus.Resolved: return 'bg-green-100 text-green-800'
      case ReportStatus.Dismissed: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'Spam': return 'Spam'
      case 'Harassment': return 'Quấy rối'
      case 'HateSpeech': return 'Phân biệt đối xử'
      case 'Violence': return 'Bạo lực'
      case 'InappropriateContent': return 'Nội dung không phù hợp'
      case 'Other': return 'Khác'
      default: return reason
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const getRoleBadge = (role?: string) => {
    if (role === 'Admin') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Admin
        </span>
      )
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        User
      </span>
    )
  }

  const getStatusBadge = (user: User) => {
    if (user.isBanned) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Đã cấm
        </span>
      )
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Hoạt động
      </span>
    )
  }

  // Th?ng kê
  const stats = {
    total: totalCount,
    active: allActiveCount,
    banned: allBannedCount,
    admins: allAdminCount
  }

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Danh sách tất cả người dùng trong hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-500">Tổng người dùng</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-500">Đang hoạt động</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-500">Đã cấm</p>
          <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.banned}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-500">Admin</p>
          <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.admins}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo username, email, họ tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'banned')}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="banned">Đã cấm</option>
          </select>
          
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'User' | 'Admin')}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không tìm thấy người dùng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img
                          src={getAvatarUrl(user.avatarUrl, user.firstName, user.lastName, user.userName, 40)}
                          alt={user.userName}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.userName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">@{user.userName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Chi tiết
                        </button>
                        {user.role !== 'Admin' && (
                          user.isBanned ? (
                            <button
                              onClick={() => handleUnban(user.id, user.userName)}
                              disabled={actionLoading}
                              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                            >
                              Gỡ cấm
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBan(user.id, user.userName)}
                              disabled={actionLoading}
                              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                            >
                              Cấm
                            </button>
                          )
                        )}
                      </div>
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
            <div className="hidden sm:block">
              <p className="text-sm text-gray-700">
                Hiển thị{' '}
                <span className="font-medium">{(page - 1) * pageSize + 1}</span> đến{' '}
                <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> trong{' '}
                <span className="font-medium">{totalCount}</span> kết quả
              </p>
            </div>
            <div className="sm:hidden text-sm text-gray-700">
              Trang {page}/{totalPages}
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
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.action === 'ban' ? 'Cấm' : 'Gỡ cấm'}
        confirmVariant={confirm.action === 'ban' ? 'danger' : 'primary'}
        inputLabel={confirm.action === 'ban' ? 'Lý do cấm' : undefined}
        inputValue={confirm.banReason}
        onInputChange={confirm.action === 'ban' ? (value) => setConfirm(prev => ({ ...prev, banReason: value })) : undefined}
        numberLabel={confirm.action === 'ban' ? 'Số ngày cấm' : undefined}
        numberValue={confirm.banDays}
        onNumberChange={confirm.action === 'ban' ? (value) => setConfirm(prev => ({ ...prev, banDays: value })) : undefined}
        numberPlaceholder="Nhập số ngày..."
        numberMin={1}
        numberMax={365}
        checkboxLabel={confirm.action === 'ban' ? 'Cấm vĩnh viễn' : undefined}
        checkboxValue={confirm.isPermanent}
        onCheckboxChange={confirm.action === 'ban' ? (value) => setConfirm(prev => ({ ...prev, isPermanent: value })) : undefined}
        onConfirm={executeAction}
        onCancel={() => setConfirm(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Modal Chi tiết người dùng */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetails(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Chi tiết người dùng - {showDetails.userName}
              </h3>
              <button
                onClick={() => setShowDetails(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Thông tin người dùng */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                <img
                  src={getAvatarUrl(showDetails.avatarUrl, showDetails.firstName, showDetails.lastName, showDetails.userName, 64)}
                  alt={showDetails.userName}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {showDetails.firstName && showDetails.lastName 
                      ? `${showDetails.firstName} ${showDetails.lastName}` 
                      : showDetails.userName}
                  </p>
                  <p className="text-sm text-gray-500">@{showDetails.userName}</p>
                  <p className="text-sm text-gray-500">{showDetails.email}</p>
                </div>
              </div>
              
              {/* Thống kê */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Vai trò</p>
                  <p className="text-sm font-medium">{showDetails.role || 'User'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Số vi phạm</p>
                  <p className="text-sm font-medium text-yellow-600">{showDetails.violationCount || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Trạng thái</p>
                  <p className={`text-sm font-medium ${showDetails.isBanned ? 'text-red-600' : 'text-green-600'}`}>
                    {showDetails.isBanned ? 'Đã cấm' : 'Hoạt động'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Bạn bè</p>
                  <p className="text-sm font-medium">{showDetails.friendsCount || 0}</p>
                </div>
              </div>
              
              {/* Lý do cấm */}
              {showDetails.isBanned && (
                <div className="mb-6 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Lý do cấm:</p>
                  <p className="text-sm text-red-600">{showDetails.banReason || 'Không có lý do'}</p>
                  {showDetails.banExpiresAt && (
                    <p className="text-sm text-red-600 mt-1">
                      Hết hạn: {new Date(showDetails.banExpiresAt.endsWith('Z') ? showDetails.banExpiresAt : showDetails.banExpiresAt + 'Z').toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              )}
              
              {/* Danh sách báo cáo */}
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Lịch sử báo cáo</h4>
              {loadingReports ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : userReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Không có báo cáo nào</div>
              ) : (
                <div className="space-y-3">
                  {userReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Lý do:</span> {getReasonLabel(report.reason)}
                      </p>
                      {report.description && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Mô tả:</span> {report.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Người báo cáo:</span> {report.reporterName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
