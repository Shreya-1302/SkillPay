import React, { useState } from 'react';
import { createOrder, verifyPayment } from '../api/order.api';
import useRazorpay from '../hooks/useRazorpay';
import { formatINR } from '../utils/formatCurrency';
import { CreditCard, Loader2 } from 'lucide-react';

const RazorpayCheckout = ({ gigId, gigTitle, amount, requirements, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { openCheckout } = useRazorpay();

  const handlePayment = async () => {
    if (!requirements || requirements.trim() === '') {
      setError('Please provide your project requirements.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // 1. Create order on the backend
      const orderData = await createOrder(gigId, requirements);
      
      // 2. Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // You'll need to add this to .env
        amount: orderData.amount, // amount in paise from backend
        currency: orderData.currency,
        name: 'Vibe Platform',
        description: `Payment for ${gigTitle}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response) {
          try {
            // 3. Verify payment on the backend
            const verificationData = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            
            if (verificationData.success) {
              onSuccess(verificationData.orderId);
            } else {
              setError('Payment verification failed.');
            }
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#6366f1' // Primary color
        }
      };

      // 4. Open Razorpay modal
      openCheckout(options);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-6 border-t border-border/50 pt-4">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}
      <div className="flex justify-between items-center py-2 text-sm">
        <span className="text-muted-foreground">Total to pay:</span>
        <span className="text-xl font-bold text-foreground">{formatINR(amount)}</span>
      </div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground py-3 px-4 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Pay & Hire
          </>
        )}
      </button>
    </div>
  );
};

export default RazorpayCheckout;
