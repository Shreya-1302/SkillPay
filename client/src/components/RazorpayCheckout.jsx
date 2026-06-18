import React, { useState } from 'react';
import { createOrder, verifyPayment } from '../api/order.api';
import useRazorpay from '../hooks/useRazorpay';
import { formatINR } from '../utils/formatCurrency';
import { CreditCard, Loader2, FlaskConical, CheckCircle2 } from 'lucide-react';

const isDev = import.meta.env.DEV;

const RazorpayCheckout = ({ gigId, gigTitle, amount, requirements, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devConfirm, setDevConfirm] = useState(false); // show dev payment confirm screen
  const [pendingOrderData, setPendingOrderData] = useState(null);
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

      // 2. Dev bypass: if Razorpay credentials are not configured the backend
      //    returns a fake_rzp_* order ID — skip the payment modal in that case.
      if (orderData.razorpayOrderId?.startsWith('fake_rzp_')) {
        setPendingOrderData(orderData);
        setDevConfirm(true);
        setLoading(false);
        return;
      }

      // 3. Real Razorpay flow
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SkillPay',
        description: `Payment for ${gigTitle}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response) {
          try {
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
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#6366f1' },
      };

      openCheckout(options);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  // ── Dev simulate-payment confirmation screen ───────────────────────────────
  const handleDevConfirm = async () => {
    setLoading(true);
    try {
      const verificationData = await verifyPayment({
        razorpayOrderId: pendingOrderData.razorpayOrderId,
        razorpayPaymentId: `fake_pay_${Date.now()}`,
        razorpaySignature: `fake_sig_${Date.now()}`,
      });
      if (verificationData.success) {
        onSuccess(verificationData.orderId);
      } else {
        setError('Payment simulation failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Simulation error');
    } finally {
      setLoading(false);
    }
  };

  // ── Dev confirm screen ─────────────────────────────────────────────────────
  if (devConfirm && pendingOrderData) {
    return (
      <div className="space-y-4 mt-6 border-t border-border/50 pt-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-semibold text-sm">
            <FlaskConical className="h-4 w-4" />
            Dev Mode — Simulated Payment
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Razorpay credentials are not configured for live payments. Click below to simulate a successful payment and move the order to escrow.
          </p>
          <div className="flex justify-between text-sm px-2">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold text-foreground">{formatINR(amount)}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}

        <button
          onClick={handleDevConfirm}
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-amber-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Confirm Simulated Payment
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Normal pay button ──────────────────────────────────────────────────────
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
            Pay &amp; Hire
          </>
        )}
      </button>
    </div>
  );
};

export default RazorpayCheckout;
