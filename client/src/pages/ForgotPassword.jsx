import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/auth.api';
import toast from 'react-hot-toast';
import { Mail, Lock, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await resetPassword(otp, newPassword);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 justify-center">
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-foreground">
          {step === 1 ? 'Forgot Password' : 'Reset Password'}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {step === 1
            ? "Enter your email and we'll send you a reset OTP."
            : `OTP sent to ${email}. Enter it below to set a new password.`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">

          {/* ── Step 1: Enter email ── */}
          {step === 1 && (
            <form className="space-y-6" onSubmit={handleSendOTP}>
              <div>
                <label className="block text-sm font-medium text-foreground">Email address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 border border-input rounded-md bg-background text-foreground h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send OTP'}
              </button>
            </form>
          )}

          {/* ── Step 2: Enter OTP + new password ── */}
          {step === 2 && (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-sm font-medium text-foreground">OTP Code</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="block w-full pl-10 border border-input rounded-md bg-background text-foreground h-10 px-3 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">New Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 border border-input rounded-md bg-background text-foreground h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Confirm New Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 border border-input rounded-md bg-background text-foreground h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium border border-border text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex justify-center py-2.5 px-4 rounded-md text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Reset Password'}
                </button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Didn't receive OTP?{' '}
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-primary hover:underline font-medium"
                >
                  Resend
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
