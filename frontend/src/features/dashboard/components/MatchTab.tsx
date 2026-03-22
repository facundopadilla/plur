import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import {
  useOpenConversations,
  useFinalizedConversations,
  useConversationMessages,
  useSendMessage,
  type ConversationOut,
} from '../hooks/useConversations'

type ChatFilter = 'all' | 'buying' | 'selling'

export function MatchTab() {
  const user = useAuthStore((s) => s.user)
  const [selectedConv, setSelectedConv] = useState<ConversationOut | null>(null)

  if (selectedConv) {
    return (
      <ThreadView
        conversation={selectedConv}
        currentUserId={user?.id ?? null}
        onBack={() => setSelectedConv(null)}
      />
    )
  }

  return <ListView currentUserId={user?.id ?? null} onSelect={setSelectedConv} />
}

function ListView({
  currentUserId,
  onSelect,
}: {
  currentUserId: number | null
  onSelect: (conv: ConversationOut) => void
}) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<ChatFilter>('all')
  const { data: openConvs, isLoading: loadingOpen } = useOpenConversations()
  const { data: finalizedConvs, isLoading: loadingFin } = useFinalizedConversations()

  const filterConvs = (convs: ConversationOut[] | undefined): ConversationOut[] => {
    if (!convs) return []
    if (filter === 'all') return convs
    const uid = Number(currentUserId)
    return convs.filter((c) =>
      filter === 'buying' ? Number(c.buyer_id) === uid : Number(c.seller_id) === uid,
    )
  }

  const filteredOpen = filterConvs(openConvs)
  const filteredFinalized = filterConvs(finalizedConvs)

  const renderItem = (conv: ConversationOut) => {
    const isBuyer = Number(conv.buyer_id) === Number(currentUserId)
    const otherName = isBuyer ? conv.seller_name : conv.buyer_name
    const otherRole = isBuyer ? t('dashboard.match.seller') : t('dashboard.match.buyer')
    const updatedAt = new Date(conv.updated_at)
    const timeStr = updatedAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

    return (
      <button
        key={conv.id}
        onClick={() => onSelect(conv)}
        className="w-full flex items-center gap-3 text-left px-4 py-3 border-b border-pl-gray-700/50 hover:bg-pl-gray-800/50 transition-colors"
      >
        {/* Garment image */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-pl-gray-700 shrink-0">
          {conv.garment_image ? (
            <img
              src={conv.garment_image}
              alt={conv.garment_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[14px] font-bold text-pl-gray-500 font-display">
                {conv.garment_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[13px] font-semibold text-pl-white font-body truncate">
              {conv.garment_name}
            </span>
            <span className="text-[9px] text-pl-gray-500 font-body shrink-0">
              {timeStr}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-pl-gray-400 font-body font-medium shrink-0">
              {otherRole}:
            </span>
            <span className="text-[11px] text-pl-gray-300 font-body truncate">{otherName}</span>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full bg-pl-black">
      {/* Header + Filter chips */}
      <div className="px-4 py-3 border-b border-pl-gray-700 shrink-0 space-y-3">
        <h2 className="text-[14px] font-semibold tracking-[0.08em] text-pl-white uppercase font-body">
          {t('dashboard.match.title')}
        </h2>
        <div className="flex gap-1.5">
          {(['all', 'buying', 'selling'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-[10px] font-semibold tracking-[0.06em] uppercase font-body rounded-lg transition-colors',
                filter === f
                  ? 'bg-pl-accent text-pl-black'
                  : 'bg-pl-gray-700 text-pl-gray-300 hover:bg-pl-gray-600',
              )}
            >
              {t(`dashboard.match.filter${f.charAt(0).toUpperCase()}${f.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {/* Open */}
        {(loadingOpen || loadingFin) ? (
          <div className="flex flex-col gap-2 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-pl-gray-800 rounded-xl">
                <div className="w-12 h-12 bg-pl-gray-700 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-pl-gray-700 rounded w-1/3" />
                  <div className="h-2 bg-pl-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredOpen.length === 0 && filteredFinalized.length === 0 ? (
              <p className="text-[12px] text-pl-gray-500 font-body text-center py-12">
                {t('dashboard.match.emptyOpen')}
              </p>
            ) : (
              <>
                {filteredOpen.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-pl-gray-500 font-body px-4 pt-3 pb-1">
                      {t('dashboard.match.open')}
                    </p>
                    {filteredOpen.map(renderItem)}
                  </div>
                )}
                {filteredFinalized.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-pl-gray-500 font-body px-4 pt-4 pb-1">
                      {t('dashboard.match.finalized')}
                    </p>
                    {filteredFinalized.map(renderItem)}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  )
}

function ThreadView({
  conversation,
  currentUserId,
  onBack,
}: {
  conversation: ConversationOut
  currentUserId: number | null
  onBack: () => void
}) {
  const { t } = useTranslation()
  const { data: messages, isLoading } = useConversationMessages(conversation.id)
  const { mutate: sendMessage, isPending: isSending } = useSendMessage()

  const [inputValue, setInputValue] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const otherName =
    conversation.buyer_id === currentUserId ? conversation.seller_name : conversation.buyer_name

  const isReadOnly = ['finalized', 'rejected', 'expired'].includes(conversation.status)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim() || isSending || isReadOnly) return
    sendMessage(
      { conversationId: conversation.id, content: inputValue.trim() },
      { onSuccess: () => setInputValue('') },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-pl-black slide-in-right">
      {/* Header with garment image */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-pl-gray-700 shrink-0">
        <button
          onClick={onBack}
          aria-label={t('common.back')}
          className="text-pl-gray-400 hover:text-pl-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-pl-gray-700 shrink-0">
          {conversation.garment_image ? (
            <img
              src={conversation.garment_image}
              alt={conversation.garment_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[12px] font-bold text-pl-gray-500 font-display">
                {conversation.garment_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-pl-white font-body truncate leading-tight">
            {otherName}
          </p>
          <p className="text-[10px] text-pl-accent font-body truncate">
            {conversation.garment_name}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-4">
        <div className="flex flex-col gap-3 pb-4">
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-pl-gray-500" />
            </div>
          )}
          {messages?.map((msg) => {
            const isMe = Number(msg.sender_id) === Number(currentUserId)
            return (
              <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 font-body text-[12px] leading-relaxed',
                    isMe
                      ? 'bg-pl-accent text-pl-black rounded-tr-sm'
                      : 'bg-pl-gray-700 text-pl-white rounded-tl-sm',
                  )}
                >
                  {msg.content}
                  <div
                    className={cn(
                      'text-[9px] mt-1 opacity-50 text-right',
                      isMe ? 'text-pl-black' : 'text-pl-gray-400',
                    )}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 bg-pl-black border-t border-pl-gray-700 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        {isReadOnly ? (
          <div className="text-center py-2">
            <p className="text-[11px] text-pl-gray-400 font-body">
              {conversation.status === 'finalized'
                ? t('dashboard.match.statusFinalized')
                : conversation.status === 'rejected'
                  ? t('dashboard.match.statusRejected')
                  : t('dashboard.match.statusExpired')}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('dashboard.match.placeholder')}
              className="flex-1 min-w-0 bg-pl-gray-700 border border-pl-gray-600 text-pl-white placeholder:text-pl-gray-500 text-[16px] lg:text-[13px] font-body rounded-full px-4 py-2.5 focus:outline-none focus:border-pl-accent/60"
              disabled={isSending}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
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
        )}
      </div>
    </div>
  )
}
