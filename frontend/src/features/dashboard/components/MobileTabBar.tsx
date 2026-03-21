import { Package, Sparkles, Coins } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { DashboardTab } from '../types'

interface MobileTabBarProps {
  activeTab: DashboardTab | null
  onTabChange: (tab: DashboardTab) => void
}

interface TabIcon {
  className?: string | undefined
}

const TABS: {
  key: DashboardTab
  labelKey: string
  Icon: React.ComponentType<TabIcon>
}[] = [
  { key: 'inventario', labelKey: 'dashboard.tabs.inventario', Icon: Package },
  { key: 'espejo', labelKey: 'dashboard.tabs.espejo', Icon: Sparkles },
  { key: 'creditos', labelKey: 'dashboard.tabs.creditos', Icon: Coins },
]

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  const { t } = useTranslation()

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 bg-pl-gray-700 border-t border-pl-gray-600 flex z-50">
      {TABS.map(({ key, labelKey, Icon }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors duration-200',
            activeTab === key ? 'text-pl-accent' : 'text-pl-gray-400',
          )}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[9px] font-medium tracking-[0.1em] uppercase font-body">
            {t(labelKey)}
          </span>
        </button>
      ))}
    </div>
  )
}
