import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'danger' | 'warning' | 'primary'
  inputLabel?: string
  inputValue?: string
  onInputChange?: (value: string) => void
  selectLabel?: string
  selectValue?: string
  onSelectChange?: (value: string) => void
  selectOptions?: { value: string; label: string }[]
  // Number input cho so ngay
  numberLabel?: string
  numberValue?: number
  onNumberChange?: (value: number) => void
  numberPlaceholder?: string
  numberMin?: number
  numberMax?: number
  // Checkbox cho vinh vien
  checkboxLabel?: string
  checkboxValue?: boolean
  onCheckboxChange?: (value: boolean) => void
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmVariant = 'danger',
  inputLabel,
  inputValue = '',
  onInputChange,
  selectLabel,
  selectValue = '',
  onSelectChange,
  selectOptions,
  numberLabel,
  numberValue,
  onNumberChange,
  numberPlaceholder,
  numberMin = 1,
  numberMax,
  checkboxLabel,
  checkboxValue = false,
  onCheckboxChange,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
    primary: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          <p className="text-gray-600">{message}</p>
          {inputLabel && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {inputLabel}
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange?.(e.target.value)}
                placeholder="Nhập lý do..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          {selectLabel && selectOptions && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {selectLabel}
              </label>
              <select
                value={selectValue}
                onChange={(e) => onSelectChange?.(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {selectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {numberLabel && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {numberLabel}
              </label>
              <input
                type="number"
                value={numberValue ?? ''}
                onChange={(e) => onNumberChange?.(parseInt(e.target.value) || 0)}
                placeholder={numberPlaceholder}
                min={numberMin}
                max={numberMax}
                disabled={checkboxValue}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          )}
          {checkboxLabel && (
            <div className="mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkboxValue}
                  onChange={(e) => onCheckboxChange?.(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{checkboxLabel}</span>
              </label>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
