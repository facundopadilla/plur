import { useDashboardStore } from '@/stores/dashboard.store'
import { ProfileHeader } from './ProfileHeader'
import { PanelTabs } from './PanelTabs'
import { InventarioTab } from './InventarioTab'
import { EspejoAITab } from './EspejoAITab'
import { CreditosTab } from './CreditosTab'

interface LeftPanelProps {
  onQrScan: () => void
}

export function LeftPanel({ onQrScan }: LeftPanelProps) {
  const activeTab = useDashboardStore((s) => s.activeTab)
  const setActiveTab = useDashboardStore((s) => s.setActiveTab)

  return (
    <div className="hidden lg:flex flex-col w-[30%] max-w-xs border-r border-pl-gray-700 bg-pl-black">
      <ProfileHeader onQrScan={onQrScan} />
      <PanelTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'inventario' && (
          <div className="flex-1 overflow-y-auto">
            <InventarioTab />
          </div>
        )}
        {activeTab === 'espejo' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <EspejoAITab />
          </div>
        )}
        {activeTab === 'creditos' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <CreditosTab />
          </div>
        )}
      </div>
    </div>
  )
}
