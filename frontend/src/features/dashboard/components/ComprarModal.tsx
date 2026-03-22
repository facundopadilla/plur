import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, Loader2, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateOrder, useOrderStatus } from '../hooks/usePurchaseOrder'
import { cn } from '@/lib/utils'

export function ComprarModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  
  const [amount, setAmount] = useState('10000')
  const [currency, setCurrency] = useState('ARS')
  const [orderId, setOrderId] = useState<number | null>(null)
  
  // A simple mock rate for the hackathon (e.g. 1000 ARS = 1 PLR, 1 USD = 1 PLR)
  const rate = currency === 'ARS' ? 1000 : 1
  const plrAmount = (Number(amount) / rate).toFixed(2)

  const createOrder = useCreateOrder()
  const orderStatus = useOrderStatus(orderId)

  const status = orderStatus.data?.status
  
  useEffect(() => {
    if (status === 'settled') {
      void queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
      void queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] })
    }
  }, [status, queryClient])

  const handleCreateOrder = async () => {
    if (!amount || isNaN(Number(amount))) return
    
    try {
      const res = await createOrder.mutateAsync({
        amount_fiat: amount,
        currency_fiat: currency,
        amount_plr: plrAmount
      })
      setOrderId(res.order_id)
      
      // Auto-open Transak
      if (res.transak_session_data?.checkout_url) {
        window.open(res.transak_session_data.checkout_url, '_blank')
      }
    } catch (error) {
      console.error('Order creation failed:', error)
    }
  }

  const renderContent = () => {
    if (status === 'settled') {
      return (
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-pl-green/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-pl-green" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-[16px] font-bold text-pl-white tracking-[-0.02em]">
              {t('dashboard.comprar.success')}
            </h3>
            <p className="text-[12px] text-pl-gray-400 font-body">
              {t('dashboard.comprar.successDesc')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-4 flex items-center justify-center text-[11px] font-semibold tracking-[0.1em] uppercase py-3 bg-pl-gray-700 text-pl-white font-body hover:bg-pl-gray-600 transition-colors rounded-lg"
          >
            {t('dashboard.comprar.close')}
          </button>
        </div>
      )
    }

    if (status === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-pl-red/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-pl-red" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-[16px] font-bold text-pl-white tracking-[-0.02em]">
              {t('dashboard.comprar.failed')}
            </h3>
            <p className="text-[12px] text-pl-gray-400 font-body">
              {t('dashboard.comprar.failedDesc')}
            </p>
          </div>
          <button
            onClick={() => setOrderId(null)}
            className="w-full mt-4 flex items-center justify-center text-[11px] font-semibold tracking-[0.1em] uppercase py-3 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors rounded-lg"
          >
            {t('dashboard.comprar.retry')}
          </button>
        </div>
      )
    }

    if (status === 'reconciling') {
      return (
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <Loader2 className="w-12 h-12 text-pl-accent animate-spin" />
          <div className="text-center space-y-1">
            <h3 className="text-[16px] font-bold text-pl-white tracking-[-0.02em]">
              {t('dashboard.comprar.reconciling')}
            </h3>
            <p className="text-[12px] text-pl-gray-400 font-body">
              {t('dashboard.comprar.reconcilingDesc')}
            </p>
          </div>
        </div>
      )
    }

    if (orderId && status === 'pending') {
      const checkoutUrl = createOrder.data?.transak_session_data?.checkout_url
      return (
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <Loader2 className="w-12 h-12 text-pl-accent animate-spin" />
          <div className="text-center space-y-1">
            <h3 className="text-[16px] font-bold text-pl-white tracking-[-0.02em]">
              {t('dashboard.comprar.openingTransak')}
            </h3>
            <p className="text-[12px] text-pl-gray-400 font-body">
              {t('dashboard.comprar.doNotClose')}
            </p>
          </div>
          {checkoutUrl ? (
            <button
              onClick={() => window.open(checkoutUrl, '_blank')}
              className="w-full mt-4 flex items-center justify-center text-[11px] font-semibold tracking-[0.1em] uppercase py-3 bg-pl-gray-700 text-pl-white font-body hover:bg-pl-gray-600 transition-colors rounded-lg"
            >
              {t('dashboard.comprar.openTransakBtn')}
            </button>
          ) : (
            <pre className="text-[10px] text-pl-gray-500 bg-black/50 p-2 rounded w-full overflow-auto">
              {JSON.stringify(createOrder.data?.transak_session_data, null, 2)}
            </pre>
          )}
        </div>
      )
    }

    // Input step
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-400 font-body">
            {t('dashboard.comprar.currencyLabel')}
          </label>
          <div className="flex flex-wrap gap-2">
            {['ARS', 'USD'].map((cur) => (
              <button
                key={cur}
                onClick={() => setCurrency(cur)}
                className={cn(
                  'flex-1 py-2 text-[12px] font-semibold tracking-[0.1em] uppercase font-body rounded-lg transition-colors',
                  currency === cur
                    ? 'bg-pl-accent text-pl-black'
                    : 'bg-pl-gray-700 text-pl-gray-300 hover:bg-pl-gray-600'
                )}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-400 font-body">
            {t('dashboard.comprar.amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-pl-gray-700 border border-pl-gray-600 rounded-lg px-4 py-3 text-pl-white font-display text-xl font-bold tracking-[-0.02em] focus:outline-none focus:border-pl-accent transition-colors"
              placeholder="0"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-pl-gray-400 font-body font-semibold">
              {currency}
            </div>
          </div>
          <div className="flex items-center justify-between text-[12px] font-body">
            <span className="text-pl-gray-400">Recibís:</span>
            <span className="text-pl-accent font-bold">{plrAmount} PLR</span>
          </div>
        </div>

        {createOrder.isError && (
          <p className="text-[11px] text-pl-red font-body text-center">
            Error al crear la orden.
          </p>
        )}

        <button
          onClick={() => void handleCreateOrder()}
          disabled={createOrder.isPending || !amount || isNaN(Number(amount))}
          className="w-full flex items-center justify-center gap-2 text-[12px] font-semibold tracking-[0.1em] uppercase py-3.5 bg-pl-accent text-pl-black font-body hover:bg-pl-accent-dim transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createOrder.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShoppingBag className="w-4 h-4" />
          )}
          {t('dashboard.comprar.payWith', { currency })}
        </button>
      </div>
    )
  }

  const isClosable = !orderId || status === 'settled' || status === 'failed'

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={() => isClosable && onClose()}
    >
      <div
        className="w-full max-w-sm bg-pl-gray-800 border border-pl-gray-700 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-pl-gray-700">
          <p className="text-[12px] font-semibold text-pl-white font-body uppercase tracking-[0.1em]">
            {t('dashboard.comprar.title')}
          </p>
          {isClosable && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-pl-gray-700 flex items-center justify-center hover:bg-pl-gray-600 transition-colors"
            >
              <X className="w-4 h-4 text-pl-gray-400" />
            </button>
          )}
        </div>
        <div className="p-5">
          {renderContent()}
        </div>
      </div>
    </div>,
    document.body
  )
}
