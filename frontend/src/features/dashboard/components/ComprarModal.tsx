import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, Loader2, ArrowLeftRight, CreditCard, Lock, Check, ChevronLeft, ExternalLink } from 'lucide-react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/dashboard.store'
import { getCurrency } from '../data/currencies'
import { apiClient } from '@/api/client'

interface PurchaseResponse {
  credits: number
  tx_hash: string
}

function usePurchasePLR() {
  return useMutation({
    mutationFn: async (amount_plr: number) => {
      const res = await apiClient.post<PurchaseResponse>('/sales/wallet/purchase', { amount_plr })
      return res.data
    },
  })
}

export function ComprarModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const selectedCurrency = useDashboardStore((s) => s.selectedCurrency)
  const currency = getCurrency(selectedCurrency)
  const purchase = usePurchasePLR()

  const [step, setStep] = useState<'calculator' | 'payment' | 'processing' | 'success' | 'error'>('calculator')
  const [inputMode, setInputMode] = useState<'fiat' | 'plr'>('plr')
  const [plrAmount, setPlrAmount] = useState(100)
  const [fiatAmount, setFiatAmount] = useState(100 * currency.rateToPLR)

  // Card form state (mock)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [processingStep, setProcessingStep] = useState(0)
  const [txHash, setTxHash] = useState('')

  const handlePlrChange = (value: string) => {
    const num = Math.max(0, Math.min(10000, Number(value) || 0))
    setPlrAmount(num)
    setFiatAmount(Math.round(num * currency.rateToPLR * 100) / 100)
  }

  const handleFiatChange = (value: string) => {
    const num = Math.max(0, Number(value) || 0)
    setFiatAmount(num)
    setPlrAmount(Math.round(num / currency.rateToPLR))
  }

  const toggleMode = () => {
    setInputMode(inputMode === 'fiat' ? 'plr' : 'fiat')
  }

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return digits
  }

  const canPay = cardNumber.replace(/\s/g, '').length === 16 && cardExpiry.length === 5 && cardCvv.length >= 3 && cardName.length >= 2 && plrAmount > 0

  const handlePay = () => {
    setStep('processing')
    setProcessingStep(0)
  }

  // Processing animation sequence
  useEffect(() => {
    if (step !== 'processing') return
    const timers = [
      setTimeout(() => setProcessingStep(1), 1200),
      setTimeout(() => setProcessingStep(2), 2400),
      setTimeout(() => {
        purchase.mutate(plrAmount, {
          onSuccess: (data) => {
            setTxHash(data.tx_hash)
            setProcessingStep(3)
            setTimeout(() => setStep('success'), 800)
          },
          onError: () => setStep('error'),
        })
      }, 3500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [step])

  const handleClose = () => {
    if (step === 'success') {
      void queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
      void queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] })
    }
    onClose()
  }

  const fiatFormatted = new Intl.NumberFormat('es-AR', { maximumFractionDigits: currency.rateToPLR < 1 ? 2 : 0 }).format(fiatAmount)

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="w-full max-w-sm bg-pl-gray-800 border border-pl-gray-700 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-pl-gray-700">
          <div className="flex items-center gap-2">
            {step === 'payment' && (
              <button onClick={() => setStep('calculator')} className="text-pl-gray-400 hover:text-pl-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <p className="text-[12px] font-semibold text-pl-white font-body uppercase tracking-[0.1em]">
              {t('dashboard.comprar.title')}
            </p>
          </div>
          <button onClick={handleClose} className="w-6 h-6 rounded-full bg-pl-gray-700 flex items-center justify-center hover:bg-pl-gray-600 transition-colors">
            <X className="w-3.5 h-3.5 text-pl-gray-400" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* STEP 1: Calculator */}
          {step === 'calculator' && (
            <>
              <div className="space-y-3">
                {/* Top input */}
                <div className="bg-pl-gray-700/50 border border-pl-gray-600 rounded-xl p-3">
                  <p className="text-[9px] text-pl-gray-400 font-body uppercase tracking-wider mb-1.5">
                    {inputMode === 'plr' ? t('dashboard.comprar.youGet') : t('dashboard.comprar.youPay')}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={inputMode === 'plr' ? plrAmount : fiatAmount}
                      onChange={(e) => inputMode === 'plr' ? handlePlrChange(e.target.value) : handleFiatChange(e.target.value)}
                      className="flex-1 bg-transparent text-2xl font-display font-extrabold text-pl-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-[13px] font-semibold text-pl-accent font-body shrink-0">
                      {inputMode === 'plr' ? 'PLR' : currency.code}
                    </span>
                  </div>
                </div>

                {/* Swap button */}
                <div className="flex justify-center -my-1">
                  <button
                    onClick={toggleMode}
                    className="w-9 h-9 rounded-full bg-pl-gray-700 border border-pl-gray-600 flex items-center justify-center text-pl-gray-400 hover:text-pl-accent hover:border-pl-accent/40 transition-colors"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom display */}
                <div className="bg-pl-gray-700/50 border border-pl-gray-600 rounded-xl p-3">
                  <p className="text-[9px] text-pl-gray-400 font-body uppercase tracking-wider mb-1.5">
                    {inputMode === 'plr' ? t('dashboard.comprar.youPay') : t('dashboard.comprar.youGet')}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={inputMode === 'plr' ? fiatAmount : plrAmount}
                      onChange={(e) => inputMode === 'plr' ? handleFiatChange(e.target.value) : handlePlrChange(e.target.value)}
                      className="flex-1 bg-transparent text-2xl font-display font-extrabold text-pl-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-[13px] font-semibold text-pl-accent font-body shrink-0">
                      {inputMode === 'plr' ? currency.code : 'PLR'}
                    </span>
                  </div>
                </div>

                {/* Rate info */}
                <p className="text-[10px] text-pl-gray-500 font-body text-center">
                  1 PLR = {currency.symbol} {currency.rateToPLR < 1 ? currency.rateToPLR.toFixed(3) : currency.rateToPLR}
                </p>

                {/* Quick amounts */}
                <div className="flex gap-1.5">
                  {[50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handlePlrChange(String(amt))}
                      className={cn(
                        'flex-1 py-2 text-[11px] font-semibold font-body rounded-lg transition-colors',
                        plrAmount === amt
                          ? 'bg-pl-accent text-pl-black'
                          : 'bg-pl-gray-700 text-pl-gray-300 hover:bg-pl-gray-600',
                      )}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('payment')}
                disabled={plrAmount < 1}
                className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim disabled:opacity-40 transition-colors rounded-lg"
              >
                {t('dashboard.comprar.continue')}
              </button>
            </>
          )}

          {/* STEP 2: Card Payment */}
          {step === 'payment' && (
            <>
              <div className="space-y-3">
                {/* Summary */}
                <div className="bg-pl-gray-700/50 border border-pl-gray-600 rounded-lg px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-pl-gray-400 font-body">{plrAmount} PLR</span>
                  <span className="text-[12px] font-semibold text-pl-accent font-body">{currency.symbol} {fiatFormatted}</span>
                </div>

                {/* Card brands */}
                <div className="flex items-center gap-3 justify-center">
                  <div className="px-2 py-1 bg-pl-gray-700 rounded text-[10px] font-bold font-body text-blue-400 border border-pl-gray-600">VISA</div>
                  <div className="px-2 py-1 bg-pl-gray-700 rounded text-[10px] font-bold font-body text-orange-400 border border-pl-gray-600">MC</div>
                  <div className="px-2 py-1 bg-pl-gray-700 rounded text-[10px] font-bold font-body text-sky-400 border border-pl-gray-600">AMEX</div>
                </div>

                {/* Card number */}
                <div>
                  <label className="block text-[9px] font-medium tracking-[0.1em] uppercase text-pl-gray-400 font-body mb-1.5">
                    {t('dashboard.comprar.cardNumber')}
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pl-gray-500" />
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="w-full bg-pl-gray-700 border border-pl-gray-600 text-pl-white placeholder:text-pl-gray-500 text-[12px] font-body rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-pl-accent/60 tracking-wider"
                    />
                  </div>
                </div>

                {/* Expiry + CVV row */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[9px] font-medium tracking-[0.1em] uppercase text-pl-gray-400 font-body mb-1.5">
                      {t('dashboard.comprar.cardExpiry')}
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full bg-pl-gray-700 border border-pl-gray-600 text-pl-white placeholder:text-pl-gray-500 text-[12px] font-body rounded-lg px-3 py-2.5 focus:outline-none focus:border-pl-accent/60 tracking-wider"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[9px] font-medium tracking-[0.1em] uppercase text-pl-gray-400 font-body mb-1.5">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className="w-full bg-pl-gray-700 border border-pl-gray-600 text-pl-white placeholder:text-pl-gray-500 text-[12px] font-body rounded-lg px-3 py-2.5 focus:outline-none focus:border-pl-accent/60 tracking-wider"
                    />
                  </div>
                </div>

                {/* Card name */}
                <div>
                  <label className="block text-[9px] font-medium tracking-[0.1em] uppercase text-pl-gray-400 font-body mb-1.5">
                    {t('dashboard.comprar.cardName')}
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full bg-pl-gray-700 border border-pl-gray-600 text-pl-white placeholder:text-pl-gray-500 text-[12px] font-body rounded-lg px-3 py-2.5 focus:outline-none focus:border-pl-accent/60"
                  />
                </div>

                {/* Secure badge */}
                <div className="flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3 text-pl-gray-500" />
                  <p className="text-[9px] text-pl-gray-500 font-body">{t('dashboard.comprar.secure')}</p>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={!canPay}
                className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-lg"
              >
                {t('dashboard.comprar.pay')} {currency.symbol} {fiatFormatted}
              </button>
            </>
          )}

          {/* STEP 3: Processing Animation */}
          {step === 'processing' && (
            <div className="flex flex-col items-center py-8 gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-pl-accent/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-pl-accent/40 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-pl-accent animate-spin" />
                </div>
              </div>

              <div className="w-full space-y-2.5">
                {[
                  t('dashboard.comprar.stepVerifying'),
                  t('dashboard.comprar.stepProcessing'),
                  t('dashboard.comprar.stepMinting'),
                  t('dashboard.comprar.stepDone'),
                ].map((label, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500',
                      processingStep > i ? 'bg-pl-accent' : processingStep === i ? 'bg-pl-accent/30 animate-pulse' : 'bg-pl-gray-700',
                    )}>
                      {processingStep > i && <Check className="w-3 h-3 text-pl-black" />}
                    </div>
                    <span className={cn(
                      'text-[11px] font-body transition-colors',
                      processingStep >= i ? 'text-pl-white' : 'text-pl-gray-600',
                    )}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-pl-accent/15 flex items-center justify-center">
                <Check className="w-8 h-8 text-pl-accent" />
              </div>
              <div className="space-y-1">
                <p className="text-[16px] font-bold text-pl-white font-body">
                  {t('dashboard.comprar.success')}
                </p>
                <p className="text-[13px] font-display font-extrabold text-pl-accent">
                  +{plrAmount} PLR
                </p>
                <p className="text-[11px] text-pl-gray-400 font-body">
                  {t('dashboard.comprar.successHint')}
                </p>
              </div>
              {txHash && (
                <a
                  href={`https://testnet.snowtrace.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.08em] py-2.5 border border-pl-gray-600 text-pl-accent font-body hover:border-pl-accent/50 transition-colors rounded-lg"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('dashboard.sale.viewOnChain')}
                </a>
              )}
              {txHash && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                  <p className="text-[9px] text-pl-gray-500 font-body">Avalanche C-Chain (Fuji Testnet)</p>
                </div>
              )}
              <button
                onClick={handleClose}
                className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors rounded-lg"
              >
                {t('common.close')}
              </button>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
                <X className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-[12px] text-pl-gray-400 font-body">{t('dashboard.comprar.failed')}</p>
              <button
                onClick={() => setStep('calculator')}
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
