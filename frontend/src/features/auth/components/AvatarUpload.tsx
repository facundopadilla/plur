import { useRef } from 'react'
import { Camera, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  value: File | null
  onChange: (file: File | null) => void
  error?: string | undefined
}

export function AvatarUpload({ value, onChange, error }: AvatarUploadProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = value ? URL.createObjectURL(value) : null

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    onChange(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'relative w-28 h-28 rounded-full overflow-hidden cursor-pointer',
          'border-2 transition-all duration-300',
          error ? 'border-pl-red' : 'border-pl-gray-500 hover:border-pl-accent',
          'bg-pl-gray-600 flex items-center justify-center',
        )}
        style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
        aria-label={t('auth.profilePicture')}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={t('auth.profilePicture')}
            className="w-full h-full object-cover"
          />
        ) : (
          <Camera className="w-8 h-8 text-pl-white/30" />
        )}

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-pl-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Camera className="w-6 h-6 text-pl-white" />
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
        aria-hidden="true"
      />

      <div className="text-center">
        <div className="flex items-center gap-2 justify-center">
          <button
            type="button"
            onClick={handleClick}
            className="text-[11px] font-medium text-pl-accent tracking-[0.08em] uppercase font-body hover:underline cursor-pointer"
          >
            {t('auth.profilePictureHint')}
          </button>
          <span className="text-[11px] text-pl-white/30 font-body">
            {t('auth.profilePictureOptional')}
          </span>
        </div>
        <p className="text-[10px] text-pl-white/25 font-body mt-1">
          {t('auth.profilePictureMaxSize')}
        </p>
      </div>

      {/* Botón para remover */}
      {value && (
        <button
          type="button"
          onClick={handleRemove}
          className="flex items-center gap-1.5 text-[11px] text-pl-white/40 hover:text-pl-red font-body transition-colors duration-200 cursor-pointer"
        >
          <X className="w-3 h-3" />
          Remover foto
        </button>
      )}

      {error && (
        <p className="text-xs text-pl-red font-body">{error}</p>
      )}
    </div>
  )
}
