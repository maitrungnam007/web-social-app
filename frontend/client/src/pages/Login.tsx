import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
  const { login } = useAuth()
  const navigate = useNavigate()

  const validateForm = (): boolean => {
    const newErrors: { username?: string; password?: string } = {}
    
    if (!username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập'
    } else if (username.trim().length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự'
    }
    
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setErrors({})

    try {
      await login(username, password)
      toast.success('Đăng nhập thành công!')
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (err: any) {
      // Debug: xem error structure
      console.log('Full error:', err)
      console.log('Error response:', err.response)
      console.log('Error response data:', err.response?.data)
      console.log('Error message:', err.message)
      
      // Axios error structure: err.response.data chứa ApiResponse từ backend
      const apiResponse = err.response?.data
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.'
      
      // Ưu tiên message từ API response
      if (apiResponse?.message) {
        errorMessage = apiResponse.message
      } else if (apiResponse?.errors && Array.isArray(apiResponse.errors) && apiResponse.errors.length > 0) {
        errorMessage = apiResponse.errors.join(', ')
      } else if (err.message) {
        errorMessage = err.message
      }
      
      console.log('Final errorMessage:', errorMessage)
      toast.error(errorMessage)
      
      // Highlight fields on error
      setErrors({ 
        username: ' ', 
        password: ' ' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            if (errors.username) setErrors(prev => ({ ...prev, username: undefined }))
          }}
          className={`mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
            errors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Nhập tên đăng nhập"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">{errors.username}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors(prev => ({ ...prev, password: undefined }))
            }}
            className={`mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10 ${
              errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Nhập mật khẩu"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Đang đăng nhập...
          </span>
        ) : 'Đăng nhập'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-blue-600 hover:underline">
          Đăng ký
        </Link>
      </p>
    </form>
  )
}
