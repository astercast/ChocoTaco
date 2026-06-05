import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider, useWallet } from './context/WalletContext'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import QrModal, { type ConnectPhase } from './components/QrModal'
import HomePage from './pages/HomePage'
import ClaimPage from './pages/ClaimPage'
import FaqPage from './pages/FaqPage'
import DistributionPage from './pages/DistributionPage'
import Footer from './sections/Footer'

function PairingOverlay() {
  const {
    pairingUri, verifying, connected, connectSuccess, freshConnect,
    address, error, dismissConnectModal,
  } = useWallet()

  let phase: ConnectPhase | null = null
  if (connectSuccess && connected) phase = 'success'
  else if (verifying && !connected) phase = 'syncing'
  else if (pairingUri) phase = 'qr'
  else if (freshConnect && !connected) phase = error ? 'error' : 'init'

  if (!phase) return null

  return (
    <QrModal
      phase={phase}
      uri={pairingUri}
      address={address}
      error={error}
      onClose={dismissConnectModal}
      canClose={phase !== 'syncing'}
    />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <ScrollToTop />
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
