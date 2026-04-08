import { useState, useEffect } from 'react'
import { reportsApi, ReportStatus, usersApi, postsApi, commentsApi } from '../../services'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingReports: 0,
    resolvedReports: 0,
    totalReports: 0,
    totalUsers: 0,
    bannedUsers: 0,
    violationUsers: 0,
    totalPosts: 0,
    totalComments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      // Load reports
      const pendingRes = await reportsApi.getReports(1, 1, ReportStatus.Pending)
      const resolvedRes = await reportsApi.getReports(1, 1, ReportStatus.Resolved)
      const allRes = await reportsApi.getReports(1, 1)

      // Load users
      const usersRes = await usersApi.getAllUsers(1, 1000)
      let totalUsers = 0
      let bannedUsers = 0
      let violationUsers = 0
      if (usersRes.success && usersRes.data) {
        totalUsers = usersRes.data.totalCount
        const users = usersRes.data.items
        bannedUsers = users.filter((u: any) => u.isBanned).length
        violationUsers = users.filter((u: any) => (u.violationCount || 0) >= 1).length
      }

      // Load posts
      const postsRes = await postsApi.getPosts(1, 1)
      const totalPosts = postsRes.success && postsRes.data ? postsRes.data.totalCount : 0

      // Load comments stats
      const commentsRes = await commentsApi.getStats()
      const totalComments = commentsRes.success && commentsRes.data ? commentsRes.data.totalComments : 0

      setStats({
        pendingReports: pendingRes.success && pendingRes.data ? pendingRes.data.totalCount : 0,
        resolvedReports: resolvedRes.success && resolvedRes.data ? resolvedRes.data.totalCount : 0,
        totalReports: allRes.success && allRes.data ? allRes.data.totalCount : 0,
        totalUsers,
        bannedUsers,
        violationUsers,
        totalPosts,
        totalComments
      })
    } catch (error) {
      console.error('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Người dùng',
      value: stats.totalUsers,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'bg-blue-500'
    },
    {
      title: 'Bài viết',
      value: stats.totalPosts,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      color: 'bg-green-500'
    },
    {
      title: 'Bình luận',
      value: stats.totalComments,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'bg-purple-500'
    },
    {
      title: 'Báo cáo chờ xử lý',
      value: stats.pendingReports,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-yellow-500'
    },
    {
      title: 'Người vi phạm',
      value: stats.violationUsers,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'bg-orange-500'
    },
    {
      title: 'Đã cấm',
      value: stats.bannedUsers,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      color: 'bg-red-500'
    }
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Tổng quan hệ thống</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statCards.map((card, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg text-white`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/admin/moderation"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A5.934 5.934 0 0112 2.944a5.934 5.934 0 01-5.618 4.04A5.934 5.934 0 012.944 12a5.934 5.934 0 004.04 5.618A5.934 5.934 0 0112 21.056a5.934 5.934 0 015.618-4.04A5.934 5.934 0 0121.056 12a5.934 5.934 0 00-4.04-5.618z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Kiểm duyệt nội dung</p>
                  <p className="text-sm text-gray-500">Xử lý các báo cáo từ người dùng</p>
                </div>
              </a>
              <a
                href="/admin/violations"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Vi phạm</p>
                  <p className="text-sm text-gray-500">Quản lý người vi phạm</p>
                </div>
              </a>
              <a
                href="/admin/users"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Người dùng</p>
                  <p className="text-sm text-gray-500">Quản lý tài khoản người dùng</p>
                </div>
              </a>
              <a
                href="/admin/content"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Nội dung</p>
                  <p className="text-sm text-gray-500">Bài viết và bình luận</p>
                </div>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
