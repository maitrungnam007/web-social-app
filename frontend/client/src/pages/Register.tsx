import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import TextInput from '../components/TextInput'

const registerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(20, 'Tên đăng nhập không được quá 20 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'),
  email: z
    .string()
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số'),
  confirmPassword: z
    .string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword']
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange'
  })

  const password = watch('password', '')

  // Password strength indicator
  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    let strength = 0
    if (pwd.length >= 6) strength++
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++

    if (strength <= 2) return { strength, label: 'Yếu', color: 'bg-red-500' }
    if (strength <= 4) return { strength, label: 'Trung bình', color: 'bg-yellow-500' }
    return { strength, label: 'Mạnh', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)

    try {
      await registerUser(data.username, data.email, data.password, data.firstName, data.lastName)
      toast.success('Đăng ký thành công!')
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (err: any) {
      console.log('Register error:', err)
      console.log('Error response:', err.response)
      console.log('Error response data:', err.response?.data)
      
      const apiResponse = err.response?.data
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.'
      
      // Ưu tiên message từ API response
      if (apiResponse?.message) {
        errorMessage = apiResponse.message
      } 
      // Xử lý errors array
      else if (apiResponse?.errors) {
        if (Array.isArray(apiResponse.errors)) {
          errorMessage = apiResponse.errors.join('\n')
        } else if (typeof apiResponse.errors === 'object') {
          // ASP.NET Core validation format: { Field: ["message1", "message2"] }
          const errorMessages = Object.entries(apiResponse.errors as Record<string, string[]>)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n')
          errorMessage = errorMessages || 'Dữ liệu không hợp lệ'
        }
      }
      // HTTP status code messages
      else if (err.response?.status === 400) {
        errorMessage = 'Dữ liệu gửi lên không hợp lệ'
      } else if (err.response?.status === 409) {
        errorMessage = 'Tên đăng nhập hoặc email đã tồn tại'
      } else if (err.response?.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      // Hiển thị lỗi với duration dài hơn để đọc
      toast.error(errorMessage, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Họ"
          placeholder="Nhập họ"
          {...register('firstName')}
        />
        <TextInput
          label="Tên"
          placeholder="Nhập tên"
          {...register('lastName')}
        />
      </div>

      <TextInput
        label="Tên đăng nhập"
        placeholder="Nhập tên đăng nhập"
        error={errors.username?.message}
        {...register('username')}
      />

      <TextInput
        label="Email"
        type="email"
        placeholder="Nhập email"
        error={errors.email?.message}
        {...register('email')}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập mật khẩu"
            className={`mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('password')}
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
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
        {/* Password strength indicator */}
        {password && (
          <div className="mt-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded ${
                    i <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs mt-1 ${
              passwordStrength.label === 'Yếu' ? 'text-red-500' :
              passwordStrength.label === 'Trung bình' ? 'text-yellow-500' : 'text-green-500'
            }`}>
              Độ mạnh: {passwordStrength.label}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu"
            className={`mt-1 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10 ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? (
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
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
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
            Đang tạo tài khoản...
          </span>
        ) : 'Đăng ký'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  )
}
