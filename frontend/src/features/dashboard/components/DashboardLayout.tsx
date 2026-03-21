import { useState } from 'react'
import '../dashboard.css'
import { LeftPanel } from './LeftPanel'
import { SwipePanel } from './SwipePanel'
import { MobileTabBar } from './MobileTabBar'
import { InventarioTab } from './InventarioTab'
import { EspejoAITab } from './EspejoAITab'
import { CreditosTab } from './CreditosTab'
import { ProfileHeader } from './ProfileHeader'
import { X } from 'lucide-react'
import type { DashboardTab } from '../types'

export function DashboardLayout() {
  // Mobile overlay: null = swipe view, tab key = overlay open
  const [mobileOverlay, setMobileOverlay] = useState<DashboardTab | null>(null)

  const handleMobileTabChange = (tab: DashboardTab) => {
    // Toggle: if already open, close it
    setMobileOverlay((prev) => (prev === tab ? null : tab))
  }

  return (
    <div className="flex h-screen bg-pl-black overflow-hidden">
      {/* Left panel — desktop only (manages its own tab state via store) */}
      <LeftPanel />

      {/* Right panel — swipe cards (always rendered) */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <SwipePanel />
      </div>

      {/* Mobile tab overlay (shown over swipe panel) */}
      {mobileOverlay !== null && (
        <div className="lg:hidden mobile-overlay fixed inset-0 bottom-[56px] bg-pl-black z-40 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-pl-gray-700">
            <div className="flex-1">
              <ProfileHeader />
            </div>
            <button
              onClick={() => setMobileOverlay(null)}
              aria-label="Cerrar"
              className="p-4 text-pl-gray-400 hover:text-pl-white transition-colors"
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
            {mobileOverlay === 'espejo' && <EspejoAITab />}
            {mobileOverlay === 'creditos' && <CreditosTab />}
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <MobileTabBar activeTab={mobileOverlay} onTabChange={handleMobileTabChange} />
    </div>
  )
}
