import { useState, useEffect } from 'react'
import { reportsApi, ReportStatus } from '../../services'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingReports: 0,
    resolvedReports: 0,
    totalReports: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      // Load pending reports
      const pendingRes = await reportsApi.getReports(1, 1, ReportStatus.Pending)
      const resolvedRes = await reportsApi.getReports(1, 1, ReportStatus.Resolved)
      const allRes = await reportsApi.getReports(1, 1)

      setStats({
        pendingReports: pendingRes.success && pendingRes.data ? pendingRes.data.totalCount : 0,
        resolvedReports: resolvedRes.success && resolvedRes.data ? resolvedRes.data.totalCount : 0,
        totalReports: allRes.success && allRes.data ? allRes.data.totalCount : 0
      })
    } catch (error) {
      console.error('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
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
      title: 'Đã xử lý',
      value: stats.resolvedReports,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500'
    },
    {
      title: 'Tổng báo cáo',
      value: stats.totalReports,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-blue-500'
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                href="/admin/users"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Quản lý người dùng</p>
                  <p className="text-sm text-gray-500">Xem và quản lý tài khoản người dùng</p>
                </div>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
