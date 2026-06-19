import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyEmail, resendOtp } from '../api/auth.api';
import toast from 'react-hot-toast';
import { KeyRound, Loader2, Mail, RefreshCw } from 'lucide-react';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(otp);
      toast.success('Email verified! You can now sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. OTP may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address first');
      return;
    }
    setResending(true);
    try {
      const data = await resendOtp(email.trim());
      toast.success(data.message || 'A new OTP has been sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Verify your email
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          We've sent a 6-digit OTP to your email address.
          <br />
          <span className="text-yellow-500 font-medium">Check your spam / junk folder</span> if it doesn't arrive within a minute.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border space-y-6">

          {/* OTP entry form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-foreground text-center mb-2">
                Enter OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                className="focus:ring-primary focus:border-primary block w-full sm:text-2xl text-center border-input rounded-md bg-background text-foreground h-14 border tracking-widest font-mono"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 className="animate-spin h-5 w-5" /><span>Verifying…</span></> : 'Verify Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Didn't receive it?</span></div>
          </div>

          {/* Resend OTP */}
          <div className="space-y-3">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-9 sm:text-sm border-input rounded-md bg-background text-foreground h-10 border px-3 focus:ring-primary focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted focus:outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {resending
                ? <><Loader2 className="animate-spin h-4 w-4" /><span>Sending…</span></>
                : <><RefreshCw className="h-4 w-4" /><span>Resend OTP</span></>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
