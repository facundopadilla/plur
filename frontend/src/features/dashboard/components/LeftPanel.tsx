import { useDashboardStore } from '@/stores/dashboard.store'
import { ProfileHeader } from './ProfileHeader'
import { PanelTabs } from './PanelTabs'
import { InventarioTab } from './InventarioTab'
import { EspejoAITab } from './EspejoAITab'
import { CreditosTab } from './CreditosTab'
import { QrCode } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface LeftPanelProps {
  onQrScan: () => void
}

export function LeftPanel({ onQrScan }: LeftPanelProps) {
  const { t } = useTranslation()
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
        {activeTab === 'vestidor' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <EspejoAITab />
          </div>
        )}
        {activeTab === 'creditos' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <CreditosTab />
          </div>
        )}
        {activeTab === 'match' && (
          <div className="flex-1 flex items-center justify-center text-pl-gray-400">
            Match (Próximamente)
          </div>
        )}
        {activeTab === 'publicar' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-pl-gray-400 p-6 text-center">
            <p>Publicar (Próximamente)</p>
            <button
              onClick={onQrScan}
              className="flex items-center gap-2 px-4 py-2 rounded border border-pl-gray-600 hover:bg-pl-gray-800 transition-colors text-pl-white text-sm"
            >
              <QrCode className="w-4 h-4" />
              {t('dashboard.sale.scanQR')}
            </button>
          </div>
        )}
        {activeTab === 'perfil' && (
          <div className="flex-1 flex items-center justify-center text-pl-gray-400">
            Perfil (Próximamente)
          </div>
        )}
      </div>
    </div>
  )
}
