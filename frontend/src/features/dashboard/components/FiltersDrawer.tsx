import { X, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
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
      (_error) => {
        setGpsLoading(false)
        setGpsError(t('dashboard.filters.gps_denied_hint'))
        onProximityToggle(false, null)
      }
    )
  }

  const updateFilter = (key: keyof GarmentFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'any' ? undefined : value
    })
  }

  return (
    <div className="absolute inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-sm h-full bg-pl-black border-l border-pl-gray-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-pl-gray-800 flex justify-between items-center bg-pl-gray-900/50">
          <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-pl-white">
            {t('dashboard.filters.title', 'Filters')}
          </h2>
          <button onClick={onClose} className="text-pl-gray-400 hover:text-pl-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-4 bg-pl-gray-900/30 p-5 border border-pl-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-pl-white font-semibold">
                <MapPin className="w-5 h-5 text-pl-accent" />
                <span>{t('dashboard.filters.proximity', 'Enable proximity')}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={proximityEnabled}
                  onChange={(e) => handleProximityChange(e.target.checked)}
                  disabled={gpsLoading}
                />
                <div className="w-11 h-6 bg-pl-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pl-accent"></div>
              </label>
            </div>
            {gpsLoading && (
              <p className="text-sm text-pl-accent animate-pulse">{t('common.loading', 'Loading...')}</p>
            )}
            {gpsError && (
              <p className="text-sm text-red-400 font-body">{gpsError}</p>
            )}
            <p className="text-xs text-pl-gray-400 leading-relaxed">
              {t('dashboard.filters.proximity_hint', 'Find items near you')}
            </p>
          </div>

          <div className="space-y-6">
            <FilterSelect 
              label={t('dashboard.filters.style', 'Style')} 
              value={filters.style || 'any'} 
              onChange={(v) => updateFilter('style', v)}
              options={[
                { value: 'any', label: t('dashboard.filters.any', 'Any') },
                { value: 'casual', label: t('dashboard.filters.styles.casual', 'Casual') },
                { value: 'streetwear', label: t('dashboard.filters.styles.streetwear', 'Streetwear') },
                { value: 'vintage', label: t('dashboard.filters.styles.vintage', 'Vintage') },
                { value: 'formal', label: t('dashboard.filters.styles.formal', 'Formal') },
                { value: 'minimalist', label: t('dashboard.filters.styles.minimalist', 'Minimalist') },
              ]}
            />
            
            <FilterSelect 
              label={t('dashboard.filters.size', 'Size')} 
              value={filters.size || 'any'} 
              onChange={(v) => updateFilter('size', v)}
              options={[
                { value: 'any', label: t('dashboard.filters.any', 'Any') },
                { value: 'xs', label: t('dashboard.filters.sizes.xs', 'XS') },
                { value: 's', label: t('dashboard.filters.sizes.s', 'S') },
                { value: 'm', label: t('dashboard.filters.sizes.m', 'M') },
                { value: 'l', label: t('dashboard.filters.sizes.l', 'L') },
                { value: 'xl', label: t('dashboard.filters.sizes.xl', 'XL') },
              ]}
            />

            <FilterSelect 
              label={t('dashboard.filters.condition', 'Condition')} 
              value={filters.condition || 'any'} 
              onChange={(v) => updateFilter('condition', v)}
              options={[
                { value: 'any', label: t('dashboard.filters.any', 'Any') },
                { value: 'new', label: t('dashboard.filters.conditions.new', 'New') },
                { value: 'excellent', label: t('dashboard.filters.conditions.excellent', 'Excellent') },
                { value: 'good', label: t('dashboard.filters.conditions.good', 'Good') },
              ]}
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-pl-gray-800">
          <button
            onClick={onClose}
            className="w-full py-4 bg-pl-white text-pl-black font-semibold uppercase tracking-widest text-sm hover:bg-pl-gray-200 transition-colors"
          >
            {t('dashboard.filters.apply', 'Apply Filters')}
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: { 
  label: string, 
  value: string, 
  onChange: (v: string) => void,
  options: { value: string, label: string }[]
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-pl-gray-400">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-pl-gray-900 border border-pl-gray-800 text-pl-white p-3 focus:border-pl-accent focus:outline-none transition-colors appearance-none"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-pl-gray-400">
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
