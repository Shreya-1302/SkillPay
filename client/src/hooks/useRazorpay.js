import { useCallback } from 'react';

const useRazorpay = () => {
  const loadScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }, []);

  const openCheckout = useCallback(async (options) => {
    const isLoaded = await loadScript();
    if (!isLoaded) {
      alert('Failed to load Razorpay SDK. Please check your connection.');
      return;
    }
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      console.error(response.error);
    });
    rzp.open();
  }, [loadScript]);

  return { openCheckout };
};

export default useRazorpay;
