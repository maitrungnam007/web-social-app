import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import systemSettingsApi, { SystemConfig, BadWord } from '../../services/systemSettingsApi'
import ConfirmDialog from '../../components/ConfirmDialog'

type TabType = 'config' | 'badwords' | 'rules'

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('config')
  const [config, setConfig] = useState<SystemConfig>({
    defaultBanDays: 7,
    notifyOnViolation: true,
    maxPostsPerDay: 50,
    maxCommentsPerDay: 200,
    reportsToAutoHide: 5,
    violationsToAutoBan: 3,
    blockBadWords: true
  })
  const [badWords, setBadWords] = useState<BadWord[]>([])
  const [newBadWord, setNewBadWord] = useState('')
  const [newBadWordCategory, setNewBadWordCategory] = useState('Profanity')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [configRes, badWordsRes] = await Promise.all([
        systemSettingsApi.getConfig(),
        systemSettingsApi.getBadWords()
      ])
      if (configRes.success && configRes.data) {
        setConfig(configRes.data)
      }
      if (badWordsRes.success && badWordsRes.data) {
        setBadWords(badWordsRes.data)
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const updates = [
        systemSettingsApi.updateSetting('DefaultBanDays', config.defaultBanDays.toString()),
        systemSettingsApi.updateSetting('NotifyOnViolation', config.notifyOnViolation.toString()),
        systemSettingsApi.updateSetting('MaxPostsPerDay', config.maxPostsPerDay.toString()),
        systemSettingsApi.updateSetting('MaxCommentsPerDay', config.maxCommentsPerDay.toString()),
        systemSettingsApi.updateSetting('ReportsToAutoHide', config.reportsToAutoHide.toString()),
        systemSettingsApi.updateSetting('ViolationsToAutoBan', config.violationsToAutoBan.toString()),
        systemSettingsApi.updateSetting('BlockBadWords', config.blockBadWords.toString()),
      ]
      await Promise.all(updates)
      toast.success('Đã lưu cấu hình')
    } catch (error) {
      toast.error('Không thể lưu cấu hình')
    } finally {
      setSaving(false)
    }
  }

  const handleAddBadWord = async () => {
    if (!newBadWord.trim()) return
    try {
      const result = await systemSettingsApi.addBadWord(newBadWord.trim(), newBadWordCategory)
      if (result.success) {
        toast.success('Đã thêm từ khóa cấm')
        setNewBadWord('')
        loadData()
      } else {
        toast.error(result.message || 'Không thể thêm từ khóa')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleDeleteBadWord = (id: number) => {
    setConfirm({
      isOpen: true,
      title: 'Xóa từ khóa',
      message: 'Bạn có chắc muốn xóa từ khóa này?',
      onConfirm: () => executeDeleteBadWord(id)
    })
  }

  const executeDeleteBadWord = async (id: number) => {
    setConfirm(prev => ({ ...prev, isOpen: false }))
    try {
      const result = await systemSettingsApi.deleteBadWord(id)
      if (result.success) {
        toast.success('Đã xóa từ khóa')
        setBadWords(badWords.filter(b => b.id !== id))
      } else {
        toast.error(result.message || 'Không thể xóa từ khóa')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleToggleBadWord = (id: number, currentStatus: boolean) => {
    const action = currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt'
    setConfirm({
      isOpen: true,
      title: `${action} từ khóa`,
      message: `Bạn có chắc muốn ${action.toLowerCase()} từ khóa này?`,
      onConfirm: () => executeToggleBadWord(id)
    })
  }

  const executeToggleBadWord = async (id: number) => {
    setConfirm(prev => ({ ...prev, isOpen: false }))
    try {
      const result = await systemSettingsApi.toggleBadWord(id)
      if (result.success) {
        toast.success(result.message || 'Đã cập nhật')
        setBadWords(badWords.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b))
      } else {
        toast.error(result.message || 'Không thể cập nhật')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'config', label: 'Cấu hình hệ thống', icon: '⚙️' },
    { key: 'badwords', label: 'Từ khóa cấm', icon: '🚫' },
    { key: 'rules', label: 'Quy tắc kiểm duyệt', icon: '📋' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
        <p className="text-gray-500 mt-1">Cấu hình các tham số hệ thống</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {/* Tab 1: C?u hinh h? th?ng */}
          {activeTab === 'config' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Cấu hinh chung</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời hạn cấm mặc định (ngày)
                  </label>
                  <input
                    type="number"
                    value={config.defaultBanDays}
                    onChange={(e) => setConfig({ ...config, defaultBanDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.notifyOnViolation}
                  onChange={(e) => setConfig({ ...config, notifyOnViolation: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Gửi thông báo khi người dùng vi phạm</label>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 pt-4 border-t">Giới hạn người dùng</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số bài viết tối đa/ngày
                  </label>
                  <input
                    type="number"
                    value={config.maxPostsPerDay}
                    onChange={(e) => setConfig({ ...config, maxPostsPerDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số bình luận tối đa/ngày
                  </label>
                  <input
                    type="number"
                    value={config.maxCommentsPerDay}
                    onChange={(e) => setConfig({ ...config, maxCommentsPerDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: T? kh?a c?m */}
          {activeTab === 'badwords' && (
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Thêm từ khóa cấm mới..."
                  value={newBadWord}
                  onChange={(e) => setNewBadWord(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newBadWordCategory}
                  onChange={(e) => setNewBadWordCategory(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Profanity">Tục tĩu</option>
                  <option value="Spam">Spam</option>
                  <option value="Sensitive">Nhạy cảm</option>
                </select>
                <button
                  onClick={handleAddBadWord}
                  disabled={!newBadWord.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Thêm
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Từ khóa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phân loại</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {badWords.map(word => (
                      <tr key={word.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {word.word}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            word.category === 'Profanity' ? 'bg-red-100 text-red-800' :
                            word.category === 'Spam' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {word.category === 'Profanity' ? 'Tục tĩu' :
                             word.category === 'Spam' ? 'Spam' : 'Nhạy cảm'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            word.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {word.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleBadWord(word.id, word.isActive)}
                              className={`px-3 py-1 text-sm rounded ${
                                word.isActive ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {word.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            </button>
                            <button
                              onClick={() => handleDeleteBadWord(word.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {badWords.length === 0 && (
                  <div className="p-8 text-center text-gray-500">Chưa có từ khóa cấm nào</div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Quy t?c ki?m duy?t */}
          {activeTab === 'rules' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Quy tắc tự động</h2>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Tự động ẩn bài viết</h3>
                      <p className="text-sm text-gray-500">Ẩn bài viết khi bị report đủ số lượng quy định</p>
                    </div>
                    <input
                      type="number"
                      value={config.reportsToAutoHide}
                      onChange={(e) => setConfig({ ...config, reportsToAutoHide: Number(e.target.value) })}
                      className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Tự động cấm người dùng</h3>
                      <p className="text-sm text-gray-500">Cấm người dùng khi số vi phạm đạt giới hạn</p>
                    </div>
                    <input
                      type="number"
                      value={config.violationsToAutoBan}
                      onChange={(e) => setConfig({ ...config, violationsToAutoBan: Number(e.target.value) })}
                      className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Chặn từ khóa cấm</h3>
                      <p className="text-sm text-gray-500">Không cho phép đăng bài viết chứa từ khóa cấm</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.blockBadWords}
                        onChange={(e) => setConfig({ ...config, blockBadWords: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu quy tắc'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
