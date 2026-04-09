import axios from 'axios'

// Su dung VITE_API_URL tu environment variable
// Development: http://localhost:5259 (tu .env.development)
// Production: https://web-social-app.onrender.com (tu .env.production hoac Vercel env var)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5259'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Helper function để tạo cancel token
export const createCancelToken = () => {
  const controller = new AbortController()
  return {
    signal: controller.signal,
    cancel: () => controller.abort()
  }
}

export default api
