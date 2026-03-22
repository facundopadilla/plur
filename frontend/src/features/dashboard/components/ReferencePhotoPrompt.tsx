import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProfileStore } from '@/stores/profile.store'

interface ReferencePhotoPromptProps {
  onConfirm: () => void
  onCancel: () => void
}

export function ReferencePhotoPrompt({ onConfirm, onCancel }: ReferencePhotoPromptProps) {
  const { t } = useTranslation()
  const addReferencePhoto = useProfileStore((s) => s.addReferencePhoto)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setPreview(dataUrl)
    }
    reader.readAsDataURL(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleConfirm = () => {
    if (preview) {
      addReferencePhoto({ label: 'custom', dataUrl: preview })
    }
    onConfirm()
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/90 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-pl-gray-800 border-t border-pl-gray-700 rounded-t-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-3">
            <p className="text-[14px] font-semibold text-pl-white font-body leading-tight">
              {t('dashboard.espejo.needPhoto')}
            </p>
            <p className="text-[11px] text-pl-gray-400 font-body mt-1 leading-relaxed">
              {t('dashboard.espejo.needPhotoDesc')}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label={t('common.cancel')}
            className="text-pl-gray-500 hover:text-pl-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Photo slot */}
        <div className="mb-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
          {preview !== null ? (
            <div className="relative h-48 bg-pl-gray-700 overflow-hidden">
              <img src={preview} alt="foto de referencia" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pl-black/70 flex items-center justify-center hover:bg-pl-black transition-colors"
              >
                <X className="w-3.5 h-3.5 text-pl-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full h-40 border border-dashed border-pl-gray-600 flex flex-col items-center justify-center gap-3 hover:border-pl-gray-400 hover:bg-pl-gray-700/40 transition-colors"
            >
              <Camera className="w-8 h-8 text-pl-gray-500" />
              <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-pl-gray-400 font-body">
                {t('onboarding.photos.addPhoto')}
              </span>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 text-[11px] font-semibold tracking-[0.12em] uppercase px-4 py-3 border border-pl-gray-600 text-pl-gray-400 font-body hover:border-pl-gray-400 hover:text-pl-white transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={preview === null}
            className="flex-[2] text-[11px] font-semibold tracking-[0.12em] uppercase px-4 py-3 bg-pl-accent text-pl-black font-body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pl-accent-dim transition-colors"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
