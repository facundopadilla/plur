import '../dashboard.css'
import { useState } from 'react'
import { LeftPanel } from './LeftPanel'
import { SwipePanel } from './SwipePanel'
import { MobileTabBar } from './MobileTabBar'
import { InventarioTab } from './InventarioTab'
import { EspejoAITab } from './EspejoAITab'
import { CreditosTab } from './CreditosTab'
import { ProfileHeader } from './ProfileHeader'
import { QRScannerOverlay } from './QRScannerOverlay'
import { UserProfileModal } from './UserProfileModal'
import { X, QrCode } from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useTranslation } from 'react-i18next'
import type { DashboardTab } from '../types'

export function DashboardLayout() {
  const { t } = useTranslation()
  const { mobileOverlay, setMobileOverlay } = useDashboardStore()
  const [showScanner, setShowScanner] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const handleMobileTabChange = (tab: DashboardTab) => {
    setMobileOverlay(mobileOverlay === tab ? null : tab)
  }

  return (
    <div className="flex h-screen bg-pl-black overflow-hidden">
      {/* Left panel — desktop only (manages its own tab state via store) */}
      <LeftPanel onQrScan={() => setShowScanner(true)} />

      {/* Right panel — swipe cards (always rendered) */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <SwipePanel />
      </div>

      {/* Mobile tab overlay (shown over swipe panel) */}
      {mobileOverlay !== null && (
        <div className="lg:hidden mobile-overlay fixed inset-0 bg-pl-black z-40 flex flex-col overflow-hidden" style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex items-center justify-between border-b border-pl-gray-700">
            <div className="flex-1 min-w-0">
              <ProfileHeader onQrScan={() => setShowScanner(true)} />
            </div>
            <button
              onClick={() => setMobileOverlay(null)}
              aria-label="Cerrar"
              className="p-4 text-pl-gray-400 hover:text-pl-white transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            {mobileOverlay === 'inventario' && (
              <div className="overflow-hidden flex flex-col flex-1">
                <InventarioTab />
              </div>
            )}
            {mobileOverlay === 'vestidor' && <EspejoAITab />}
            {mobileOverlay === 'creditos' && <CreditosTab />}
            {mobileOverlay === 'match' && <div className="flex-1 flex items-center justify-center text-pl-gray-400">Match (Próximamente)</div>}
            {mobileOverlay === 'publicar' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 text-pl-gray-400 p-6 text-center">
                <p>Publicar (Próximamente)</p>
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded border border-pl-gray-600 hover:bg-pl-gray-800 transition-colors text-pl-white text-sm"
                >
                  <QrCode className="w-4 h-4" />
                  {t('dashboard.sale.scanQR')}
                </button>
              </div>
            )}
            {mobileOverlay === 'perfil' && <div className="flex-1 flex items-center justify-center text-pl-gray-400">Perfil (Próximamente)</div>}
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <MobileTabBar
        activeTab={mobileOverlay}
        onTabChange={handleMobileTabChange}
        onQrScan={() => setShowScanner(true)}
        onProfile={() => setShowProfile(true)}
      />

      {/* QR Scanner overlay — shared entre desktop header y mobile navbar */}
      {showScanner && <QRScannerOverlay onClose={() => setShowScanner(false)} />}

      {/* Profile modal — abierto desde el tab Perfil del navbar mobile */}
      {showProfile && <UserProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  )
}
