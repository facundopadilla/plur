import '../dashboard.css'
import { useState } from 'react'
import { LeftPanel } from './LeftPanel'
import { SwipePanel } from './SwipePanel'
import { MobileTabBar } from './MobileTabBar'
import { InventarioTab } from './InventarioTab'
import { EspejoAITab } from './EspejoAITab'
import { CreditosTab } from './CreditosTab'
import { PublicarTab } from './PublicarTab'
import { PerfilTab } from './PerfilTab'
import { MatchTab } from './MatchTab'
import { ProfileHeader } from './ProfileHeader'
import { QRScannerOverlay } from './QRScannerOverlay'
import { X } from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboard.store'
import type { DashboardTab } from '../types'

export function DashboardLayout() {
  const { mobileOverlay, setMobileOverlay } = useDashboardStore()
  const [showScanner, setShowScanner] = useState(false)

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
            {mobileOverlay === 'vestidor' && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <EspejoAITab />
              </div>
            )}
            {mobileOverlay === 'creditos' && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <CreditosTab />
              </div>
            )}
            {mobileOverlay === 'publicar' && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <PublicarTab />
              </div>
            )}
            {mobileOverlay === 'perfil' && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <PerfilTab />
              </div>
            )}
            {mobileOverlay === 'match' && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <MatchTab />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <MobileTabBar
        activeTab={mobileOverlay}
        onTabChange={handleMobileTabChange}
        onQrScan={() => setShowScanner(true)}
      />

      {/* QR Scanner overlay — shared entre desktop header y mobile navbar */}
      {showScanner && <QRScannerOverlay onClose={() => setShowScanner(false)} />}
    </div>
  )
}
