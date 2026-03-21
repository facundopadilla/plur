import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { FEATURE_FLAGS } from '../../flags'
import type { DashboardTab } from '../types'

interface PanelTabsProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
}

const LEGACY_TABS: { key: DashboardTab; labelKey: string }[] = [
  { key: 'inventario', labelKey: 'dashboard.tabs.inventario' },
  { key: 'vestidor', labelKey: 'dashboard.tabs.espejo' },
  { key: 'creditos', labelKey: 'dashboard.tabs.creditos' },
]

const V2_TABS: { key: DashboardTab; labelKey: string }[] = [
  { key: 'inventario', labelKey: 'dashboard.tabs.inventario' },
  { key: 'vestidor', labelKey: 'dashboard.tabs.vestidor' },
  { key: 'creditos', labelKey: 'dashboard.tabs.creditos' },
  { key: 'publicar', labelKey: 'dashboard.tabs.publicar' },
  { key: 'perfil', labelKey: 'dashboard.tabs.perfil' },
]

export function PanelTabs({ activeTab, onTabChange }: PanelTabsProps) {
  const { t } = useTranslation()
  const tabs = FEATURE_FLAGS.DASHBOARD_IA_V2 ? V2_TABS : LEGACY_TABS

  return (
    <div className="flex border-b border-pl-gray-700 px-1 overflow-x-auto hide-scrollbar">
      {tabs.map(({ key, labelKey }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={cn(
            'flex-1 min-w-max px-2 py-3 text-[10px] font-medium tracking-[0.12em] uppercase font-body transition-all duration-200 border-b-2 -mb-px',
            activeTab === key
              ? 'text-pl-accent border-pl-accent'
              : 'text-pl-gray-500 border-transparent hover:text-pl-gray-300',
          )}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  )
}
