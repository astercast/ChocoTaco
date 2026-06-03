import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'loading'

interface Props {
  message: string | null
  variant: ToastVariant
  onDismiss?: () => void
}

export default function Toast({ message, variant, onDismiss }: Props) {
  const icon = {
    success: <CheckCircle2 size={18} className="text-mint" />,
    error:   <AlertCircle  size={18} className="text-chili" />,
    loading: <Loader2      size={18} className="text-gold animate-spin" />,
  }[variant]

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90]
                     bg-cream-50 text-cocoa-900 px-5 py-3 rounded-full
                     shadow-2xl flex items-center gap-3 max-w-sm"
          onClick={onDismiss}
          role="status"
        >
          {icon}
          <span className="font-serif text-sm">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
