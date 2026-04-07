import { useState } from 'react'
import toast from 'react-hot-toast'

interface Settings {
  jwtExpiration: number
  maxFileSize: number
  allowedFileTypes: string
  bannedKeywords: string
  maxPostsPerDay: number
  maxReportsBeforeAutoBan: number
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    jwtExpiration: 60,
    maxFileSize: 5,
    allowedFileTypes: 'jpg,jpeg,png,gif,mp4',
    bannedKeywords: 'spam,scam,fake',
    maxPostsPerDay: 10,
    maxReportsBeforeAutoBan: 5
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      // TODO: Call API to save settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Ðã lưu cài đặt')
    } catch (error) {
      toast.error('Không thể lưu cài đặt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cài d?t h? th?ng</h1>
        <p className="text-gray-500 mt-1">Cấu hình các thông số hệ thống</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* JWT Settings */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cấu hình JWT</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian hết hạn token (phút)
              </label>
              <input
                type="number"
                value={settings.jwtExpiration}
                onChange={(e) => setSettings({ ...settings, jwtExpiration: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* File Upload Settings */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cấu hình upload file</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kích thước tối đa (MB)
              </label>
              <input
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({ ...settings, maxFileSize: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ðịnh dạnng cho phép (phây ngăn cách)
              </label>
              <input
                type="text"
                value={settings.allowedFileTypes}
                onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Content Moderation Settings */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quy tắc kiểm duyệt</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số bài viết tối đa/ngày
              </label>
              <input
                type="number"
                value={settings.maxPostsPerDay}
                onChange={(e) => setSettings({ ...settings, maxPostsPerDay: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số báo cáo để tự động cấm
              </label>
              <input
                type="number"
                value={settings.maxReportsBeforeAutoBan}
                onChange={(e) => setSettings({ ...settings, maxReportsBeforeAutoBan: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ khóa cấm 
            </label>
            <textarea
              value={settings.bannedKeywords}
              onChange={(e) => setSettings({ ...settings, bannedKeywords: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="p-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Ðang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </div>
  )
}
