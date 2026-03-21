import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { X, Check, Loader2, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { useAuthStore } from '@/stores/auth.store'
import { getCurrency, formatFiatPrice } from '../data/currencies'
import { useDashboardStore } from '@/stores/dashboard.store'
import { apiClient } from '@/api/client'
import type { PublishedGarment, QRSalePayload } from '../types'

function extractApiError(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { detail?: string | Array<{ msg: string }> } } }
  const detail = axiosErr.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0)
    return detail.map((e) => e.msg).join('. ')
  return err instanceof Error ? err.message : fallback
}

interface SaleQRModalProps {
  garment: PublishedGarment
  onClose: () => void
}

interface PendingSale {
  id: number
  garment_id: number
  garment_name: string
  buyer_name: string
  price_plr: number
  platform_fee: number
}

type SellerStep = 'qr' | 'confirming' | 'processing' | 'done' | 'error'

export function SaleQRModal({ garment, onClose }: SaleQRModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const { selectedCurrency, markGarmentAsSold } = useDashboardStore()
  const currency = getCurrency(selectedCurrency)

  const [sellerStep, setSellerStep] = useState<SellerStep>('qr')
  const [pendingSale, setPendingSale] = useState<PendingSale | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sellerName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : 'Vendedor'

  const garmentBackendId = garment.backendId ?? garment.id

  const payload: QRSalePayload = {
    garmentId: String(garmentBackendId),
    name: garment.name,
    pricePLR: garment.pricePLR,
    seller: sellerName,
  }

  // Poll for pending sales while showing QR
  useEffect(() => {
    if (sellerStep !== 'qr') return

    pollRef.current = setInterval(async () => {
      try {
        const res = await apiClient.get<PendingSale[]>('/sales/sales/pending')
        const matching = res.data.find(
          (s) => String(s.garment_id) === String(garmentBackendId),
        )
        if (matching) {
          if (pollRef.current) clearInterval(pollRef.current)
          setPendingSale(matching)
          setSellerStep('confirming')
        }
      } catch {
        // polling error — keep trying
      }
    }, 3000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [sellerStep, garmentBackendId])

  const handleConfirm = async () => {
    if (!pendingSale) return
    setSellerStep('processing')
    try {
      await apiClient.post(`/sales/sales/${pendingSale.id}/confirm`)
      markGarmentAsSold(String(garment.id))
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] })
      setSellerStep('done')
    } catch (err: unknown) {
      setErrorMsg(extractApiError(err, 'Error al confirmar la venta'))
      setSellerStep('error')
    }
  }

  const handleReject = async () => {
    if (!pendingSale) return
    try {
      await apiClient.post(`/sales/sales/${pendingSale.id}/reject`)
      setPendingSale(null)
      setSellerStep('qr')
    } catch {
      // ignore
    }
  }

  // Seller confirmation popup
  if (sellerStep === 'confirming' && pendingSale) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-4 pt-5 pb-4 text-center">
            <p className="text-[13px] font-semibold text-pl-white font-body">
              {t('dashboard.sale.sellerConfirmTitle')}
            </p>
            <p className="text-[11px] text-pl-gray-400 font-body mt-1">
              {t('dashboard.sale.sellerConfirmDesc', { buyer: pendingSale.buyer_name })}
            </p>
          </div>

          <div className="px-4 pb-4 space-y-2">
            <div className="bg-pl-gray-700/50 border border-pl-gray-700 px-4 py-3 space-y-1.5">
              <Row label={t('dashboard.sale.priceLabel')}>
                <span className="text-pl-accent font-semibold">{pendingSale.price_plr} PLR</span>
              </Row>
              <Row label={t('dashboard.sale.feeLabel')}>
                <span className="text-pl-gray-400">{pendingSale.platform_fee} PLR</span>
              </Row>
              <Row label={garment.name}>
                <span className="text-pl-gray-300">{formatFiatPrice(pendingSale.price_plr, currency)}</span>
              </Row>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => void handleReject()}
                className="flex-1 text-[11px] font-semibold tracking-[0.1em] uppercase py-3 border border-pl-gray-600 text-pl-gray-400 font-body hover:border-red-500/60 hover:text-red-400 transition-colors"
              >
                {t('dashboard.sale.sellerRejectButton')}
              </button>
              <button
                onClick={() => void handleConfirm()}
                className="flex-[2] text-[11px] font-semibold tracking-[0.1em] uppercase py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors"
              >
                {t('dashboard.sale.sellerConfirmButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (sellerStep === 'processing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl px-5 py-8 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-pl-accent animate-spin" />
          <p className="text-[12px] text-pl-gray-300 font-body">{t('dashboard.sale.stepVerifying')}</p>
        </div>
      </div>
    )
  }

  if (sellerStep === 'done') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl px-5 py-8 flex flex-col items-center text-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 rounded-full bg-pl-green/15 flex items-center justify-center scale-in">
            <Check className="w-8 h-8 text-pl-green" strokeWidth={2.5} />
          </div>
          <p className="text-[14px] font-bold text-pl-white font-body">
            {t('dashboard.sale.successTitle')}
          </p>
          <p className="text-[11px] text-pl-gray-400 font-body">
            {t('dashboard.sale.successDescription')}
          </p>
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

  if (sellerStep === 'error') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl px-5 py-8 flex flex-col items-center text-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-[13px] text-pl-gray-300 font-body">{errorMsg}</p>
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

  // Default: QR display
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-pl-gray-800 border border-pl-gray-700 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-4 pt-5 pb-4 text-center">
          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current)
              onClose()
            }}
            aria-label={t('common.back')}
            className="absolute top-3 right-3 text-pl-gray-500 hover:text-pl-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="text-[13px] font-semibold text-pl-white font-body">
            {t('dashboard.sale.qrTitle')}
          </p>
          <p className="text-[11px] text-pl-gray-400 font-body mt-0.5 truncate">{garment.name}</p>
          <p className="text-[12px] font-semibold text-pl-accent font-body tracking-[0.06em] mt-1">
            {garment.pricePLR} PLR
            <span className="text-pl-gray-400 font-normal ml-1.5 text-[10px]">
              {formatFiatPrice(garment.pricePLR, currency)}
            </span>
          </p>
        </div>

        {/* QR code */}
        <div className="flex justify-center px-6 pb-4">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG
              value={JSON.stringify(payload)}
              size={180}
              level="M"
              bgColor="#FFFFFF"
              fgColor="#0A0A0A"
            />
          </div>
        </div>

        {/* Instruction */}
        <div className="px-4 pb-5 text-center">
          <p className="text-[11px] text-pl-gray-400 font-body leading-relaxed">
            {t('dashboard.sale.qrInstruction')}
          </p>
          {/* Polling indicator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <Loader2 className="w-3 h-3 text-pl-accent animate-spin" />
            <p className="text-[10px] text-pl-gray-500 font-body">
              {t('dashboard.sale.waitingBuyer')}
            </p>
          </div>
        </div>
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
