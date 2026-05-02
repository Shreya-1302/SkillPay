import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createOrder, verifyPayment } from '../api/order.api';
import { useRazorpay } from '../hooks/useRazorpay';
import { formatINR } from '../utils/formatCurrency';
import Spinner from './ui/Spinner';
import { AlertCircle } from 'lucide-react';

const RazorpayCheckout = ({ gigId, gigTitle, amount, requirements, onSuccess }) => {
  const { openCheckout } = useRazorpay();
  const [error, setError] = useState('');

  const verifyMutation = useMutation({
    mutationFn: verifyPayment,
    onSuccess: (data) => {
      onSuccess(data.order._id);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Payment verification failed');
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: (reqData) => createOrder(reqData.gigId, reqData.requirements),
    onSuccess: (data) => {
      const { razorpayOrderId, amount: orderAmount, currency } = data;
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderAmount, 
        currency: currency,
        name: 'SkillPay',
        description: `Payment for ${gigTitle}`,
        order_id: razorpayOrderId,
        handler: function (response) {
          verifyMutation.mutate({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        theme: {
          color: '#3b82f6'
        },
        onPaymentError: (err) => {
          setError(err.description || 'Payment failed');
        }
      };

      if (!options.key || options.key === 'rzp_test_placeholder_key') {
        // Mock payment flow for dev
        setTimeout(() => {
          options.handler({
            razorpay_order_id: options.order_id,
            razorpay_payment_id: `mock_payment_${Date.now()}`,
            razorpay_signature: 'mock_signature'
          });
        }, 1500);
      } else {
        openCheckout(options);
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to create order');
    }
  });

  const handlePayment = () => {
    setError('');
    createOrderMutation.mutate({ gigId, requirements });
  };

  const isLoading = createOrderMutation.isPending || verifyMutation.isPending;

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive flex items-start gap-2 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <button
        onClick={handlePayment}
        disabled={isLoading || !requirements.trim()}
        className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground py-3 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Spinner size={20} color="text-primary-foreground" />
            <span>Processing...</span>
          </>
        ) : (
          <span>Pay {formatINR(amount)}</span>
        )}
      </button>
    </div>
  );
};

export default RazorpayCheckout;
