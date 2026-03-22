import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Check, AlertCircle, Camera, Plus, X, ImageIcon, Coins, LogOut } from 'lucide-react'
import { usePreferences, useUpdatePreferences } from '../hooks/usePreferences'
import { STYLE_OPTIONS } from '@/features/onboarding/data/styles'
import { COLOR_OPTIONS } from '@/features/onboarding/data/colors'
import { CLOTHING_SIZES } from '@/features/onboarding/data/sizes'
import { CONDITION_OPTIONS, GENDER_OPTIONS } from '@/features/onboarding/data/preferences'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useCredits } from '../hooks/useCredits'
import { cn } from '@/lib/utils'

export function PerfilTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { credits } = useCredits()
  const setActiveTab = useDashboardStore((s) => s.setActiveTab)
  const setMobileOverlay = useDashboardStore((s) => s.setMobileOverlay)
  const referencePhotos = useProfileStore((s) => s.referencePhotos)
  const addReferencePhoto = useProfileStore((s) => s.addReferencePhoto)
  const removeReferencePhoto = useProfileStore((s) => s.removeReferencePhoto)
  const avatarDataUrl = useProfileStore((s) => s.avatarDataUrl)
  const setAvatarDataUrl = useProfileStore((s) => s.setAvatarDataUrl)
  const { data: preferences, isLoading, isError, error } = usePreferences()
  const { mutate: updatePreferences, isPending, isSuccess, isError: isUpdateError } = useUpdatePreferences()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const refPhotoInputRef = useRef<HTMLInputElement>(null)

  const [styles, setStyles] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [genders, setGenders] = useState<string[]>([])
  const [radius, setRadius] = useState<number>(50)
  const [proximity, setProximity] = useState<boolean>(true)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (preferences) {
      setStyles(preferences.styles || [])
      setSizes(preferences.sizes || [])
      setColors(preferences.colors || [])
      setConditions(preferences.conditions || [])
      setGenders(preferences.genders || [])
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

  const handleToggleCondition = (id: string) => {
    setConditions(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const handleToggleGender = (id: string) => {
    setGenders(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result
      if (typeof result === 'string') setAvatarDataUrl(result)
    }
    reader.readAsDataURL(file)
  }

  const handleAddReferencePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result
      if (typeof result === 'string') {
        addReferencePhoto({ label: 'custom', dataUrl: result })
      }
    }
    reader.readAsDataURL(file)
    if (refPhotoInputRef.current) refPhotoInputRef.current.value = ''
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
      conditions,
      genders,
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

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-8">

        {/* Profile photo & name */}
        <section className="flex flex-col items-center gap-3">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative group"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden bg-pl-gray-700 flex items-center justify-center">
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-2xl font-bold text-pl-gray-400">
                  {user?.first_name?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-pl-white" />
            </div>
          </button>
          {user && (
            <p className="text-sm font-semibold text-pl-white font-body">
              {user.first_name} {user.last_name}
            </p>
          )}
          <p className="text-[10px] text-pl-gray-500 font-body">{user?.email}</p>
          {!avatarDataUrl && (
            <p className="text-[10px] text-pl-gray-400 font-body mt-0.5">
              {t('dashboard.preferences.avatarHint')}
            </p>
          )}
        </section>

        {/* Credits button */}
        <button
          onClick={() => {
            setActiveTab('creditos')
            setMobileOverlay('creditos')
          }}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-pl-gray-800/60 border border-pl-gray-700 rounded-xl hover:border-pl-accent/40 hover:bg-pl-gray-800 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pl-accent/15 flex items-center justify-center">
              <Coins className="w-5 h-5 text-pl-accent" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-semibold text-pl-white font-body">
                {t('dashboard.profile.credits', { amount: credits })}
              </p>
              <p className="text-[10px] text-pl-gray-400 font-body">
                {t('dashboard.tabs.creditos')}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-pl-accent font-body group-hover:underline">
            {t('dashboard.creditos.buyCredits')}
          </span>
        </button>

        {/* Reference photos for AI */}
        <section>
          <div className="mb-4">
            <h3 className="text-sm font-semibold tracking-[0.08em] uppercase text-pl-white font-body">
              {t('dashboard.preferences.referencePhotos')}
            </h3>
            <p className="text-xs text-pl-gray-400 font-body mt-1">
              {t('dashboard.preferences.referencePhotosHint')}
            </p>
          </div>
          <input
            ref={refPhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAddReferencePhoto}
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {referencePhotos.map((photo) => (
              <div key={photo.id} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                <img src={photo.dataUrl} alt={photo.label} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeReferencePhoto(photo.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-pl-white" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => refPhotoInputRef.current?.click()}
              className="shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-pl-gray-600 flex flex-col items-center justify-center gap-1 text-pl-gray-500 hover:border-pl-accent hover:text-pl-accent transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[8px] font-body uppercase tracking-wider">Agregar</span>
            </button>
          </div>
          {referencePhotos.length === 0 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-pl-gray-700/40 border border-pl-gray-700 rounded-lg">
              <ImageIcon className="w-4 h-4 text-pl-gray-500 shrink-0" />
              <p className="text-[10px] text-pl-gray-500 font-body">
                {t('dashboard.preferences.noReferencePhotos')}
              </p>
            </div>
          )}
        </section>

        <div className="border-t border-pl-gray-700" />

        {/* Preferences title */}
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

        {/* Condition preference */}
        <section>
          <div className="mb-4">
            <h3 className="text-sm font-semibold tracking-[0.08em] uppercase text-pl-white font-body">
              {t('dashboard.preferences.conditions')}
            </h3>
            <p className="text-xs text-pl-gray-400 font-body mt-1">
              {t('dashboard.preferences.conditionsHint')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CONDITION_OPTIONS.map((cond) => {
              const isSelected = conditions.includes(cond.id)
              return (
                <button
                  key={cond.id}
                  onClick={() => handleToggleCondition(cond.id)}
                  className={cn(
                    'px-4 py-2 border text-sm font-body transition-colors',
                    isSelected
                      ? 'border-pl-accent bg-pl-accent/10 text-pl-accent'
                      : 'border-pl-gray-600 text-pl-gray-300 hover:border-pl-gray-400',
                  )}
                >
                  {t(cond.labelKey)}
                </button>
              )
            })}
          </div>
        </section>

        {/* Gender preference */}
        <section>
          <div className="mb-4">
            <h3 className="text-sm font-semibold tracking-[0.08em] uppercase text-pl-white font-body">
              {t('dashboard.preferences.genders')}
            </h3>
            <p className="text-xs text-pl-gray-400 font-body mt-1">
              {t('dashboard.preferences.gendersHint')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((gender) => {
              const isSelected = genders.includes(gender.id)
              return (
                <button
                  key={gender.id}
                  onClick={() => handleToggleGender(gender.id)}
                  className={cn(
                    'px-4 py-2 border text-sm font-body transition-colors',
                    isSelected
                      ? 'border-pl-accent bg-pl-accent/10 text-pl-accent'
                      : 'border-pl-gray-600 text-pl-gray-300 hover:border-pl-gray-400',
                  )}
                >
                  {t(gender.labelKey)}
                </button>
              )
            })}
          </div>
        </section>

        {/* Discovery radius */}
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
            <div className="relative pt-1">
              <input
                type="range"
                min="1"
                max="500"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-pl-gray-700 accent-pl-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pl-accent [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(200,255,0,0.2)] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-pl-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #C8FF00 0%, #C8FF00 ${((radius - 1) / 499) * 100}%, #303030 ${((radius - 1) / 499) * 100}%, #303030 100%)`,
                }}
              />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-pl-gray-500 font-body">1 km</span>
                <span className="text-[10px] text-pl-gray-500 font-body">500 km</span>
              </div>
            </div>
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
            <button
              type="button"
              onClick={() => setProximity(!proximity)}
              className={cn(
                'w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0',
                proximity ? 'bg-pl-accent' : 'bg-pl-gray-600',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                  proximity && 'translate-x-5',
                )}
              />
            </button>
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
          className="w-full flex items-center justify-center gap-2 h-14 bg-pl-accent text-pl-black font-semibold tracking-[0.12em] uppercase hover:bg-pl-accent-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('dashboard.preferences.save')
          )}
        </button>

        <div className="border-t border-pl-gray-700 pt-6">
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="w-full flex items-center justify-center gap-2 h-12 border border-red-500/30 text-red-400 font-semibold tracking-[0.08em] uppercase text-[12px] font-body rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('auth.logout')}
          </button>
        </div>

      </div>
    </div>
  )
}
