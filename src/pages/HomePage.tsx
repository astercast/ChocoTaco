import ChocolateDrip from '../components/ChocolateDrip'
import Hero from '../sections/Hero'
import Stats from '../sections/Stats'
import EarnDashboard from '../sections/EarnDashboard'
import OgMint from '../sections/WeeklyMint'
import Gallery from '../sections/Gallery'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ChocolateDrip flip opacity={0.85} />
      <Stats />
      <ChocolateDrip opacity={0.85} />
      <EarnDashboard />
      <ChocolateDrip flip opacity={0.85} />
      <OgMint />
      <ChocolateDrip opacity={0.85} />
      <Gallery />
    </main>
  )
}
