import ChocolateDrip from '../components/ChocolateDrip'
import Marquee from '../components/Marquee'
import Hero from '../sections/Hero'
import Stats from '../sections/Stats'
import HowItWorks from '../sections/HowItWorks'
import EarnDashboard from '../sections/EarnDashboard'
import OgMint from '../sections/WeeklyMint'
import Gallery from '../sections/Gallery'

const MARQUEE_ITEMS = [
  '500 OG BADGES · 0.5 XCH EACH',
  '50 RANDOM GOLDEN TICKETS · COOK YOUR OWN',
  '100% OF MINT → TIBETSWAP LP',
  '$🍫🌮 PAYDAY EVERY WEDNESDAY 17:00 UTC',
  'COME CLAIM WITHIN 3 DAYS FOR FULL',
  'LP MULTIPLIER HAS NO CEILING',
  'BUILT ON CHIA · NO BRIDGES · NO BS',
]

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ChocolateDrip flip opacity={0.85} />
      <Marquee items={MARQUEE_ITEMS} variant="gold" />
      <Stats />
      <ChocolateDrip opacity={0.85} />
      <HowItWorks />
      <ChocolateDrip flip opacity={0.85} />
      <EarnDashboard />
      <ChocolateDrip opacity={0.85} />
      <OgMint />
      <ChocolateDrip flip opacity={0.85} />
      <Gallery />
    </main>
  )
}
