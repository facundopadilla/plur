import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { useTranslation } from 'react-i18next'
import { SaleConfirmationFlow } from './SaleConfirmationFlow'
import type { QRSalePayload } from '../types'

interface QRScannerOverlayProps {
  onClose: () => void
}

function isValidQRPayload(data: unknown): data is QRSalePayload {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj['garmentId'] === 'string' &&
    typeof obj['name'] === 'string' &&
    typeof obj['pricePLR'] === 'number' &&
    typeof obj['seller'] === 'string'
  )
}

export function QRScannerOverlay({ onClose }: QRScannerOverlayProps) {
  const { t } = useTranslation()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const startPromiseRef = useRef<Promise<void> | null>(null)
  const stoppedRef = useRef(false)
  const processedRef = useRef(false)
  const tRef = useRef(t)
  tRef.current = t

  const [scanResult, setScanResult] = useState<QRSalePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const scannerId = 'plur-qr-reader'
    const scanner = new Html5Qrcode(scannerId)
    scannerRef.current = scanner
    stoppedRef.current = false
    processedRef.current = false

    const stopScanner = (): Promise<void> => {
      if (stoppedRef.current) return Promise.resolve()
      stoppedRef.current = true
      const p = startPromiseRef.current ?? Promise.resolve()
      return p.then(() => scanner.stop()).catch(() => {})
    }

    startPromiseRef.current = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (processedRef.current) return
          try {
            const parsed: unknown = JSON.parse(decodedText)
            if (isValidQRPayload(parsed)) {
              processedRef.current = true
              void stopScanner()
              setScanResult(parsed)
            }
          } catch {
            // ignore invalid JSON frames
          }
        },
        () => {
          // per-frame scan failure — ignore
        },
      )
      .then(() => setStarted(true))
      .catch(() => {
        setError(tRef.current('dashboard.sale.cameraError'))
      })

    return () => {
      void stopScanner()
    }
  }, [])

  if (scanResult !== null) {
    return (
      <SaleConfirmationFlow
        payload={scanResult}
        onClose={() => {
          setScanResult(null)
          onClose()
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-pl-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-pl-gray-700 shrink-0">
        <button
          onClick={onClose}
          aria-label={t('common.back')}
          className="text-pl-gray-400 hover:text-pl-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-[14px] font-semibold text-pl-white font-body">
          {t('dashboard.sale.scanTitle')}
        </p>
      </div>

      {/* Camera area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        {error !== null ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-pl-gray-500" />
            <p className="text-[13px] text-pl-gray-400 font-body">{error}</p>
          </div>
        ) : (
          <>
            {/* Scanner container */}
            <div className="relative w-full max-w-xs">
              <div id="plur-qr-reader" className="w-full overflow-hidden rounded-lg" />
              {/* Frame overlay — only show after camera started */}
              {started && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[250px] h-[250px] border-2 rounded-sm scan-frame" />
                </div>
              )}
            </div>

            <p className="text-[12px] text-pl-gray-400 font-body text-center max-w-[240px] leading-relaxed">
              {t('dashboard.sale.scanInstruction')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
