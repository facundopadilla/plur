import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth.store'
import { useDashboardStore } from '@/stores/dashboard.store'

export function ProfileHeader() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const credits = useDashboardStore((s) => s.credits)

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : 'PL'

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : 'Usuario'

  return (
    <div className="flex items-center gap-3 p-4 border-b border-pl-gray-700">
      <Avatar className="w-10 h-10 border border-pl-gray-500 shrink-0">
        <AvatarImage src={undefined} alt={displayName} />
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
    </div>
  )
}
