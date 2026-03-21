import { useTranslation } from 'react-i18next'
import { SectionWrapper } from './SectionWrapper'
import { RevealOnScroll } from './RevealOnScroll'
import { GalleryItem } from './GalleryItem'
import { GALLERY_ITEMS } from '../data/gallery-items'

export function Gallery() {
  const { t } = useTranslation()

  return (
    <SectionWrapper id="collection" theme="dark" counter={t('landing.gallery.counter')}>
      <RevealOnScroll>
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-pl-accent mb-4 font-body">
          {t('landing.gallery.eyebrow')}
        </p>
        <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] font-extrabold tracking-[-0.05em] leading-[0.95] uppercase text-pl-white mb-6">
          {t('landing.gallery.titleLine1')}
          <br />
          {t('landing.gallery.titleLine2')}
          <span className="text-pl-accent">.</span>
        </h2>
        <p className="text-[clamp(14px,1.1vw,17px)] font-light leading-[1.7] text-pl-white/60 max-w-[560px] font-body">
          {t('landing.gallery.description')}
        </p>
      </RevealOnScroll>

      {/* Gallery grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 mt-16">
        {GALLERY_ITEMS.map((item) => (
          <GalleryItem key={item.name} item={item} />
        ))}
      </div>
    </SectionWrapper>
  )
}
