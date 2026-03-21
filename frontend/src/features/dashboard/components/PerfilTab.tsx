import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { usePreferences, useUpdatePreferences } from '../hooks/usePreferences'
import { STYLE_OPTIONS } from '@/features/onboarding/data/styles'
import { COLOR_OPTIONS } from '@/features/onboarding/data/colors'
import { CLOTHING_SIZES } from '@/features/onboarding/data/sizes'

export function PerfilTab() {
  const { t } = useTranslation()
  const { data: preferences, isLoading, isError, error } = usePreferences()
  const { mutate: updatePreferences, isPending, isSuccess, isError: isUpdateError } = useUpdatePreferences()

  const [styles, setStyles] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [radius, setRadius] = useState<number>(50)
  const [proximity, setProximity] = useState<boolean>(true)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (preferences) {
      setStyles(preferences.styles || [])
      setSizes(preferences.sizes || [])
      setColors(preferences.colors || [])
      setRadius(preferences.discovery_radius_km ?? 50)
      setProximity(preferences.proximity_enabled ?? true)
    }
  }, [preferences])

  const handleToggleStyle = (id: string) => {
    setStyles(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const handleToggleSize = (id: string) => {
    setSizes(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const handleToggleColor = (id: string) => {
    setColors(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const handleSave = () => {
    setValidationError(null)
    if (radius < 1 || radius > 500) {
      setValidationError('El radio debe estar entre 1 y 500 km')
      return
    }

    updatePreferences({
      styles,
      sizes,
      colors,
      discovery_radius_km: radius,
      proximity_enabled: proximity
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-pl-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-body text-sm">{t('common.loading')}</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-red-400 p-6 text-center">
        <AlertCircle className="w-8 h-8 mb-4" />
        <p className="font-body text-sm">{t('common.error')}</p>
        <p className="font-body text-xs mt-2 opacity-80">{String(error)}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-pl-black">
      <div className="px-6 py-5 border-b border-pl-gray-700 bg-pl-black sticky top-0 z-10">
        <h2 className="text-xl font-medium tracking-[0.02em] text-pl-white font-display">
          {t('dashboard.preferences.title')}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        <section>
          <div className="mb-4">
            <h3 className="text-sm font-semibold tracking-[0.08em] uppercase text-pl-white font-body">
              {t('dashboard.preferences.styles')}
            </h3>
            <p className="text-xs text-pl-gray-400 font-body mt-1">
              {t('dashboard.preferences.stylesHint')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((style) => {
              const isSelected = styles.includes(style.id)
              return (
                <button
                  key={style.id}
                  onClick={() => handleToggleStyle(style.id)}
                  className={`px-4 py-2 border text-sm font-body transition-colors ${
                    isSelected 
                      ? 'border-pl-accent bg-pl-accent/10 text-pl-accent' 
                      : 'border-pl-gray-600 text-pl-gray-300 hover:border-pl-gray-400'
                  }`}
                >
                  {t(style.labelKey)}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-sm font-semibold tracking-[0.08em] uppercase text-pl-white font-body">
              {t('dashboard.preferences.sizes')}
            </h3>
            <p className="text-xs text-pl-gray-400 font-body mt-1">
              {t('dashboard.preferences.sizesHint')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CLOTHING_SIZES.map((size) => {
              const isSelected = sizes.includes(size)
              return (
                <button
                  key={size}
                  onClick={() => handleToggleSize(size)}
                  className={`min-w-[3rem] h-12 flex items-center justify-center border text-sm font-body transition-colors ${
                    isSelected 
                      ? 'border-pl-accent bg-pl-accent/10 text-pl-accent' 
                      : 'border-pl-gray-600 text-pl-gray-300 hover:border-pl-gray-400'
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-sm font-semibold tracking-[0.08em] uppercase text-pl-white font-body">
              {t('dashboard.preferences.colors')}
            </h3>
            <p className="text-xs text-pl-gray-400 font-body mt-1">
              {t('dashboard.preferences.colorsHint')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {COLOR_OPTIONS.map((color) => {
              const isSelected = colors.includes(color.id)
              return (
                <button
                  key={color.id}
                  onClick={() => handleToggleColor(color.id)}
                  className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-transform ${
                    isSelected ? 'scale-110 ring-2 ring-pl-accent ring-offset-2 ring-offset-pl-black' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  aria-label={t(color.labelKey)}
                >
                  {isSelected && (
                    <Check className={`w-5 h-5 ${['blanco', 'amarillo', 'beige'].includes(color.id) ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold tracking-[0.08em] uppercase text-pl-white font-body flex justify-between">
                <span>{t('dashboard.preferences.discoveryRadius')}</span>
                <span className="text-pl-accent">{radius} km</span>
              </h3>
              <p className="text-xs text-pl-gray-400 font-body mt-1">
                {t('dashboard.preferences.discoveryRadiusHint')}
              </p>
            </div>
            <input
              type="range"
              min="1"
              max="500"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-pl-accent h-2 bg-pl-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <h3 className="text-sm font-semibold tracking-[0.08em] uppercase text-pl-white font-body group-hover:text-pl-accent transition-colors">
                {t('dashboard.preferences.proximityEnabled')}
              </h3>
              <p className="text-xs text-pl-gray-400 font-body mt-1">
                {t('dashboard.preferences.proximityEnabledHint')}
              </p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={proximity}
                onChange={(e) => setProximity(e.target.checked)}
              />
              <div className="w-11 h-6 bg-pl-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pl-accent"></div>
            </div>
          </label>
        </section>

        {(validationError || isUpdateError) && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400 font-body">
              {validationError || t('dashboard.preferences.saveError')}
            </p>
          </div>
        )}

        {isSuccess && !isPending && !isUpdateError && (
          <div className="p-4 bg-pl-accent/10 border border-pl-accent/30 flex items-center gap-3">
            <Check className="w-5 h-5 text-pl-accent shrink-0" />
            <p className="text-sm text-pl-accent font-body">
              {t('dashboard.preferences.saveSuccess')}
            </p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 h-14 bg-pl-white text-pl-black font-semibold tracking-[0.12em] uppercase hover:bg-pl-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('dashboard.preferences.save')
          )}
        </button>

      </div>
    </div>
  )
}
