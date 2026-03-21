import { useTranslation } from 'react-i18next'
import { RevealOnScroll } from './RevealOnScroll'
import { TestimonialCard } from './TestimonialCard'
import { TESTIMONIALS } from '../data/testimonials'

export function Testimonials() {
  const { t } = useTranslation()

  return (
    <section className="bg-pl-white text-pl-black px-[clamp(24px,5vw,80px)] py-[clamp(80px,10vw,160px)]">
      <RevealOnScroll>
        <div className="text-center mb-16">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-pl-gray-400 mb-4 font-body">
            {t('landing.testimonials.eyebrow')}
          </p>
          <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] font-extrabold tracking-[-0.05em] leading-[0.95] uppercase text-pl-black max-w-[600px] mx-auto">
            {t('landing.testimonials.title')}
            <span className="text-pl-accent-dim">.</span>
          </h2>
        </div>
      </RevealOnScroll>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0.5">
        {TESTIMONIALS.map((testimonial, i) => (
          <RevealOnScroll key={testimonial.authorName} delay={((i + 1) as 1 | 2 | 3)}>
            <TestimonialCard testimonial={testimonial} />
          </RevealOnScroll>
        ))}
      </div>
    </section>
  )
}
