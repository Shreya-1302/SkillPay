import { useState, useCallback } from 'react';

export const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  const loadScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        setIsLoaded(true);
        resolve(true);
        return;
      }
      
      if (document.getElementById('razorpay-checkout-js')) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        setIsLoaded(true);
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }, []);

  const openCheckout = useCallback(async (options) => {
    const res = await loadScript();
    if (!res) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.failed', function (response) {
      console.error('Payment failed', response.error);
      if (options.onPaymentError) {
        options.onPaymentError(response.error);
      } else {
        alert(response.error.description);
      }
    });

    rzp.open();
  }, [loadScript]);

  return { isLoaded, openCheckout };
};

export default useRazorpay;
