import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { DashboardTab } from '../types'

interface PanelTabsProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
}

const TABS: { key: DashboardTab; labelKey: string }[] = [
  { key: 'inventario', labelKey: 'dashboard.tabs.inventario' },
  { key: 'vestidor', labelKey: 'dashboard.tabs.espejo' },
  { key: 'creditos', labelKey: 'dashboard.tabs.creditos' },
]

export function PanelTabs({ activeTab, onTabChange }: PanelTabsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex border-b border-pl-gray-700 px-1">
      {TABS.map(({ key, labelKey }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={cn(
            'flex-1 py-3 text-[10px] font-medium tracking-[0.12em] uppercase font-body transition-all duration-200 border-b-2 -mb-px',
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
