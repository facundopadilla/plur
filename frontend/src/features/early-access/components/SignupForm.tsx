import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, X, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { SectionWrapper } from '@/features/landing/components/SectionWrapper'
import { RevealOnScroll } from '@/features/landing/components/RevealOnScroll'
import { apiClient } from '@/api/client'

interface PhotoItem {
  file: File
  preview: string
  description: string
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const MAX_PHOTOS = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function SignupForm() {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const addPhotos = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const remaining = MAX_PHOTOS - photos.length
      const newPhotos: PhotoItem[] = []

      for (let i = 0; i < Math.min(files.length, remaining); i++) {
        const file = files[i]
        if (!file) continue
        if (!ALLOWED_TYPES.has(file.type)) continue
        if (file.size > MAX_FILE_SIZE) continue

        newPhotos.push({
          file,
          preview: URL.createObjectURL(file),
          description: '',
        })
      }

      setPhotos((prev) => [...prev, ...newPhotos])
    },
    [photos.length],
  )

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const updateDescription = useCallback((index: number, value: string) => {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, description: value } : p)))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      addPhotos(e.dataTransfer.files)
    },
    [addPhotos],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setErrorMessage(t('earlyAccess.form.validation.emailRequired'))
      setStatus('error')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('email', email.trim())
      formData.append('name', name.trim())

      const descriptions = photos.map((p) => p.description)
      formData.append('descriptions', JSON.stringify(descriptions))

      for (const photo of photos) {
        formData.append('photos', photo.file)
      }

      await apiClient.post('/early-access/signup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setStatus('success')
    } catch {
      setErrorMessage(t('earlyAccess.form.validation.submitError'))
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <SectionWrapper theme="dark" id="signup-form">
        <div className="max-w-[600px] mx-auto text-center py-12">
          <RevealOnScroll>
            <CheckCircle2 className="w-16 h-16 text-pl-accent mx-auto mb-6" />
            <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-extrabold tracking-[-0.04em] leading-[0.95] uppercase mb-4 text-pl-white">
              {t('earlyAccess.form.success.title')}
            </h2>
            <p className="text-[clamp(14px,1.1vw,17px)] font-light leading-[1.7] text-pl-white/60 font-body">
              {t('earlyAccess.form.success.description')}
            </p>
          </RevealOnScroll>
        </div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper theme="dark" id="signup-form">
      <div className="max-w-[640px] mx-auto">
        <RevealOnScroll>
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-pl-accent mb-4 font-body text-center">
            {t('earlyAccess.form.eyebrow')}
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,4rem)] font-extrabold tracking-[-0.05em] leading-[0.95] uppercase mb-4 text-pl-white text-center">
            {t('earlyAccess.form.title')}
          </h2>
          <p className="text-[clamp(13px,1vw,16px)] font-light leading-[1.7] text-pl-white/50 mb-12 font-body text-center max-w-[500px] mx-auto">
            {t('earlyAccess.form.subtitle')}
          </p>
        </RevealOnScroll>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {/* Email */}
          <RevealOnScroll delay={1}>
            <label className="block">
              <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-pl-white/70 mb-2 block font-body">
                {t('earlyAccess.form.emailLabel')} *
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('earlyAccess.form.emailPlaceholder')}
                className="w-full px-4 py-3.5 bg-pl-gray-700 border border-pl-gray-600 text-pl-white text-[14px] font-body placeholder:text-pl-gray-400 focus:outline-none focus:border-pl-accent transition-colors duration-300"
              />
            </label>
          </RevealOnScroll>

          {/* Name */}
          <RevealOnScroll delay={2}>
            <label className="block">
              <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-pl-white/70 mb-2 block font-body">
                {t('earlyAccess.form.nameLabel')}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('earlyAccess.form.namePlaceholder')}
                className="w-full px-4 py-3.5 bg-pl-gray-700 border border-pl-gray-600 text-pl-white text-[14px] font-body placeholder:text-pl-gray-400 focus:outline-none focus:border-pl-accent transition-colors duration-300"
              />
            </label>
          </RevealOnScroll>

          {/* Photo upload */}
          <RevealOnScroll delay={3}>
            <div>
              <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-pl-white/70 mb-2 block font-body">
                {t('earlyAccess.form.photosLabel')}
              </span>
              <p className="text-[12px] font-light text-pl-white/40 mb-4 font-body">
                {t('earlyAccess.form.photosHint')}
              </p>

              {/* Photo grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {photos.map((photo, i) => (
                    <div key={photo.preview} className="relative group">
                      <div className="aspect-[3/4] overflow-hidden bg-pl-gray-700 border border-pl-gray-600">
                        <img
                          src={photo.preview}
                          alt={photo.description || `${t('earlyAccess.form.photoAlt')} ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-pl-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer border-0"
                      >
                        <X className="w-3.5 h-3.5 text-pl-white" />
                      </button>
                      <input
                        type="text"
                        value={photo.description}
                        onChange={(e) => updateDescription(i, e.target.value)}
                        placeholder={t('earlyAccess.form.descriptionPlaceholder')}
                        className="w-full mt-1.5 px-2.5 py-2 bg-pl-gray-700 border border-pl-gray-600 text-pl-white text-[12px] font-body placeholder:text-pl-gray-400 focus:outline-none focus:border-pl-accent transition-colors duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Upload area */}
              {photos.length < MAX_PHOTOS && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-pl-gray-600 hover:border-pl-accent/50 transition-colors duration-300 cursor-pointer"
                >
                  {photos.length === 0 ? (
                    <Camera className="w-8 h-8 text-pl-gray-400" />
                  ) : (
                    <Plus className="w-6 h-6 text-pl-gray-400" />
                  )}
                  <span className="text-[13px] text-pl-white/40 font-body text-center">
                    {photos.length === 0
                      ? t('earlyAccess.form.uploadPrompt')
                      : t('earlyAccess.form.uploadMore', { remaining: MAX_PHOTOS - photos.length })}
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => addPhotos(e.target.files)}
                className="hidden"
              />
            </div>
          </RevealOnScroll>

          {/* Error */}
          {status === 'error' && errorMessage && (
            <div className="flex items-center gap-2 text-pl-red text-[13px] font-body">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit */}
          <RevealOnScroll>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase px-8 py-4 bg-pl-accent text-pl-black font-body cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(200,255,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              style={{ transitionTimingFunction: 'var(--pl-ease-out)' }}
            >
              {status === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('earlyAccess.form.submitting')}
                </span>
              ) : (
                t('earlyAccess.form.submitButton')
              )}
            </button>
          </RevealOnScroll>

          <p className="text-[11px] text-pl-white/25 text-center font-body">
            {t('earlyAccess.form.disclaimer')}
          </p>
        </form>
      </div>
    </SectionWrapper>
  )
}
