import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, ArrowDownLeft, ShoppingCart, Loader2, ExternalLink, X, Copy, Check, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDashboardStore } from '@/stores/dashboard.store'
import type { CreditTransaction } from '../types'
import { CURRENCIES } from '../data/currencies'
import { cn } from '@/lib/utils'
import { useCredits } from '../hooks/useCredits'
import { ComprarModal } from './ComprarModal'

function TransactionIcon({ type }: { type: CreditTransaction['type'] }) {
  if (type === 'earned')
    return <ArrowUpRight className="w-4 h-4 text-pl-green shrink-0" />
  if (type === 'spent')
    return <ArrowDownLeft className="w-4 h-4 text-pl-red shrink-0" />
  return <ShoppingCart className="w-4 h-4 text-pl-accent shrink-0" />
}

function TransactionTypeLabel({ type, t }: { type: CreditTransaction['type']; t: (key: string) => string }) {
  if (type === 'earned') return <span className="text-pl-green">{t('dashboard.creditos.earned')}</span>
  if (type === 'spent') return <span className="text-pl-red">{t('dashboard.creditos.spent')}</span>
  return <span className="text-pl-accent">{t('dashboard.creditos.purchased')}</span>
}

function TransactionDetailModal({ tx, onClose }: { tx: CreditTransaction; onClose: () => void }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopyHash = async () => {
    if (!tx.txHash) return
    await navigator.clipboard.writeText(tx.txHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-pl-gray-700">
          <p className="text-[12px] font-semibold text-pl-white font-body uppercase tracking-[0.1em]">
            {t('dashboard.creditos.txDetail')}
          </p>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-pl-gray-700 flex items-center justify-center hover:bg-pl-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-pl-gray-400" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          {/* Amount */}
          <div className="flex items-center justify-center py-3">
            <div className="w-10 h-10 rounded-full bg-pl-gray-700 flex items-center justify-center mr-3">
              <TransactionIcon type={tx.type} />
            </div>
            <span
              className={cn(
                'font-display text-3xl font-extrabold tracking-[-0.04em]',
                tx.amount > 0 ? 'text-pl-green' : 'text-pl-red',
              )}
            >
              {tx.amount > 0 ? '+' : ''}{tx.amount}
            </span>
            <span className="text-[14px] text-pl-accent font-body font-semibold ml-1.5">PLR</span>
          </div>

          {/* Details */}
          <div className="bg-pl-gray-700/50 border border-pl-gray-700 rounded-lg px-3 py-2.5 space-y-2">
            <DetailRow label={t('dashboard.creditos.txType')}>
              <TransactionTypeLabel type={tx.type} t={t} />
            </DetailRow>
            <DetailRow label={t('dashboard.creditos.txDescription')}>
              <span className="text-pl-white">{tx.description}</span>
            </DetailRow>
            <DetailRow label={t('dashboard.creditos.txDate')}>
              <span className="text-pl-white">{tx.date}</span>
            </DetailRow>
            {tx.txHash && (
              <DetailRow label="Tx Hash">
                <button
                  onClick={() => void handleCopyHash()}
                  className="flex items-center gap-1 text-pl-accent hover:text-pl-accent-dim transition-colors"
                >
                  <span className="truncate max-w-[120px]">{tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}</span>
                  {copied ? (
                    <Check className="w-3 h-3 text-pl-green shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 shrink-0" />
                  )}
                </button>
              </DetailRow>
            )}
          </div>

          {/* Blockchain link */}
          {tx.txHash && (
            <a
              href={`https://testnet.snowtrace.io/tx/${tx.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.08em] py-2.5 border border-pl-gray-600 text-pl-accent font-body hover:border-pl-accent/50 transition-colors rounded-lg"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('dashboard.sale.viewOnChain')}
            </a>
          )}

          {/* Avalanche badge */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
            <p className="text-[10px] text-pl-gray-500 font-body">Avalanche C-Chain (Fuji Testnet)</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-pl-gray-400 font-body uppercase tracking-[0.08em]">{label}</span>
      <span className="text-[11px] font-body">{children}</span>
    </div>
  )
}

export function CreditosTab() {
  const { t } = useTranslation()
  const { credits, transactions, isLoading } = useCredits()
  const [selectedTx, setSelectedTx] = useState<CreditTransaction | null>(null)
  const [isComprarOpen, setIsComprarOpen] = useState(false)

  const selectedCurrency = useDashboardStore((s) => s.selectedCurrency)
  const setSelectedCurrency = useDashboardStore((s) => s.setSelectedCurrency)

  return (
    <div className="flex flex-col h-full">
      {/* Balance */}
      <div className="p-4 border-b border-pl-gray-700">
        <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-400 font-body mb-1">
          {t('dashboard.creditos.balance')}
        </p>
        <div className="flex items-baseline gap-2">
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-pl-gray-400" />
          ) : (
            <span className="font-display text-4xl font-extrabold text-pl-white tracking-[-0.04em]">
              {credits}
            </span>
          )}
          <span className="text-[13px] text-pl-accent font-body font-semibold tracking-[0.08em]">PLR</span>
        </div>
        <button
          onClick={() => setIsComprarOpen(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase py-2.5 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors rounded-lg"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {t('dashboard.comprar.title')}
        </button>
      </div>

      {/* Currency selector */}
      <div className="px-4 py-3 border-b border-pl-gray-700">
        <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-400 font-body mb-2">
          {t('dashboard.creditos.currency')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CURRENCIES.map((cur) => (
            <button
              key={cur.code}
              onClick={() => setSelectedCurrency(cur.code)}
              title={cur.name}
              className={cn(
                'px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase font-body rounded-sm transition-colors duration-150',
                selectedCurrency === cur.code
                  ? 'bg-pl-accent text-pl-black'
                  : 'bg-pl-gray-700 text-pl-gray-300 hover:bg-pl-gray-600 hover:text-pl-white',
              )}
            >
              {cur.code}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-pl-gray-600 font-body mt-1.5">
          {t('dashboard.creditos.currencyHint')}
        </p>
      </div>

      {/* Transaction history */}
      <div className="flex-1 min-h-0 flex flex-col">
        <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-400 font-body px-4 pt-3 pb-2">
          {t('dashboard.creditos.history')}
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-5 h-5 animate-spin text-pl-gray-500" />
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            {transactions.length === 0 ? (
              <p className="text-[12px] text-pl-gray-500 font-body px-4 py-8 text-center">
                {t('dashboard.creditos.emptyHistory')}
              </p>
            ) : (
              <div className="px-3 pb-4 space-y-1">
                {transactions.map((tx) => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => setSelectedTx(tx)}
                    className="w-full flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-pl-gray-700 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-pl-gray-700 flex items-center justify-center shrink-0">
                      <TransactionIcon type={tx.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-pl-white font-body truncate leading-tight">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[10px] text-pl-gray-500 font-body">{tx.date}</p>
                        {tx.txHash && (
                          <div className="w-1.5 h-1.5 rounded-full bg-pl-accent shrink-0" title="On-chain" />
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-[13px] font-semibold font-body shrink-0',
                        tx.amount > 0 ? 'text-pl-green' : 'text-pl-red',
                      )}
                    >
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      {/* Transaction detail modal */}
      {selectedTx && (
        <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
      )}

      {isComprarOpen && (
        <ComprarModal onClose={() => setIsComprarOpen(false)} />
      )}
    </div>
  )
}
