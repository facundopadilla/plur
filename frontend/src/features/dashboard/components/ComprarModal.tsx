import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, Loader2, Minus, Plus, ExternalLink } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useCreateOrder } from '../hooks/usePurchaseOrder'

const PLR_PRICE_USD = 0.15
const AMOUNT_OPTIONS = [50, 100, 250, 500] as const

export function ComprarModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState(100)
  const [step, setStep] = useState<'select' | 'pending' | 'error'>('select')
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  
  const { mutate, isPending } = useCreateOrder()

  const costUsd = (amount * PLR_PRICE_USD).toFixed(2)

  const handlePurchase = () => {
    mutate(
      {
        amount_fiat: costUsd,
        currency_fiat: 'USD',
        amount_plr: String(amount)
      },
      {
        onSuccess: (data) => {
          const url = data.transak_session_data?.checkout_url
          if (url) {
            setCheckoutUrl(url)
            window.open(url, '_blank', 'noopener,noreferrer')
          }
          setStep('pending')
        },
        onError: () => {
          setStep('error')
        }
      }
    )
  }

  const handleClose = () => {
    if (step === 'pending') {
      void queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
      void queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] })
    }
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-pl-gray-700">
          <p className="text-[12px] font-semibold text-pl-white font-body uppercase tracking-[0.1em]">
            {t('dashboard.comprar.title')}
          </p>
          <button onClick={handleClose} className="w-6 h-6 rounded-full bg-pl-gray-700 flex items-center justify-center hover:bg-pl-gray-600 transition-colors">
            <X className="w-3.5 h-3.5 text-pl-gray-400" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {step === 'select' && (
            <>
              <div className="space-y-2">
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-400 font-body">
                  {t('dashboard.comprar.amount')}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {AMOUNT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAmount(opt)}
                      className={cn(
                        'py-2 text-[12px] font-semibold font-body rounded-lg transition-colors',
                        amount === opt
                          ? 'bg-pl-accent text-pl-black'
                          : 'bg-pl-gray-700 text-pl-gray-300 hover:bg-pl-gray-600',
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => setAmount(Math.max(10, amount - 10))} className="w-8 h-8 rounded-lg bg-pl-gray-700 flex items-center justify-center text-pl-gray-400 hover:text-pl-white transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="font-display text-2xl font-extrabold text-pl-white">{amount}</span>
                    <span className="text-[11px] text-pl-accent font-body ml-1">PLR</span>
                  </div>
                  <button onClick={() => setAmount(Math.min(10000, amount + 10))} className="w-8 h-8 rounded-lg bg-pl-gray-700 flex items-center justify-center text-pl-gray-400 hover:text-pl-white transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-pl-gray-700/50 border border-pl-gray-700 rounded-lg px-3 py-2.5 space-y-1.5">
                <Row label="Tokens"><span className="text-pl-white">{amount} PLR</span></Row>
                <Row label={t('dashboard.comprar.pricePerToken')}><span className="text-pl-white">US$ {PLR_PRICE_USD}</span></Row>
                <div className="h-px bg-pl-gray-600 my-1" />
                <Row label="Total"><span className="text-pl-accent font-semibold">US$ {costUsd}</span></Row>
              </div>

              <button
                onClick={handlePurchase}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim disabled:opacity-70 transition-colors rounded-lg"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t('dashboard.comprar.continue')}
              </button>
            </>
          )}

          {step === 'pending' && (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <Loader2 className="w-10 h-10 text-pl-accent animate-spin" />
              <div className="space-y-1">
                <p className="text-[14px] font-bold text-pl-white font-body">
                  {t('dashboard.comprar.pendingTitle')}
                </p>
                <p className="text-[11px] text-pl-gray-400 font-body">
                  {t('dashboard.comprar.pendingSubtext')}
                </p>
              </div>
              
              {checkoutUrl && (
                <button 
                  onClick={() => window.open(checkoutUrl, '_blank', 'noopener,noreferrer')}
                  className="flex items-center justify-center gap-2 w-full text-[11px] font-semibold tracking-[0.1em] uppercase py-2.5 px-4 mt-2 border border-pl-gray-600 text-pl-gray-300 font-body hover:text-pl-white hover:bg-pl-gray-700 transition-colors rounded-lg"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('dashboard.comprar.openTransak')}
                </button>
              )}
              
              <button 
                onClick={handleClose} 
                className="w-full text-[11px] font-semibold tracking-[0.1em] uppercase py-3 bg-pl-gray-700 text-pl-white font-body hover:bg-pl-gray-600 transition-colors rounded-lg mt-2"
              >
                {t('common.close')}
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
                <X className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-[12px] text-pl-gray-400 font-body">{t('dashboard.comprar.failed')}</p>
              <button 
                onClick={() => setStep('select')} 
                className="w-full text-[11px] font-semibold tracking-[0.1em] uppercase py-3 border border-pl-gray-600 text-pl-gray-400 font-body hover:text-pl-white transition-colors rounded-lg"
              >
                {t('common.back')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-pl-gray-400 font-body uppercase tracking-[0.08em]">{label}</span>
      <span className="text-[11px] font-body">{children}</span>
    </div>
  )
}
