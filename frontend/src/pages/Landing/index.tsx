import '@/features/landing/landing.css'
import {
  Preloader,
  GrainOverlay,
  Navbar,
  Hero,
  MarqueeStrip,
  SwipeMatch,
  AIFittingRoom,
  TokenEconomy,
  Gallery,
  Testimonials,
  CTASection,
  Footer,
} from '@/features/landing'

export function Component() {
  return (
    <>
      <Preloader />
      <GrainOverlay />
      <Navbar />
      <main>
        <Hero />
        <MarqueeStrip />
        <SwipeMatch />
        <AIFittingRoom />
        <TokenEconomy />
        <Gallery />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
