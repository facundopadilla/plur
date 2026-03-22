import { QrCode, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useCredits } from '../hooks/useCredits'

interface ProfileHeaderProps {
  onQrScan?: (() => void) | undefined
}

export function ProfileHeader({ onQrScan }: ProfileHeaderProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { credits } = useCredits()
  const avatarDataUrl = useProfileStore((s) => s.avatarDataUrl)
  const setActiveTab = useDashboardStore((s) => s.setActiveTab)
  const setMobileOverlay = useDashboardStore((s) => s.setMobileOverlay)

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : 'PL'

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : 'Usuario'

  const goToProfile = () => {
    setActiveTab('perfil')
    setMobileOverlay('perfil')
  }

  return (
    <div className="flex items-center border-b border-pl-gray-700">
      <button
        onClick={goToProfile}
        className="flex-1 flex items-center gap-3 p-4 text-left hover:bg-pl-gray-800/40 transition-colors min-w-0"
        aria-label={t('dashboard.profile.profileLabel')}
      >
        <Avatar className="w-10 h-10 border border-pl-gray-500 shrink-0">
          <AvatarImage src={avatarDataUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-pl-gray-600 text-pl-white font-body text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="text-[13px] font-medium text-pl-white font-body truncate">{displayName}</p>
          <p className="text-[11px] font-semibold text-pl-accent font-body tracking-[0.08em]">
            {t('dashboard.profile.credits', { amount: credits })}
          </p>
        </div>
      </button>

      <button
        onClick={() => {
          setActiveTab('match')
          setMobileOverlay('match')
        }}
        aria-label={t('dashboard.tabs.match')}
        className="px-3 py-4 text-pl-gray-400 hover:text-pl-accent transition-colors shrink-0"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {onQrScan !== undefined && (
        <button
          onClick={onQrScan}
          aria-label={t('dashboard.sale.scanQR')}
          className="pl-1 pr-4 py-4 text-pl-gray-400 hover:text-pl-accent transition-colors shrink-0"
        >
          <QrCode className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
