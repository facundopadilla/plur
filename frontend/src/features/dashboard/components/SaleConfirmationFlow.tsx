import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, X, Tag, AlertCircle, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/dashboard.store'
import { getCurrency, formatFiatPrice } from '../data/currencies'
import { apiClient } from '@/api/client'
import type { QRSalePayload } from '../types'

function extractApiError(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { detail?: string | Array<{ msg: string }> } } }
  const detail = axiosErr.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0)
    return detail.map((e) => e.msg).join('. ')
  return err instanceof Error ? err.message : fallback
}

interface SaleConfirmationFlowProps {
  payload: QRSalePayload
  onClose: () => void
}

type FlowStep = 'confirm' | 'waiting' | 'processing' | 'complete' | 'error'

const PLATFORM_FEE_RATE = 0.005

const PROCESSING_STEPS = [
  { key: 'verifying', duration: 1200 },
  { key: 'transferring', duration: 1800 },
  { key: 'commission', duration: 1500 },
  { key: 'fee', duration: 1600 },
] as const

interface SaleResponse {
  id: number
  status: string
  price_plr: number
  platform_fee: number
  garment_name: string
  buyer_name: string
  seller_name: string
  tx_hash?: string
}

export function SaleConfirmationFlow({ payload, onClose }: SaleConfirmationFlowProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { selectedCurrency, publishedGarments } = useDashboardStore()
  const currency = getCurrency(selectedCurrency)
  const [step, setStep] = useState<FlowStep>('confirm')
  const [processingIndex, setProcessingIndex] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [txHash, setTxHash] = useState('')
  const saleIdRef = useRef<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const platformFee = Math.ceil(payload.pricePLR * PLATFORM_FEE_RATE)
  const totalPLR = payload.pricePLR + platformFee

  const garmentImage = publishedGarments.find((g) => g.id === payload.garmentId)?.images[0]

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Processing animation after seller confirms
  useEffect(() => {
    if (step !== 'processing') return
    const config = PROCESSING_STEPS[processingIndex]
    if (!config) {
      setStep('complete')
      return
    }
    const timer = setTimeout(() => {
      setProcessingIndex((prev) => prev + 1)
    }, config.duration)
    return () => clearTimeout(timer)
  }, [step, processingIndex])

  const handleInitiateSale = async () => {
    setStep('waiting')
    try {
      const res = await apiClient.post<SaleResponse>('/sales/sales', {
        garment_id: Number(payload.garmentId),
      })
      const sale = res.data
      saleIdRef.current = sale.id

      // Start polling for seller confirmation
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await apiClient.get<SaleResponse>(`/sales/sales/${sale.id}`)
          const status = pollRes.data.status
          if (status === 'confirmed') {
            if (pollRef.current) clearInterval(pollRef.current)
            if (pollRes.data.tx_hash) setTxHash(pollRes.data.tx_hash)
            void queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
            void queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] })
            setStep('processing')
          } else if (status === 'rejected') {
            if (pollRef.current) clearInterval(pollRef.current)
            setErrorMsg(t('dashboard.sale.saleRejected'))
            setStep('error')
          } else if (status === 'expired') {
            if (pollRef.current) clearInterval(pollRef.current)
            setErrorMsg(t('dashboard.sale.saleExpired'))
            setStep('error')
          }
        } catch {
          // polling error — keep trying
        }
      }, 3000)
    } catch (err: unknown) {
      setErrorMsg(extractApiError(err, 'Error al iniciar la compra'))
      setStep('error')
    }
  }

  if (step === 'error') {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl px-5 py-8 flex flex-col items-center text-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-[13px] text-pl-gray-300 font-body leading-relaxed">{errorMsg}</p>
          <button
            onClick={onClose}
            className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase py-3 border border-pl-gray-600 text-pl-gray-400 font-body hover:text-pl-white transition-colors"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Garment image */}
          <div className="aspect-video bg-pl-gray-700 relative">
            {garmentImage ? (
              <img src={garmentImage} alt={payload.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Tag className="w-8 h-8 text-pl-gray-600" />
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-pl-black/70 flex items-center justify-center hover:bg-pl-black transition-colors"
            >
              <X className="w-3.5 h-3.5 text-pl-white" />
            </button>
          </div>

          <div className="px-4 py-4 space-y-3">
            <p className="text-[14px] font-semibold text-pl-white font-body leading-tight truncate">
              {payload.name}
            </p>

            <div className="space-y-1.5">
              <Row label={t('dashboard.sale.priceLabel')}>
                <span className="text-pl-white">{payload.pricePLR} PLR</span>
                <span className="text-pl-gray-400 text-[10px] ml-1">
                  {formatFiatPrice(payload.pricePLR, currency)}
                </span>
              </Row>
              <Row label={t('dashboard.sale.feeLabel')}>
                <span className="text-pl-gray-300">{platformFee} PLR</span>
              </Row>
              <Row label={t('dashboard.sale.avaxCommission')}>
                <span className="text-pl-gray-300">{t('dashboard.sale.avaxAmount')}</span>
              </Row>
              <div className="h-px bg-pl-gray-700 my-1" />
              <Row label={t('dashboard.sale.totalLabel')}>
                <span className="text-pl-accent font-semibold">{totalPLR} PLR</span>
                <span className="text-pl-gray-400 text-[10px] ml-1">
                  + {t('dashboard.sale.avaxAmount')}
                </span>
              </Row>
              <Row label={t('dashboard.sale.sellerLabel')}>
                <span className="text-pl-white">{payload.seller}</span>
              </Row>
            </div>

            <div className="h-px bg-pl-gray-700" />

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 text-[11px] font-semibold tracking-[0.1em] uppercase py-3 border border-pl-gray-600 text-pl-gray-400 font-body hover:border-pl-gray-400 hover:text-pl-white transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => void handleInitiateSale()}
                className="flex-[2] text-[11px] font-semibold tracking-[0.1em] uppercase py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors"
              >
                {t('dashboard.sale.confirmPurchase')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'waiting') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl px-5 py-8 flex flex-col items-center text-center gap-5">
          <Loader2 className="w-10 h-10 text-pl-accent animate-spin" />
          <div>
            <p className="text-[14px] font-semibold text-pl-white font-body mb-1">
              {t('dashboard.sale.waitingSeller')}
            </p>
            <p className="text-[11px] text-pl-gray-400 font-body leading-relaxed">
              {payload.name} — {totalPLR} PLR
            </p>
          </div>

          {/* Avalanche badge */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
            <p className="text-[10px] text-pl-gray-500 font-body">Avalanche C-Chain</p>
          </div>

          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current)
              onClose()
            }}
            className="text-[10px] text-pl-gray-500 font-body hover:text-pl-gray-300 transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'processing') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl px-5 py-6 space-y-4">
          <p className="text-[12px] font-semibold text-pl-white font-body uppercase tracking-[0.1em] text-center">
            {t('dashboard.sale.confirmTitle')}
          </p>

          <div className="space-y-3">
            {PROCESSING_STEPS.map((s, index) => {
              const isDone = index < processingIndex
              const isCurrent = index === processingIndex
              const isPending = index > processingIndex

              const label = (() => {
                if (s.key === 'verifying') return t('dashboard.sale.stepVerifying')
                if (s.key === 'transferring')
                  return t('dashboard.sale.stepTransferring', { amount: payload.pricePLR })
                if (s.key === 'commission') return t('dashboard.sale.stepCommission')
                return t('dashboard.sale.stepFee')
              })()

              return (
                <div
                  key={s.key}
                  className={cn('flex items-center gap-3 fade-in-up', isPending && 'opacity-30')}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {isDone ? (
                      <div className="w-6 h-6 rounded-full bg-pl-green/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-pl-green" />
                      </div>
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-pl-accent animate-spin" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-pl-gray-600" />
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-[12px] font-body leading-tight',
                      isDone ? 'text-pl-green' : isCurrent ? 'text-pl-white' : 'text-pl-gray-500',
                    )}
                  >
                    {label}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Avalanche badge */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
            <p className="text-[10px] text-pl-gray-500 font-body">Avalanche C-Chain</p>
          </div>
        </div>
      </div>
    )
  }

  // Complete
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl px-5 py-8 flex flex-col items-center text-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-full bg-pl-green/15 flex items-center justify-center scale-in">
          <Check className="w-8 h-8 text-pl-green" strokeWidth={2.5} />
        </div>

        <div>
          <p className="text-[16px] font-bold text-pl-white font-body leading-tight mb-1">
            {t('dashboard.sale.successTitle')}
          </p>
          <p className="text-[11px] text-pl-gray-400 font-body leading-relaxed">
            {t('dashboard.sale.successDescription')}
          </p>
        </div>

        <div className="w-full bg-pl-gray-700/50 border border-pl-gray-700 px-4 py-3 space-y-1.5">
          <Row label={t('dashboard.sale.successPaid')}>
            <span className="text-pl-white">-{totalPLR} PLR</span>
          </Row>
          <Row label={t('dashboard.sale.successSeller')}>
            <span className="text-pl-green font-semibold">+{payload.pricePLR} PLR</span>
          </Row>
          <Row label={t('dashboard.sale.feeLabel')}>
            <span className="text-pl-gray-400">{platformFee} PLR</span>
          </Row>
          <Row label={t('dashboard.sale.avaxCommission')}>
            <span className="text-pl-gray-400">{t('dashboard.sale.avaxAmount')}</span>
          </Row>
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

        <button
          onClick={onClose}
          className="w-full text-[11px] font-semibold tracking-[0.12em] uppercase py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors"
        >
          {t('common.confirm')}
        </button>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-pl-gray-400 font-body">{label}</span>
      <span className="text-[12px] font-body">{children}</span>
    </div>
  )
}
