import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider, useWallet } from './context/WalletContext'
import Navbar from './components/Navbar'
import QrModal from './components/QrModal'
import HomePage from './pages/HomePage'
import ClaimPage from './pages/ClaimPage'
import FaqPage from './pages/FaqPage'
import DistributionPage from './pages/DistributionPage'
import Footer from './sections/Footer'

function PairingOverlay() {
  const { pairingUri, verifying, connected, dismissPairingUri } = useWallet()
  const busy = verifying && !connected
  return <QrModal uri={pairingUri} busy={busy} onClose={dismissPairingUri} />
}

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Navbar />
        <Routes>
          <Route path="/"      element={<HomePage />} />
          <Route path="/claim" element={<ClaimPage />} />
          <Route path="/faq"           element={<FaqPage />} />
          <Route path="/distribution"  element={<DistributionPage />} />
        </Routes>
        <Footer />
        <PairingOverlay />
      </WalletProvider>
    </BrowserRouter>
  )
}
