import { WalletProvider, useWallet } from './context/WalletContext'
import Navbar from './components/Navbar'
import ChocolateDrip from './components/ChocolateDrip'
import Marquee from './components/Marquee'
import QrModal from './components/QrModal'
import Hero from './sections/Hero'
import Stats from './sections/Stats'
import HowItWorks from './sections/HowItWorks'
import EarnDashboard from './sections/EarnDashboard'
import OgMint from './sections/WeeklyMint'
import Generator from './sections/Generator'
import Gallery from './sections/Gallery'
import Footer from './sections/Footer'

const MARQUEE_ITEMS = [
  '500 OG BADGES · 0.5 XCH EACH',
  '50 PRE-MINTED GOLDEN TICKETS',
  '100% OF MINT → TIBETSWAP LP',
  'PAYDAY EVERY WEDNESDAY 17:00 UTC',
  'COME CLAIM WITHIN 3 DAYS FOR FULL',
  'LP MULTIPLIER HAS NO CEILING',
  'BUILT ON CHIA · NO BRIDGES · NO BS',
]

const MARQUEE_ALT = [
  'STILL MELTING',
  'STILL MINTING',
  'STILL EATING',
  'CLOCK IN WEDNESDAY',
  'FACTORY OPEN 24/7',
]

function PairingOverlay() {
  const { pairingUri, dismissPairingUri } = useWallet()
  return <QrModal uri={pairingUri} onClose={dismissPairingUri} />
}

export default function App() {
  return (
    <WalletProvider>
      <Navbar />
      <main>
        <Hero />
        <ChocolateDrip flip opacity={0.85} />
        <Marquee items={MARQUEE_ITEMS} variant="gold" />
        <Stats />
        <ChocolateDrip opacity={0.85} />
        <HowItWorks />
        <ChocolateDrip flip opacity={0.85} />
        <EarnDashboard />
        <Marquee items={MARQUEE_ALT} variant="cream" />
        <OgMint />
        <ChocolateDrip opacity={0.85} />
        <Generator />
        <ChocolateDrip flip opacity={0.85} />
        <Gallery />
      </main>
      <Footer />
      <PairingOverlay />
    </WalletProvider>
  )
}
