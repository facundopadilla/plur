import { useRef } from 'react'
import { X, LogOut, Camera, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import { useCredits } from '../hooks/useCredits'

interface UserProfileModalProps {
  onClose: () => void
}

export function UserProfileModal({ onClose }: UserProfileModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { credits } = useCredits()
  const { referencePhotos, addReferencePhoto, removeReferencePhoto } = useProfileStore()
  const uploadRef = useRef<HTMLInputElement>(null)

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : 'PL'

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : 'Usuario'

  const handleLogout = () => {
    logout()
    void navigate('/login')
  }

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      addReferencePhoto({ label: 'custom', dataUrl })
    }
    reader.readAsDataURL(file)
    if (uploadRef.current) uploadRef.current.value = ''
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="h-full w-full max-w-xs bg-pl-black border-r border-pl-gray-700 flex flex-col overflow-hidden slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-pl-gray-700 shrink-0">
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-pl-gray-400 font-body">
            {t('dashboard.profile.profileLabel')}
          </p>
          <button
            onClick={onClose}
            aria-label={t('common.back')}
            className="text-pl-gray-500 hover:text-pl-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        <div className="flex flex-col items-center text-center gap-3 px-4 py-6 border-b border-pl-gray-700 shrink-0">
          <Avatar className="w-16 h-16 border-2 border-pl-gray-600">
            <AvatarImage src={undefined} alt={displayName} />
            <AvatarFallback className="bg-pl-gray-700 text-pl-white font-body text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[15px] font-semibold text-pl-white font-body leading-tight">
              {displayName}
            </p>
            {user !== null && (
              <p className="text-[11px] text-pl-gray-400 font-body mt-0.5">{user.email}</p>
            )}
          </div>
          <div className="bg-pl-gray-800 border border-pl-gray-700 px-5 py-2">
            <p className="text-[13px] font-semibold text-pl-accent font-body tracking-[0.08em]">
              {credits} PLR
            </p>
          </div>
        </div>

        {/* Reference photos */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-pl-gray-400 font-body">
              {t('onboarding.photos.title')}
            </p>
            <button
              onClick={() => uploadRef.current?.click()}
              className="flex items-center gap-1 text-[10px] font-medium text-pl-accent hover:opacity-70 transition-opacity font-body"
            >
              <Plus className="w-3 h-3" />
              {t('onboarding.photos.addPhoto')}
            </button>
          </div>

          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadPhoto}
          />

          {referencePhotos.length === 0 ? (
            <button
              onClick={() => uploadRef.current?.click()}
              className="w-full h-24 border border-dashed border-pl-gray-600 flex flex-col items-center justify-center gap-2 hover:border-pl-gray-400 hover:bg-pl-gray-800/40 transition-colors"
            >
              <Camera className="w-5 h-5 text-pl-gray-500" />
              <span className="text-[10px] text-pl-gray-500 font-body leading-tight max-w-[140px] text-center">
                {t('onboarding.photos.subtitle')}
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {referencePhotos.map((photo) => (
                <div key={photo.id} className="relative" style={{ paddingBottom: '133%' }}>
                  <div className="absolute inset-0">
                    <img
                      src={photo.dataUrl}
                      alt={photo.label}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeReferencePhoto(photo.id)}
                      aria-label="Eliminar foto"
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-pl-black/70 flex items-center justify-center hover:bg-pl-black transition-colors"
                    >
                      <X className="w-3 h-3 text-pl-white" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => uploadRef.current?.click()}
                className="border border-dashed border-pl-gray-600 flex items-center justify-center hover:border-pl-gray-400 hover:bg-pl-gray-800/40 transition-colors"
                style={{ paddingBottom: '133%', position: 'relative' }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-pl-gray-500" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-pl-gray-700 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase px-4 py-3 border border-pl-gray-600 text-pl-gray-400 font-body hover:border-red-500/60 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('auth.logout')}
          </button>
        </div>
      </div>
    </div>
  )
}
