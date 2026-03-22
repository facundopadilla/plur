import { FileCode, Link, Shield, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { RevealOnScroll } from './RevealOnScroll'

function AvalancheLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 1503 1504" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="1502" height="1503" rx="256" fill="#E84142" />
      <path
        d="M1087.59 865.763C1107.35 831.518 1138.55 831.518 1158.31 865.763L1317.99 1147.76C1337.75 1181.99 1322.15 1209.84 1282.64 1209.84H960.359C921.219 1209.84 905.619 1181.99 925.009 1147.76L1087.59 865.763Z"
        fill="white"
      />
      <path
        d="M758.729 284.656C778.489 250.406 809.329 250.406 829.089 284.656L879.389 373.116L943.889 489.906C959.389 522.406 959.389 560.966 943.889 593.466L658.269 1093.68C638.509 1124.52 609.939 1143.92 577.789 1147.76H328.359C288.849 1147.76 273.249 1120.28 293.009 1086.03L758.729 284.656Z"
        fill="white"
      />
    </svg>
  )
}

interface StatProps {
  value: string
  label: string
  icon: React.ReactNode
}

function StatCard({ value, label, icon }: StatProps) {
  return (
    <div className="bg-pl-gray-700 border border-pl-gray-600 rounded-xl px-8 py-5 text-center flex flex-col items-center gap-2">
      <div className="text-pl-accent">{icon}</div>
      <div className="font-display text-[28px] font-extrabold text-pl-accent">{value}</div>
      <div className="text-[11px] text-pl-gray-400 uppercase tracking-[0.08em] font-body">{label}</div>
    </div>
  )
}

interface IconBoxProps {
  label: string
  children: React.ReactNode
  bg?: string
}

function IconBox({ label, children, bg = 'bg-pl-gray-700 border border-pl-gray-600' }: IconBoxProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg}`}>
        {children}
      </div>
      <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-pl-gray-300 font-body text-center">
        {label}
      </span>
    </div>
  )
}

export function BlockchainSection() {
  const { t } = useTranslation()

  return (
    <section className="bg-pl-black text-pl-white px-[clamp(24px,5vw,80px)] py-[clamp(80px,10vw,140px)] overflow-hidden">
      <div className="max-w-[900px] mx-auto">
        <RevealOnScroll>
          <div className="text-center">
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-pl-gray-400 mb-4 font-body">
              {t('landing.blockchain.eyebrow')}
            </p>
            <h2 className="font-display text-[clamp(1.6rem,5vw,5rem)] font-extrabold tracking-[-0.05em] leading-[0.95] uppercase text-pl-white max-w-[700px] mx-auto mb-6 break-words">
              {t('landing.blockchain.titleLine1')}
              <br />
              <span className="text-pl-accent">{t('landing.blockchain.titleLine2')}</span>
              <span className="text-pl-accent">.</span>
            </h2>
            <p className="text-[clamp(14px,1.1vw,17px)] font-light leading-[1.7] text-pl-white/60 max-w-[560px] mx-auto mb-14 font-body">
              {t('landing.blockchain.description')}
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={1}>
          <div className="flex items-center justify-center gap-10 sm:gap-14 flex-wrap mb-14">
            <IconBox label="Avalanche" bg="">
              <AvalancheLogo />
            </IconBox>
            <IconBox label="C-Chain">
              <Link className="w-6 h-6 text-pl-white" />
            </IconBox>
            <IconBox label="Smart Contracts">
              <FileCode className="w-6 h-6 text-pl-white" />
            </IconBox>
            <IconBox label="Token ERC-20" bg="bg-pl-accent">
              <span className="font-display text-lg font-extrabold text-pl-black">PLR</span>
            </IconBox>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={2}>
          <div className="flex justify-center gap-4 sm:gap-6 flex-wrap mb-16">
            <StatCard
              value={t('landing.blockchain.statSpeedValue')}
              label={t('landing.blockchain.statSpeed')}
              icon={<Zap className="w-5 h-5" />}
            />
            <StatCard
              value="0.5%"
              label={t('landing.blockchain.statFee')}
              icon={<Shield className="w-5 h-5" />}
            />
            <StatCard
              value="100%"
              label={t('landing.blockchain.statOnChain')}
              icon={<Link className="w-5 h-5" />}
            />
          </div>
        </RevealOnScroll>

        {/* Hackathon & Sponsor */}
        <RevealOnScroll delay={3}>
          <div className="text-center border-t border-pl-gray-700 pt-12">
            <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
              <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-500 font-body">
                  {t('landing.blockchain.builtDuring')}
                </p>
                <p className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-[-0.02em] text-pl-white">
                  Aleph Hackathon
                </p>
              </div>
              <div className="w-px h-10 bg-pl-gray-700 hidden sm:block" />
              <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-pl-gray-500 font-body">
                  {t('landing.blockchain.sponsoredBy')}
                </p>
                <p className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-[-0.02em] text-pl-accent">
                  Crecimiento
                </p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
