import { useState, useEffect } from 'react'
import { usersApi } from '../../services'
import { User } from '../../types'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminViolations() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [allViolationCount, setAllViolationCount] = useState(0)
  const [allBannedCount, setAllBannedCount] = useState(0)
  const [allNeedActionCount, setAllNeedActionCount] = useState(0)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [showBannedOnly, setShowBannedOnly] = useState(false)
  const [showNeedAction, setShowNeedAction] = useState(false)
  
  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    userId: '',
    action: 'ban' as 'ban' | 'unban',
    banReason: ''
  })

  useEffect(() => {
    loadUsers()
  }, [page, showBannedOnly, showNeedAction])

  // Load thống kê tổng một lần khi mount
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await usersApi.getAllUsers(1, 1000)
      if (response.success && response.data) {
        const allUsers = response.data.items
        const violationUsers = allUsers.filter(u => (u.violationCount || 0) >= 1)
        
        // Debug: Log users with violations
        console.log('Users with violations:', violationUsers.map(u => ({ 
          userName: u.userName, 
          violationCount: u.violationCount 
        })))
        
        setAllViolationCount(violationUsers.length)
        setAllBannedCount(violationUsers.filter(u => u.isBanned).length)
        setAllNeedActionCount(violationUsers.filter(u => (u.violationCount || 0) >= 3).length)
      }
    } catch (error) {
      console.error('Lỗi khi load stats')
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      // Lay nhieu users de dam bao lay du tat ca users co vi pham
      const response = await usersApi.getAllUsers(1, 1000, search || undefined)
      if (response.success && response.data) {
        // Ch? l?y user c? ?t nh?t 1 vi ph?m
        const violationUsers = response.data.items.filter(u => (u.violationCount || 0) >= 1)

        // L?c theo tr?ng th?i banned
        let filteredUsers = violationUsers
        if (showBannedOnly) {
          filteredUsers = filteredUsers.filter(u => u.isBanned)
        }

        // L?c theo c?n x? l? (3 vi ph?m tr? l?n)
        if (showNeedAction) {
          filteredUsers = filteredUsers.filter(u => (u.violationCount || 0) >= 3)
        }

        setUsers(filteredUsers)
        setTotalCount(filteredUsers.length)
      }
    } catch (error) {
      toast.error('Kh?ng th? t?i d? li?u')
    } finally {
      setLoading(false)
    }
  }

  const handleBan = (userId: string, userName: string) => {
    setConfirm({
      isOpen: true,
      title: 'Cấm người dùng',
      message: `Bạn có chắc muốn cấm người dùng "${userName}"?`,
      userId,
      action: 'ban',
      banReason: ''
    })
  }

  const executeAction = async () => {
    const { userId, action, banReason } = confirm
    setConfirm(prev => ({ ...prev, isOpen: false }))
    
    try {
      if (action === 'ban') {
        await usersApi.banUser(userId, banReason || 'Vi phạm quy định')
        toast.success('Đã cấm người dùng')
      } else {
        await usersApi.unbanUser(userId)
        toast.success('Đã gỡ cấm người dùng')
      }
      loadStats()
      loadUsers()
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý vi phạm</h1>
        <p className="text-gray-500 mt-1">Danh sách người dùng vi phạm và lịch sử</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showBannedOnly}
              onChange={(e) => { setShowBannedOnly(e.target.checked); setPage(1); }}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Chỉ hiển thị đã cấm</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showNeedAction}
              onChange={(e) => { setShowNeedAction(e.target.checked); setPage(1); }}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Cần xử lý (3+ vi phạm)</span>
          </label>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Tổng vi phạm</p>
          <p className="text-2xl font-bold text-gray-900">{allViolationCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Đang bị cấm</p>
          <p className="text-2xl font-bold text-red-600">{allBannedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-yellow-50 transition-colors"
          onClick={() => { setShowNeedAction(!showNeedAction); setShowBannedOnly(false); setPage(1); }}>
          <p className="text-sm text-gray-500">Cần xử lý</p>
          <p className="text-2xl font-bold text-yellow-600">{allNeedActionCount}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có dữ liệu</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số vi phạm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý do cấm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={user.role === 'Admin' ? 'bg-purple-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl ? `http://localhost:5259/api/files/${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || user.userName)}&background=random`}
                        alt={user.userName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.userName}</p>
                        <p className="text-sm text-gray-500">@{user.userName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (user.violationCount || 0) >= 3
                        ? 'bg-red-100 text-red-800'
                        : (user.violationCount || 0) >= 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.violationCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === 'Admin' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Admin
                      </span>
                    ) : user.isBanned ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Đã cấm
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {user.banReason || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role !== 'Admin' && (
                      user.isBanned ? (
                        <button
                          onClick={() => {
                            setConfirm({
                              isOpen: true,
                              title: 'Gỡ cấm người dùng',
                              message: `Bạn có chắc muốn gỡ cấm người dùng "${user.userName}"?`,
                              userId: user.id,
                              action: 'unban',
                              banReason: ''
                            })
                          }}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Gỡ cấm
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBan(user.id, user.userName)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Cấm
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  Hiển thị <span className="font-medium">{(page - 1) * pageSize + 1}</span> đến{' '}
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

      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.action === 'ban' ? 'Cấm' : 'Gỡ cấm'}
        confirmVariant={confirm.action === 'ban' ? 'danger' : 'primary'}
        inputLabel={confirm.action === 'ban' ? 'Lý do cấm' : undefined}
        inputValue={confirm.banReason}
        onInputChange={confirm.action === 'ban' ? (value) => setConfirm(prev => ({ ...prev, banReason: value })) : undefined}
        onConfirm={executeAction}
        onCancel={() => setConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
