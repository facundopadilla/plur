import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, MessageCircle, MessageSquare, Plus, Send, Sparkles, Upload, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiClient } from '@/api/client'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useProfileStore } from '@/stores/profile.store'
import { cn } from '@/lib/utils'

interface MirrorChatResponse {
  reply: string
}

interface MirrorReferenceResponse {
  image_url: string
  message: string
}

interface MirrorGenerateResponse {
  image_url: string
  reply: string
  cost_plr: number
  remaining_credits: number
}

function extractApiError(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { detail?: string | Array<{ msg: string }> } } }
  const detail = axiosErr.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0)
    return detail.map((e) => e.msg).join('. ')
  return err instanceof Error ? err.message : fallback
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result !== 'string') {
        reject(new Error('Invalid file result'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}


export function EspejoAITab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { likedItems, chats, activeChat, createChat, setActiveChat, addMessage, setActiveTab, setMobileOverlay, setPendingSellerChatGarment } =
    useDashboardStore()
  const referencePhotos = useProfileStore((s) => s.referencePhotos)
  const addReferencePhoto = useProfileStore((s) => s.addReferencePhoto)

  const [inputValue, setInputValue] = useState('')
  const [showGarmentPicker, setShowGarmentPicker] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isUploadingReference, setIsUploadingReference] = useState(false)
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [showRefPicker, setShowRefPicker] = useState(false)
  const [showNoPhotoAlert, setShowNoPhotoAlert] = useState(false)
  const [showCostConfirm, setShowCostConfirm] = useState(false)
  const [skipCostConfirm, setSkipCostConfirm] = useState(() => localStorage.getItem('plur-skip-cost-confirm') === '1')
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentChat = chats.find((c) => c.id === activeChat) ?? null

  // Auto-scroll to bottom when messages change
  const msgCount = currentChat?.messages.length ?? 0
  const prevMsgCount = useRef(0)
  if (msgCount !== prevMsgCount.current) {
    prevMsgCount.current = msgCount
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleSend = async (): Promise<void> => {
    if (!inputValue.trim() || !activeChat) return

    const message = inputValue.trim()
    const garmentName = currentChat?.garmentName ?? ''
    addMessage(activeChat, { role: 'user', content: message })
    setInputValue('')
    setErrorMsg(null)
    setIsSending(true)

    try {
      const res = await apiClient.post<MirrorChatResponse>('/sales/mirror/chat', {
        garment_name: garmentName,
        message,
      })
      addMessage(activeChat, { role: 'assistant', content: res.data.reply })
    } catch (err: unknown) {
      addMessage(activeChat, {
        role: 'assistant',
        content: extractApiError(err, t('common.error')),
      })
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleNewChat = (garmentId: string, garmentName: string, garmentThumb: string) => {
    createChat(garmentId, garmentName, garmentThumb)
    setShowGarmentPicker(false)
  }

  const handleUploadReference = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file || !activeChat) return

    try {
      setIsUploadingReference(true)
      const dataUrl = await readFileAsDataUrl(file)
      addReferencePhoto({ label: 'custom', dataUrl })
      addMessage(activeChat, { role: 'user', content: '', imageUrl: dataUrl })

      const res = await apiClient.post<MirrorReferenceResponse>('/sales/mirror/reference', {
        image_data: dataUrl,
      })

      addMessage(activeChat, {
        role: 'assistant',
        content: res.data.message,
      })
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] })
      setErrorMsg(null)
    } catch (err: unknown) {
      addMessage(activeChat, {
        role: 'assistant',
        content: extractApiError(err, t('common.error')),
      })
      setErrorMsg(extractApiError(err, t('common.error')))
    } finally {
      setIsUploadingReference(false)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  const handleGenerateClick = () => {
    if (activeChat === null || currentChat === null) return
    if (isGeneratingTryOn || isUploadingReference || isSending) return

    if (referencePhotos.length === 0) {
      setShowNoPhotoAlert(true)
      return
    }

    if (skipCostConfirm) {
      pickOrGenerate()
      return
    }

    setShowCostConfirm(true)
  }

  const pickOrGenerate = () => {
    if (referencePhotos.length === 1) {
      void generateWithReference(referencePhotos[0]!.dataUrl)
    } else {
      setShowRefPicker(true)
    }
  }

  const handleCostConfirm = () => {
    setShowCostConfirm(false)
    // Small delay so the cost modal closes before ref picker opens
    setTimeout(pickOrGenerate, 100)
  }

  const generateWithReference = async (referenceDataUrl: string): Promise<void> => {
    if (activeChat === null || currentChat === null) return

    setShowRefPicker(false)
    setIsGeneratingTryOn(true)
    setErrorMsg(null)

    try {
      const res = await apiClient.post<MirrorGenerateResponse>('/sales/mirror/generate', {
        garment_name: currentChat.garmentName,
        garment_image: currentChat.garmentThumb,
        reference_image: referenceDataUrl,
      })

      addMessage(activeChat, {
        role: 'assistant',
        content: res.data.reply,
        imageUrl: res.data.image_url,
      })

      await queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] })
    } catch (err: unknown) {
      setErrorMsg(extractApiError(err, t('common.error')))
      addMessage(activeChat, {
        role: 'assistant',
        content: extractApiError(err, t('common.error')),
      })
    } finally {
      setIsGeneratingTryOn(false)
    }
  }

  if (chats.length === 0 && !showGarmentPicker) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-5 text-center gap-5 h-full">
        <Sparkles className="w-10 h-10 text-pl-gray-600" />
        <div>
          <p className="text-[13px] font-medium text-pl-white/80 font-body mb-2 leading-snug">
            {t('dashboard.espejo.title')}
          </p>
          <p className="text-[11px] text-pl-gray-500 font-body leading-relaxed">
            {t('dashboard.espejo.emptyChats')}
          </p>
        </div>
        {likedItems.length > 0 ? (
          <button
            onClick={() => setShowGarmentPicker(true)}
            className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase px-6 py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('dashboard.espejo.newChat')}
          </button>
        ) : (
          <p className="text-[11px] text-pl-gray-600 font-body italic">
            Primero guardá prendas en tu inventario
          </p>
        )}
      </div>
    )
  }

  if (showGarmentPicker) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-3 border-b border-pl-gray-700">
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-pl-gray-400 font-body">
            {t('dashboard.espejo.selectGarment')}
          </p>
          <button
            onClick={() => setShowGarmentPicker(false)}
            className="text-[11px] text-pl-gray-500 hover:text-pl-white font-body transition-colors"
          >
            Cancelar
          </button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {likedItems.map(({ garment }) => (
              <button
                key={garment.id}
                onClick={() =>
                  handleNewChat(garment.id, garment.name, garment.images[0] ?? '')
                }
                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-pl-gray-700 transition-colors text-left"
              >
                <img
                  src={garment.images[0]}
                  alt={garment.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-pl-white font-body truncate">
                    {garment.name}
                  </p>
                  <p className="text-[11px] text-pl-accent font-body">{garment.pricePLR} PLR</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat list sidebar + active chat */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-pl-gray-700 gap-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={cn(
                'shrink-0 w-8 h-8 rounded-full overflow-hidden border-2 transition-colors',
                chat.id === activeChat ? 'border-pl-accent' : 'border-pl-gray-600',
              )}
            >
              <img
                src={chat.garmentThumb}
                alt={chat.garmentName}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowGarmentPicker(true)}
          aria-label={t('dashboard.espejo.newChat')}
          className="w-8 h-8 rounded-full border border-pl-gray-600 flex items-center justify-center text-pl-gray-400 hover:text-pl-white hover:border-pl-gray-400 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      {currentChat !== null ? (
        <>
          <ScrollArea className="flex-1 min-h-0 px-3 py-2">
            <div className="space-y-3">
              {currentChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-pl-accent flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Sparkles className="w-3 h-3 text-pl-black" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl text-[12px] font-body leading-relaxed overflow-hidden',
                      msg.role === 'user'
                        ? 'bg-pl-accent text-pl-black rounded-tr-sm'
                        : 'bg-pl-gray-700 text-pl-white rounded-tl-sm',
                    )}
                  >
                    {msg.imageUrl !== undefined && (
                      <button
                        type="button"
                        onClick={() => setExpandedImage(msg.imageUrl ?? null)}
                        className="block cursor-zoom-in w-full"
                      >
                        <img
                          src={msg.imageUrl}
                          alt={msg.role === 'assistant' ? 'imagen generada por IA' : 'foto de referencia'}
                          className="w-full object-cover"
                        />
                      </button>
                    )}
                    {msg.content !== '' && (
                      <div className="px-3 py-2">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="border-t border-pl-gray-700 shrink-0 pb-[env(safe-area-inset-bottom)]">
            <div className="px-3 pt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const garment = currentChat
                    ? likedItems.find((li) => li.garment.id === currentChat.garmentId)?.garment ?? null
                    : null
                  if (garment) setPendingSellerChatGarment(garment)
                  setActiveTab('inventario')
                  setMobileOverlay('inventario')
                }}
                className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase py-2.5 border border-pl-gray-600 text-pl-gray-300 font-body rounded-lg hover:border-pl-accent hover:text-pl-accent transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {t('dashboard.espejo.chatSeller')}
              </button>
              <button
                type="button"
                onClick={handleGenerateClick}
                disabled={isGeneratingTryOn || isUploadingReference || isSending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-pl-accent text-pl-black font-body rounded-lg hover:bg-pl-accent-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingTryOn ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">
                      {t('dashboard.espejo.generating')}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">
                      {t('dashboard.espejo.tryOnLabel')}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  </>
                )}
              </button>
            </div>
            {errorMsg !== null && (
              <p className="px-3 pt-2 text-[10px] text-red-400 font-body">{errorMsg}</p>
            )}
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void handleUploadReference(event)
              }}
            />
            <div className="px-3 py-3 flex items-center gap-2.5">
              <button
                onClick={() => uploadRef.current?.click()}
                disabled={isUploadingReference || isGeneratingTryOn || isSending}
                aria-label={t('dashboard.espejo.uploadReference')}
                className="w-10 h-10 rounded-full border border-pl-gray-600 flex items-center justify-center text-pl-gray-400 hover:text-pl-white hover:border-pl-gray-400 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingReference ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('dashboard.espejo.placeholder')}
                className="flex-1 min-w-0 bg-pl-gray-700 border border-pl-gray-600 text-pl-white placeholder:text-pl-gray-500 text-[16px] lg:text-[13px] font-body rounded-full px-4 py-2.5 focus:outline-none focus:border-pl-accent/60"
              />
              <button
                onClick={() => {
                  void handleSend()
                }}
                disabled={!inputValue.trim() || isSending || isUploadingReference || isGeneratingTryOn}
                aria-label="Enviar"
                className="w-10 h-10 rounded-full bg-pl-accent text-pl-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pl-accent-dim transition-colors shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-8 h-8 text-pl-gray-600 mx-auto mb-2" />
            <p className="text-[11px] text-pl-gray-500 font-body">
              Seleccioná una prueba para ver el chat
            </p>
          </div>
        </div>
      )}

      {/* Cost confirmation popup */}
      {showCostConfirm && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6"
          onClick={() => setShowCostConfirm(false)}
        >
          <div
            className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-pl-accent/15 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-pl-accent" />
              </div>
              <p className="text-[13px] font-semibold text-pl-white font-body mb-1.5">
                {t('dashboard.espejo.costTitle')}
              </p>
              <p className="text-[11px] text-pl-gray-400 font-body leading-relaxed">
                {t('dashboard.espejo.costDesc')}
              </p>
            </div>
            <div className="px-5 pb-2 flex justify-center">
              <label className="inline-flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={skipCostConfirm}
                  onChange={(e) => {
                    setSkipCostConfirm(e.target.checked)
                    if (e.target.checked) {
                      localStorage.setItem('plur-skip-cost-confirm', '1')
                    } else {
                      localStorage.removeItem('plur-skip-cost-confirm')
                    }
                  }}
                  className="w-4 h-4 rounded border-pl-gray-600 bg-pl-gray-700 text-pl-accent accent-pl-accent cursor-pointer"
                />
                <span className="text-[11px] text-pl-gray-400 font-body group-hover:text-pl-gray-300 transition-colors">
                  {t('dashboard.espejo.dontShowAgain')}
                </span>
              </label>
            </div>
            <div className="px-5 pb-5 pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCostConfirm(false)}
                className="flex-1 text-[11px] font-semibold tracking-[0.08em] uppercase py-2.5 border border-pl-gray-600 text-pl-gray-300 font-body rounded-lg hover:border-pl-gray-400 hover:text-pl-white transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCostConfirm}
                className="flex-1 text-[11px] font-semibold tracking-[0.08em] uppercase py-2.5 bg-pl-accent text-pl-black font-body rounded-lg hover:bg-pl-accent-dim transition-colors"
              >
                {t('dashboard.espejo.confirmGenerate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No reference photo alert */}
      {showNoPhotoAlert && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6"
          onClick={() => setShowNoPhotoAlert(false)}
        >
          <div
            className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-[13px] font-semibold text-pl-white font-body mb-1.5">
                {t('dashboard.espejo.noPhotoTitle')}
              </p>
              <p className="text-[11px] text-pl-gray-400 font-body leading-relaxed">
                {t('dashboard.espejo.noPhotoDesc')}
              </p>
            </div>
            <div className="px-5 pb-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowNoPhotoAlert(false)
                  setActiveTab('perfil')
                  setMobileOverlay('perfil')
                }}
                className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase py-3 bg-pl-accent text-pl-black font-body rounded-lg hover:bg-pl-accent-dim transition-colors"
              >
                {t('dashboard.espejo.goToProfile')}
              </button>
              <button
                type="button"
                onClick={() => setShowNoPhotoAlert(false)}
                className="w-full text-[11px] font-medium text-pl-gray-400 font-body py-2 hover:text-pl-white transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference photo picker */}
      {showRefPicker && (
        <div
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setShowRefPicker(false)}
        >
          <div
            className="w-full max-w-sm bg-pl-gray-800 border-t border-pl-gray-700 rounded-t-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-pl-gray-700">
              <p className="text-[12px] font-semibold tracking-[0.1em] uppercase text-pl-white font-body">
                {t('dashboard.espejo.chooseReference')}
              </p>
              <button
                onClick={() => setShowRefPicker(false)}
                className="w-7 h-7 rounded-full bg-pl-gray-700 flex items-center justify-center hover:bg-pl-gray-600 transition-colors"
              >
                <X className="w-4 h-4 text-pl-gray-400" />
              </button>
            </div>
            <div className="p-4 pb-[calc(1rem+72px+env(safe-area-inset-bottom))] lg:pb-4">
              <p className="text-[11px] text-pl-gray-400 font-body mb-3">
                {t('dashboard.espejo.chooseReferenceHint')}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {referencePhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => void generateWithReference(photo.dataUrl)}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-pl-accent transition-colors group"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-pl-accent opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {expandedImage !== null && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setExpandedImage(null)}
        >
          <button
            onClick={() => setExpandedImage(null)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-pl-gray-700/80 flex items-center justify-center hover:bg-pl-gray-600 transition-colors z-10"
          >
            <X className="w-5 h-5 text-pl-white" />
          </button>
          <img
            src={expandedImage}
            alt="imagen ampliada"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
