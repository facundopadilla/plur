import { Package, Sparkles, Coins, QrCode, User, Plus, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { FEATURE_FLAGS } from '../../flags'
import type { DashboardTab } from '../types'

interface MobileTabBarProps {
  activeTab: DashboardTab | null
  onTabChange: (tab: DashboardTab) => void
  onQrScan: () => void
  onProfile: () => void
}

interface TabIcon {
  className?: string | undefined
}

const LEFT_TABS: {
  key: DashboardTab
  labelKey: string
  Icon: React.ComponentType<TabIcon>
}[] = [
  { key: 'inventario', labelKey: 'dashboard.tabs.inventario', Icon: Package },
  { key: 'vestidor', labelKey: 'dashboard.tabs.espejo', Icon: Sparkles },
]

const RIGHT_TABS: {
  key: DashboardTab
  labelKey: string
  Icon: React.ComponentType<TabIcon>
}[] = [{ key: 'creditos', labelKey: 'dashboard.tabs.creditos', Icon: Coins }]

const LEFT_TABS_V2: typeof LEFT_TABS = [
  { key: 'inventario', labelKey: 'dashboard.tabs.inventario', Icon: Package },
  { key: 'vestidor', labelKey: 'dashboard.tabs.vestidor', Icon: Sparkles },
]

const RIGHT_TABS_V2: typeof RIGHT_TABS = [
  { key: 'match', labelKey: 'dashboard.tabs.match', Icon: Heart },
  { key: 'creditos', labelKey: 'dashboard.tabs.creditos', Icon: Coins },
]

export function MobileTabBar({ activeTab, onTabChange, onQrScan, onProfile }: MobileTabBarProps) {
  const { t } = useTranslation()
  const isV2 = FEATURE_FLAGS.DASHBOARD_IA_V2

  const leftTabs = isV2 ? LEFT_TABS_V2 : LEFT_TABS
  const rightTabs = isV2 ? RIGHT_TABS_V2 : RIGHT_TABS

  const renderTab = ({ key, labelKey, Icon }: (typeof LEFT_TABS)[number]) => (
    <button
      key={key}
      onClick={() => onTabChange(key)}
      className={cn(
        'flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors duration-200',
        activeTab === key ? 'text-pl-accent' : 'text-pl-gray-400',
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[9px] font-medium tracking-[0.1em] uppercase font-body truncate w-full text-center px-1">
        {t(labelKey)}
      </span>
    </button>
  )

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 bg-pl-gray-700 border-t border-pl-gray-600 flex z-50 pb-[env(safe-area-inset-bottom)]">
      {leftTabs.map(renderTab)}

      {isV2 ? (
        <button
          onClick={() => onTabChange('publicar')}
          aria-label={t('dashboard.tabs.publicar')}
          className={cn(
            'flex flex-col items-center justify-end gap-1 pb-3 px-3',
            activeTab === 'publicar' ? 'text-pl-accent' : 'text-pl-gray-400 hover:text-pl-accent'
          )}
        >
          <div className="w-12 h-12 -mt-4 rounded-full bg-pl-accent flex items-center justify-center border-4 border-pl-gray-700 shadow-lg shrink-0">
            <Plus className="w-5 h-5 text-pl-black" />
          </div>
          <span className="text-[9px] font-medium tracking-[0.1em] uppercase font-body truncate max-w-[60px] text-center">
            {t('dashboard.tabs.publicar')}
          </span>
        </button>
      ) : (
        <button
          onClick={onQrScan}
          aria-label={t('dashboard.sale.scanQR')}
          className="flex flex-col items-center justify-end gap-1 pb-3 px-5 text-pl-accent"
        >
          <div className="w-12 h-12 -mt-4 rounded-full bg-pl-accent flex items-center justify-center border-4 border-pl-gray-700 shadow-lg shrink-0">
            <QrCode className="w-5 h-5 text-pl-black" />
          </div>
          <span className="text-[9px] font-medium tracking-[0.1em] uppercase font-body truncate max-w-[60px] text-center">
            {t('dashboard.sale.scanQR')}
          </span>
        </button>
      )}

      {rightTabs.map(renderTab)}

      {/* Perfil */}
      <button
        onClick={isV2 ? () => onTabChange('perfil') : onProfile}
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors duration-200",
          isV2 && activeTab === 'perfil' ? 'text-pl-accent' : 'text-pl-gray-400'
        )}
      >
        <User className="w-5 h-5" />
        <span className="text-[9px] font-medium tracking-[0.1em] uppercase font-body truncate w-full text-center px-1">
          {t('dashboard.tabs.perfil')}
        </span>
      </button>
    </div>
  )
}
