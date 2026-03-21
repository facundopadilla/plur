import { useState, useRef } from 'react'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDashboardStore } from '@/stores/dashboard.store'
import { cn } from '@/lib/utils'

interface PublishGarmentFormProps {
  onBack: () => void
  onPublish: () => void
}

const STYLES = ['Casual', 'Streetwear', 'Formal', 'Deportivo', 'Vintage', 'Bohemio', 'Minimalista', 'Urbano', 'Clásico', 'Punk']
const CONDITIONS = ['Nuevo', 'Excelente', 'Bueno', 'Regular']

const inputClass =
  'w-full bg-pl-gray-700 border border-pl-gray-600 text-pl-white placeholder:text-pl-gray-500 text-[12px] font-body rounded-lg px-3 py-2 focus:outline-none focus:border-pl-accent/60'
const labelClass = 'block text-[10px] font-medium tracking-[0.1em] uppercase text-pl-gray-400 font-body mb-1'

export function PublishGarmentForm({ onBack, onPublish }: PublishGarmentFormProps) {
  const { t } = useTranslation()
  const { addPublishedGarment, addTransaction } = useDashboardStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [images, setImages] = useState<string[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pricePLR, setPricePLR] = useState('')
  const [size, setSize] = useState('')
  const [style, setStyle] = useState(STYLES[0] ?? 'Casual')
  const [condition, setCondition] = useState(CONDITIONS[0] ?? 'Nuevo')
  const [location, setLocation] = useState('')
  const [tags, setTags] = useState('')

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || images.length === 0 || !pricePLR) return

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    addPublishedGarment({
      name: name.trim(),
      description: description.trim(),
      images,
      pricePLR: Number(pricePLR),
      size: size.trim(),
      style,
      condition,
      location: location.trim(),
      tags: tagList,
    })

    addTransaction({
      type: 'earned',
      amount: 50,
      description: `Publicación: ${name.trim()}`,
      date: new Date().toLocaleDateString('es-AR'),
    })

    onPublish()
  }

  const canSubmit = name.trim() !== '' && images.length > 0 && pricePLR !== ''

  return (
    <div className="flex flex-col h-full slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-pl-gray-700 shrink-0">
        <button
          onClick={onBack}
          aria-label={t('common.back')}
          className="text-pl-gray-400 hover:text-pl-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-pl-gray-300 font-body">
          {t('dashboard.publish.title')}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <form onSubmit={handleSubmit} className="p-3 space-y-4">
          {/* Photos */}
          <div>
            <label className={labelClass}>{t('dashboard.publish.addPhotos')}</label>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative w-16 h-16">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pl-black border border-pl-gray-600 flex items-center justify-center text-pl-gray-400 hover:text-pl-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border border-dashed border-pl-gray-600 flex flex-col items-center justify-center gap-1 text-pl-gray-500 hover:text-pl-gray-300 hover:border-pl-gray-400 transition-colors"
              >
                <ImagePlus className="w-5 h-5" />
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
              placeholder="Describí la prenda..."
              rows={3}
              className={cn(inputClass, 'resize-none')}
            />
          </div>

          {/* Price */}
          <div>
            <label className={labelClass}>{t('dashboard.publish.price')}</label>
            <input
              type="number"
              min="1"
              value={pricePLR}
              onChange={(e) => setPricePLR(e.target.value)}
              placeholder="Ej: 80"
              className={inputClass}
            />
          </div>

          {/* Size + Style row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>{t('dashboard.publish.size')}</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="M, L, 28..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('dashboard.publish.style')}</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className={cn(inputClass, 'cursor-pointer')}
              >
                {STYLES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition + Location row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>{t('dashboard.publish.condition')}</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className={cn(inputClass, 'cursor-pointer')}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('dashboard.publish.location')}</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Palermo, CABA..."
                className={inputClass}
              />
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
            className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase px-4 py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('dashboard.publish.publishButton')}
          </button>
        </form>
      </ScrollArea>
    </div>
  )
}
