import { useRef, useState, InputHTMLAttributes } from 'react'

interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string
  error?: string
  accept?: string
  preview?: boolean
  onFileSelect: (file: File | null) => void
  previewUrl?: string | null
}

export default function FileInput({
  label,
  error,
  accept = 'image/*',
  preview = true,
  onFileSelect,
  previewUrl,
  className = '',
  ...props
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file && preview) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLocalPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setLocalPreview(null)
    }
    onFileSelect(file)
  }

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    setLocalPreview(null)
    onFileSelect(null)
  }

  const displayPreview = localPreview || previewUrl

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          {...props}
        />
        
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Chọn file
        </button>
        
        {displayPreview && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {preview && displayPreview && (
        <div className="mt-3">
          <img
            src={displayPreview}
            alt="Preview"
            className="max-h-48 rounded-lg object-cover border"
          />
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
