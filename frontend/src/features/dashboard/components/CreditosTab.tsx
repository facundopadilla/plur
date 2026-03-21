import { ArrowUpRight, ArrowDownLeft, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDashboardStore } from '@/stores/dashboard.store'
import type { CreditTransaction } from '../types'
import { CURRENCIES } from '../data/currencies'
import { cn } from '@/lib/utils'

function TransactionIcon({ type }: { type: CreditTransaction['type'] }) {
  if (type === 'earned')
    return <ArrowUpRight className="w-4 h-4 text-pl-green shrink-0" />
  if (type === 'spent')
    return <ArrowDownLeft className="w-4 h-4 text-pl-red shrink-0" />
  return <ShoppingCart className="w-4 h-4 text-pl-accent shrink-0" />
}

export function CreditosTab() {
  const { t } = useTranslation()
  const credits = useDashboardStore((s) => s.credits)
  const transactions = useDashboardStore((s) => s.transactions)
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
          <span className="font-display text-4xl font-extrabold text-pl-white tracking-[-0.04em]">
            {credits}
          </span>
          <span className="text-[13px] text-pl-accent font-body font-semibold tracking-[0.08em]">PLR</span>
        </div>
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
      <div className="flex-1 min-h-0">
        <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-400 font-body px-4 pt-3 pb-2">
          {t('dashboard.creditos.history')}
        </p>
        <ScrollArea className="h-full">
          {transactions.length === 0 ? (
            <p className="text-[12px] text-pl-gray-500 font-body px-4 py-8 text-center">
              {t('dashboard.creditos.emptyHistory')}
            </p>
          ) : (
            <div className="px-3 pb-4 space-y-1">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-pl-gray-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-pl-gray-700 flex items-center justify-center shrink-0">
                    <TransactionIcon type={tx.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-pl-white font-body truncate leading-tight">
                      {tx.description}
                    </p>
                    <p className="text-[10px] text-pl-gray-500 font-body mt-0.5">{tx.date}</p>
                  </div>
                  <span
                    className={cn(
                      'text-[13px] font-semibold font-body shrink-0',
                      tx.amount > 0 ? 'text-pl-green' : 'text-pl-red',
                    )}
                  >
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
