import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider, useWallet } from './context/WalletContext'
import Navbar from './components/Navbar'
import QrModal from './components/QrModal'
import HomePage from './pages/HomePage'
import ClaimPage from './pages/ClaimPage'
import FaqPage from './pages/FaqPage'
import Footer from './sections/Footer'

function PairingOverlay() {
  const { pairingUri, dismissPairingUri } = useWallet()
  return <QrModal uri={pairingUri} onClose={dismissPairingUri} />
}

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Navbar />
        <Routes>
          <Route path="/"      element={<HomePage />} />
          <Route path="/claim" element={<ClaimPage />} />
          <Route path="/faq"   element={<FaqPage />} />
        </Routes>
        <Footer />
        <PairingOverlay />
      </WalletProvider>
    </BrowserRouter>
  )
}
