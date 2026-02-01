import { useCallback } from 'react'
import { X } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export default function CheckoutModal({ clientSecret, onClose, onComplete }) {
  const options = { clientSecret }

  const handleComplete = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            Complete Your Trial Setup
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Embedded Checkout */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
            <EmbeddedCheckout onComplete={handleComplete} />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  )
}
