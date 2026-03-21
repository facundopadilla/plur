import '@/features/landing/landing.css'
import { GrainOverlay } from '@/features/landing'
import {
  EarlyAccessNavbar,
  EarlyAccessHero,
  HowItWorks,
  PremiumOffer,
  SignupForm,
  EarlyAccessFooter,
} from '@/features/early-access'

export function Component() {
  return (
    <>
      <GrainOverlay />
      <EarlyAccessNavbar />
      <main>
        <EarlyAccessHero />
        <HowItWorks />
        <PremiumOffer />
        <SignupForm />
      </main>
      <EarlyAccessFooter />
    </>
  )
}
