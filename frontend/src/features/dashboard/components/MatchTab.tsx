import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Send, MessageCircle } from 'lucide-react'
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
  const { data: openConvs, isLoading: loadingOpen, isError: errorOpen } = useOpenConversations()
  const { data: finalizedConvs, isLoading: loadingFin, isError: errorFin } = useFinalizedConversations()

  const getOtherName = (conv: ConversationOut) =>
    conv.buyer_id === currentUserId ? conv.seller_name : conv.buyer_name

  const renderSkeleton = () => (
    <div className="flex flex-col gap-2 p-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-pl-gray-800 rounded-xl">
          <div className="w-10 h-10 bg-pl-gray-700 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-pl-gray-700 rounded w-1/3" />
            <div className="h-2 bg-pl-gray-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )

  const renderList = (
    convs: ConversationOut[] | undefined,
    loading: boolean,
    error: boolean,
    emptyKey: string
  ) => {
    if (loading) return renderSkeleton()
    if (error) return <div className="p-4 text-xs text-red-400">{t('common.error')}</div>
    if (!convs || convs.length === 0) {
      return <div className="p-4 text-xs text-pl-gray-400 font-body">{t(emptyKey)}</div>
    }

    return (
      <div className="flex flex-col">
        {convs.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className="flex flex-col items-start text-left p-4 border-b border-pl-gray-800 hover:bg-pl-gray-800/50 transition-colors"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[13px] font-semibold text-pl-white font-body truncate">
                {getOtherName(conv)}
              </span>
              <span className="text-[10px] text-pl-gray-400 font-mono">
                {new Date(conv.updated_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-pl-gray-300 font-body w-full">
              <MessageCircle className="w-3 h-3 text-pl-accent shrink-0" />
              <span className="truncate flex-1">{conv.garment_name}</span>
            </div>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-pl-black">
      <div className="px-4 py-3 border-b border-pl-gray-800 shrink-0">
        <h2 className="text-[14px] font-medium tracking-[0.1em] text-pl-white uppercase font-body">
          {t('dashboard.match.open')}
        </h2>
      </div>
      <ScrollArea className="flex-1 h-0 min-h-0">
        <div className="pb-4">
          {renderList(openConvs, loadingOpen, errorOpen, 'dashboard.match.emptyOpen')}
        </div>
        
        <div className="px-4 py-3 border-y border-pl-gray-800 shrink-0 mt-2 bg-pl-gray-900/50">
          <h2 className="text-[14px] font-medium tracking-[0.1em] text-pl-gray-400 uppercase font-body">
            {t('dashboard.match.finalized')}
          </h2>
        </div>
        <div className="pb-4">
          {renderList(finalizedConvs, loadingFin, errorFin, 'dashboard.match.emptyFinalized')}
        </div>
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
      {
        onSuccess: () => setInputValue(''),
      }
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
      <div className="flex items-center gap-3 px-3 py-3 border-b border-pl-gray-700 shrink-0">
        <button
          onClick={onBack}
          aria-label={t('common.back')}
          className="text-pl-gray-400 hover:text-pl-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-pl-white font-body truncate leading-tight">
            {otherName}
          </p>
          <p className="text-[10px] text-pl-accent font-body truncate">
            {conversation.garment_name}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4 pb-4">
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="w-5 h-5 border-2 border-pl-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {messages?.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 font-body text-[12px] leading-relaxed',
                  isMe
                    ? 'self-end bg-pl-accent text-pl-black rounded-tr-sm'
                    : 'self-start bg-pl-gray-800 text-pl-white rounded-tl-sm border border-pl-gray-700'
                )}
              >
                {msg.content}
                <div
                  className={cn(
                    'text-[9px] mt-1 opacity-60 text-right',
                    isMe ? 'text-pl-black' : 'text-pl-gray-400'
                  )}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

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
          <div className="flex items-end gap-2 bg-pl-gray-900 rounded-xl p-1.5 border border-pl-gray-700 focus-within:border-pl-accent transition-colors">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('dashboard.match.placeholder')}
              className="flex-1 bg-transparent border-none focus:ring-0 text-pl-white text-[13px] font-body px-3 py-2 min-w-0"
              disabled={isSending}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-pl-accent text-pl-black disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
