import { useState, useRef, useMemo } from 'react'
import { ArrowLeft, Camera, X, AlertCircle, Loader2, Sparkles, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { usePublishGarment } from '../hooks/useGarments'
import { CLOTHING_SIZES } from '@/features/onboarding/data/sizes'
import { CURRENCIES, getCurrency, formatFiatPrice } from '../data/currencies'
import { useDashboardStore } from '@/stores/dashboard.store'
import { apiClient } from '@/api/client'
import type { CurrencyCode } from '../types'

const PLATFORM_FEE_RATE = 0.005

interface PublishGarmentFormProps {
  onBack: () => void
  onPublish: () => void
}

const STYLES = ['Casual', 'Streetwear', 'Formal', 'Deportivo', 'Vintage', 'Bohemio', 'Minimalista', 'Urbano', 'Clásico', 'Punk', 'Romántico', 'Grunge']
const CONDITIONS = ['Nuevo', 'Excelente', 'Bueno', 'Aceptable']
const GENDERS = ['Mujer', 'Hombre', 'Unisex']

interface GarmentAnalysis {
  name: string
  description: string
  size: string
  style: string
  condition: string
  gender: string
  tags: string[]
}

const labelClass = 'block text-[10px] font-medium tracking-[0.1em] uppercase text-pl-gray-400 font-body mb-2'
const inputClass =
  'w-full bg-pl-gray-700 border border-pl-gray-600 text-pl-white placeholder:text-pl-gray-500 text-[16px] lg:text-[12px] font-body rounded-lg px-3 py-2.5 focus:outline-none focus:border-pl-accent/60'

export function PublishGarmentForm({ onBack, onPublish }: PublishGarmentFormProps) {
  const { t } = useTranslation()
  const publishGarment = usePublishGarment()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedCurrency = useDashboardStore((s) => s.selectedCurrency)
  const [priceCurrency, setPriceCurrency] = useState<CurrencyCode>(selectedCurrency)
  const [priceFiat, setPriceFiat] = useState('')

  const currency = getCurrency(priceCurrency)
  const priceCalc = useMemo(() => {
    const fiat = parseFloat(priceFiat)
    if (!priceFiat || isNaN(fiat) || fiat <= 0) return null
    const plr = Math.round(fiat / currency.rateToPLR)
    const fee = Math.ceil(plr * PLATFORM_FEE_RATE)
    const sellerReceives = plr - fee
    return { plr, fee, sellerReceives }
  }, [priceFiat, currency])

  const [images, setImages] = useState<string[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [size, setSize] = useState('')
  const [style, setStyle] = useState('')
  const [condition, setCondition] = useState('')
  const [gender, setGender] = useState('')
  const [tags, setTags] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setImages((prev) => [...prev, result])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleAnalyzeWithAI = async () => {
    if (images.length === 0 || isAnalyzing) return
    setIsAnalyzing(true)
    setAnalyzeError(null)
    try {
      const response = await apiClient.post<GarmentAnalysis>('/sales/garments/analyze', {
        image_data: images[0],
      })
      const data = response.data
      if (data.name) setName(data.name)
      if (data.description) setDescription(data.description)
      if (data.size) setSize(data.size)
      if (data.style) setStyle(data.style)
      if (data.condition) setCondition(data.condition)
      if (data.gender) setGender(data.gender)
      if (data.tags && data.tags.length > 0) setTags(data.tags.join(', '))
    } catch {
      setAnalyzeError(t('dashboard.publish.aiError'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || images.length === 0 || !priceCalc || publishGarment.isPending) return

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    publishGarment.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        images,
        price_plr: priceCalc.plr,
        size,
        style,
        condition,
        location: '',
        tags: tagList,
      },
      {
        onSuccess: () => onPublish(),
      },
    )
  }

  const canSubmit = name.trim() !== '' && images.length > 0 && priceCalc !== null && !publishGarment.isPending

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-pl-gray-700 shrink-0">
        <button
          onClick={onBack}
          aria-label={t('common.back')}
          className="text-pl-gray-400 hover:text-pl-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <p className="text-[12px] font-semibold tracking-[0.1em] uppercase text-pl-white font-body">
          {t('dashboard.publish.title')}
        </p>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-4 space-y-5 pb-8">
          {publishGarment.isError && (
            <div className="flex items-center gap-2 text-[11px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{t('dashboard.publish.publishError')}</span>
            </div>
          )}

          {/* Photos */}
          <div>
            <label className={labelClass}>{t('dashboard.publish.addPhotos')}</label>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden group border border-pl-gray-600 shadow-md"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-pl-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[8px] font-bold tracking-wider uppercase bg-pl-accent text-pl-black px-1.5 py-0.5 rounded">
                      {t('dashboard.publish.mainPhoto')}
                    </span>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-pl-gray-600 flex flex-col items-center justify-center gap-2 text-pl-gray-500 hover:text-pl-accent hover:border-pl-accent hover:bg-pl-accent/5 transition-all"
              >
                {images.length === 0 ? (
                  <>
                    <Upload className="w-6 h-6" />
                    <span className="text-[9px] font-body font-medium uppercase tracking-wider">{t('dashboard.publish.uploadPhoto')}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span className="text-[8px] font-body uppercase tracking-wider">+Foto</span>
                  </>
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files)
              }}
            />
          </div>

          {/* AI Autocomplete button */}
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => void handleAnalyzeWithAI()}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.08em] uppercase px-4 py-3 bg-pl-accent/15 border border-pl-accent/40 text-pl-accent font-body rounded-lg hover:bg-pl-accent/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('dashboard.publish.aiAnalyzing')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('dashboard.publish.aiComplete')}
                </>
              )}
            </button>
          )}

          {analyzeError && (
            <div className="flex items-center gap-2 text-[11px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{analyzeError}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className={labelClass}>{t('dashboard.publish.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Bomber Vintage Negra"
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>{t('dashboard.publish.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí la prenda, material, estado..."
              rows={3}
              className={cn(inputClass, 'resize-none')}
            />
          </div>

          {/* Price with currency selector */}
          <div>
            <label className={labelClass}>{t('dashboard.publish.price')}</label>

            {/* Currency chips */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {CURRENCIES.map((cur) => (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => setPriceCurrency(cur.code)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase font-body rounded-lg transition-colors',
                    priceCurrency === cur.code
                      ? 'bg-pl-accent text-pl-black'
                      : 'bg-pl-gray-700 text-pl-gray-300 border border-pl-gray-600 hover:border-pl-gray-400',
                  )}
                >
                  {cur.code}
                </button>
              ))}
            </div>

            {/* Price input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-pl-gray-400 font-body">
                {currency.symbol}
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={priceFiat}
                onChange={(e) => setPriceFiat(e.target.value)}
                placeholder="Ej: 4.000"
                className={cn(inputClass, 'pl-12')}
              />
            </div>

            {/* Conversion breakdown */}
            {priceCalc !== null && (
              <div className="mt-3 bg-pl-gray-700/50 border border-pl-gray-600 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-pl-gray-400 font-body uppercase tracking-wider">
                    Precio en PLR
                  </span>
                  <span className="text-[13px] font-bold text-pl-accent font-body">
                    {priceCalc.plr} PLR
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-pl-gray-400 font-body uppercase tracking-wider">
                    Comisión Plur (0.5%)
                  </span>
                  <span className="text-[11px] text-pl-red font-semibold font-body">
                    -{priceCalc.fee} PLR
                  </span>
                </div>
                <div className="border-t border-pl-gray-600 pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-pl-white font-semibold font-body uppercase tracking-wider">
                    Vas a recibir
                  </span>
                  <div className="text-right">
                    <span className="text-[14px] font-bold text-pl-green font-body">
                      {priceCalc.sellerReceives} PLR
                    </span>
                    <p className="text-[10px] text-pl-gray-400 font-body">
                      ≈ {formatFiatPrice(priceCalc.sellerReceives, currency)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Size — selectable chips */}
          <div>
            <label className={labelClass}>{t('dashboard.publish.size')}</label>
            <div className="flex flex-wrap gap-1.5">
              {CLOTHING_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(size === s ? '' : s)}
                  className={cn(
                    'min-w-[2.5rem] h-9 px-2.5 flex items-center justify-center text-[11px] font-semibold font-body rounded-lg transition-colors',
                    size === s
                      ? 'bg-pl-accent text-pl-black'
                      : 'bg-pl-gray-700 text-pl-gray-300 border border-pl-gray-600 hover:border-pl-gray-400',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Style — selectable chips */}
          <div>
            <label className={labelClass}>{t('dashboard.publish.style')}</label>
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(style === s ? '' : s)}
                  className={cn(
                    'px-3 py-1.5 text-[10px] font-semibold font-body tracking-[0.04em] rounded-lg transition-colors',
                    style === s
                      ? 'bg-pl-accent text-pl-black'
                      : 'bg-pl-gray-700 text-pl-gray-300 border border-pl-gray-600 hover:border-pl-gray-400',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Condition — selectable chips */}
          <div>
            <label className={labelClass}>{t('dashboard.publish.condition')}</label>
            <div className="flex flex-wrap gap-1.5">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondition(condition === c ? '' : c)}
                  className={cn(
                    'px-3 py-1.5 text-[10px] font-semibold font-body tracking-[0.04em] rounded-lg transition-colors',
                    condition === c
                      ? 'bg-pl-accent text-pl-black'
                      : 'bg-pl-gray-700 text-pl-gray-300 border border-pl-gray-600 hover:border-pl-gray-400',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Gender — selectable chips */}
          <div>
            <label className={labelClass}>{t('dashboard.filters.gender')}</label>
            <div className="flex flex-wrap gap-1.5">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(gender === g ? '' : g)}
                  className={cn(
                    'px-3 py-1.5 text-[10px] font-semibold font-body tracking-[0.04em] rounded-lg transition-colors',
                    gender === g
                      ? 'bg-pl-accent text-pl-black'
                      : 'bg-pl-gray-700 text-pl-gray-300 border border-pl-gray-600 hover:border-pl-gray-400',
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={labelClass}>{t('dashboard.publish.tags')}</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t('dashboard.publish.tagsHint')}
              className={inputClass}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase px-4 py-3.5 bg-pl-accent text-pl-black font-body rounded-lg hover:bg-pl-accent-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {publishGarment.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t('dashboard.publish.publishButton')
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
