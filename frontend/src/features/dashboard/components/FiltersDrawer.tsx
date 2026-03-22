import { X, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import type { GarmentFilters, Coordinates } from '../hooks/useNearbyGarments'

interface FiltersDrawerProps {
  isOpen: boolean
  onClose: () => void
  filters: GarmentFilters
  onFiltersChange: (filters: GarmentFilters) => void
  proximityEnabled: boolean
  onProximityToggle: (enabled: boolean, coords: Coordinates | null) => void
}

export function FiltersDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  proximityEnabled,
  onProximityToggle,
}: FiltersDrawerProps) {
  const { t } = useTranslation()
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)

  if (!isOpen) return null

  const handleProximityChange = (checked: boolean) => {
    if (!checked) {
      setGpsError(null)
      onProximityToggle(false, null)
      return
    }

    if (!('geolocation' in navigator)) {
      setGpsError(t('dashboard.filters.gps_unavailable'))
      return
    }

    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false)
        setGpsError(null)
        onProximityToggle(true, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        setGpsLoading(false)
        setGpsError(t('dashboard.filters.gps_denied_hint'))
        onProximityToggle(false, null)
      },
    )
  }

  const updateFilter = (key: keyof GarmentFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'any' ? undefined : value,
    })
  }

  const handleClear = () => {
    onFiltersChange({})
    setGpsError(null)
    onProximityToggle(false, null)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs h-full bg-pl-gray-800 border-l border-pl-gray-700 flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-pl-gray-700 flex justify-between items-center">
          <h2 className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-pl-white">
            {t('dashboard.filters.title')}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-pl-gray-700 flex items-center justify-center hover:bg-pl-gray-600 transition-colors"
          >
            <X className="w-4 h-4 text-pl-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Proximity toggle */}
          <div className="bg-pl-gray-700/40 border border-pl-gray-700 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-pl-accent" />
                <span className="text-[12px] font-semibold text-pl-white font-body">
                  {t('dashboard.filters.proximity')}
                </span>
              </div>
              <button
                onClick={() => handleProximityChange(!proximityEnabled)}
                disabled={gpsLoading}
                className={cn(
                  'w-10 h-6 rounded-full relative transition-colors duration-200 shrink-0',
                  proximityEnabled ? 'bg-pl-accent' : 'bg-pl-gray-600',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    proximityEnabled && 'translate-x-4',
                  )}
                />
              </button>
            </div>
            {gpsLoading && (
              <p className="text-[10px] text-pl-accent font-body animate-pulse">{t('common.loading')}</p>
            )}
            {gpsError && (
              <p className="text-[10px] text-pl-red font-body">{gpsError}</p>
            )}
            <p className="text-[10px] text-pl-gray-500 font-body leading-relaxed">
              {t('dashboard.filters.proximity_hint')}
            </p>
          </div>

          {/* Filter selects */}
          <FilterChipGroup
            label={t('dashboard.filters.style')}
            value={filters.style ?? 'any'}
            onChange={(v) => updateFilter('style', v)}
            options={[
              { value: 'any', label: t('dashboard.filters.any') },
              { value: 'casual', label: t('dashboard.filters.styles.casual') },
              { value: 'streetwear', label: t('dashboard.filters.styles.streetwear') },
              { value: 'vintage', label: t('dashboard.filters.styles.vintage') },
              { value: 'formal', label: t('dashboard.filters.styles.formal') },
              { value: 'minimalist', label: t('dashboard.filters.styles.minimalist') },
            ]}
          />

          <FilterChipGroup
            label={t('dashboard.filters.size')}
            value={filters.size ?? 'any'}
            onChange={(v) => updateFilter('size', v)}
            options={[
              { value: 'any', label: t('dashboard.filters.any') },
              { value: 'xs', label: 'XS' },
              { value: 's', label: 'S' },
              { value: 'm', label: 'M' },
              { value: 'l', label: 'L' },
              { value: 'xl', label: 'XL' },
            ]}
          />

          <FilterChipGroup
            label={t('dashboard.filters.condition')}
            value={filters.condition ?? 'any'}
            onChange={(v) => updateFilter('condition', v)}
            options={[
              { value: 'any', label: t('dashboard.filters.any') },
              { value: 'new', label: t('dashboard.filters.conditions.new') },
              { value: 'excellent', label: t('dashboard.filters.conditions.excellent') },
              { value: 'good', label: t('dashboard.filters.conditions.good') },
              { value: 'fair', label: t('dashboard.filters.conditions.fair') },
            ]}
          />

          <FilterChipGroup
            label={t('dashboard.filters.gender')}
            value={filters.gender ?? 'any'}
            onChange={(v) => updateFilter('gender', v)}
            options={[
              { value: 'any', label: t('dashboard.filters.any') },
              { value: 'mujer', label: t('dashboard.filters.genders.mujer') },
              { value: 'hombre', label: t('dashboard.filters.genders.hombre') },
              { value: 'unisex', label: t('dashboard.filters.genders.unisex') },
            ]}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-pl-gray-700 space-y-2">
          <button
            onClick={onClose}
            className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors rounded-lg"
          >
            {t('dashboard.filters.apply')}
          </button>
          <button
            onClick={handleClear}
            className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase py-2.5 border border-pl-gray-600 text-pl-gray-400 font-body hover:text-pl-white hover:border-pl-gray-400 transition-colors rounded-lg"
          >
            {t('dashboard.filters.clear')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function FilterChipGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-400 font-body">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase font-body rounded-lg transition-colors duration-150',
              value === opt.value
                ? 'bg-pl-accent text-pl-black'
                : 'bg-pl-gray-700 text-pl-gray-300 hover:bg-pl-gray-600 hover:text-pl-white',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
