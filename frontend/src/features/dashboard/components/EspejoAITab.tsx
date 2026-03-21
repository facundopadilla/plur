import { useState, useRef } from 'react'
import { Sparkles, Plus, Send, Upload, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDashboardStore } from '@/stores/dashboard.store'
import { cn } from '@/lib/utils'

const MOCK_AI_RESPONSE =
  'Esta prenda te quedaría genial con tu estilo. La combinación de colores y el corte se adaptan bien a tus preferencias. ¿Querés que te sugiera cómo combinarla?'

export function EspejoAITab() {
  const { t } = useTranslation()
  const { likedItems, chats, activeChat, createChat, setActiveChat, addMessage } =
    useDashboardStore()

  const [inputValue, setInputValue] = useState('')
  const [showGarmentPicker, setShowGarmentPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentChat = chats.find((c) => c.id === activeChat) ?? null

  const handleSend = () => {
    if (!inputValue.trim() || !activeChat) return
    addMessage(activeChat, { role: 'user', content: inputValue.trim() })
    setInputValue('')
    // Simulate AI response after a delay
    setTimeout(() => {
      addMessage(activeChat, { role: 'assistant', content: MOCK_AI_RESPONSE })
    }, 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = (garmentId: string, garmentName: string, garmentThumb: string) => {
    createChat(garmentId, garmentName, garmentThumb)
    setShowGarmentPicker(false)
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
          <ScrollArea className="flex-1 px-3 py-2">
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
                      'max-w-[85%] px-3 py-2 rounded-2xl text-[12px] font-body leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-pl-accent text-pl-black rounded-tr-sm'
                        : 'bg-pl-gray-700 text-pl-white rounded-tl-sm',
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-2 border-t border-pl-gray-700 flex items-center gap-2">
            <button
              aria-label={t('dashboard.espejo.uploadPhoto')}
              className="w-8 h-8 rounded-full border border-pl-gray-600 flex items-center justify-center text-pl-gray-400 hover:text-pl-white hover:border-pl-gray-400 transition-colors shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('dashboard.espejo.placeholder')}
              className="flex-1 min-w-0 bg-pl-gray-700 border border-pl-gray-600 text-pl-white placeholder:text-pl-gray-500 text-[12px] font-body rounded-full px-3 py-1.5 focus:outline-none focus:border-pl-accent/60"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              aria-label="Enviar"
              className="w-8 h-8 rounded-full bg-pl-accent text-pl-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pl-accent-dim transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
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
    </div>
  )
}
