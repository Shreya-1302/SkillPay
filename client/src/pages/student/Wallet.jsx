import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getBalance, addUPI, withdraw } from '../../api/wallet.api';
import toast from 'react-hot-toast';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';

const Wallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [upiId, setUpiId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingUpi, setSavingUpi] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const data = await getBalance();
      if (data.success) {
        setBalance(data.balance);
        setTransactions(data.recentTransactions);
      }
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpi = async (e) => {
    e.preventDefault();
    if (!upiId) return toast.error('Please enter a UPI ID');
    
    setSavingUpi(true);
    try {
      const data = await addUPI(upiId);
      if (data.success) {
        toast.success('UPI ID saved successfully');
        // Realistically we'd fetch user profile again or update context
        // but for now we just show success
        setUpiId('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add UPI');
    } finally {
      setSavingUpi(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    
    if (!amount || amount <= 0) return toast.error('Please enter a valid amount');
    if (amount > balance) return toast.error('Insufficient balance');

    setWithdrawing(true);
    try {
      const data = await withdraw(amount);
      if (data.success) {
        toast.success('Withdrawal initiated! It will be processed shortly.');
        setIsModalOpen(false);
        setWithdrawAmount('');
        fetchWalletData(); // Refresh balance and transactions
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getTypeIcon = (type) => {
    return type.includes('DEBIT') ? (
      <ArrowUpRight className="h-4 w-4 text-red-500" />
    ) : (
      <ArrowDownLeft className="h-4 w-4 text-green-500" />
    );
  };

  if (loading) {
    return <div className="p-8 text-center">Loading wallet data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">My Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Balance Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-center items-center">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <WalletIcon className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-1">Available Balance</p>
          <h2 className="text-4xl font-bold">₹{balance.toLocaleString()}</h2>
        </div>

        {/* Withdrawal Section */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Withdraw Funds</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Transfer your earnings directly to your bank account via UPI.
              </p>
              
              <form onSubmit={handleAddUpi} className="space-y-3 mb-6">
                <div>
                  <label className="text-sm font-medium">Add/Update UPI ID</label>
                  <div className="flex mt-1">
                    <input 
                      type="text" 
                      placeholder="e.g., name@okhdfcbank" 
                      className="flex-1 rounded-l-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      disabled={savingUpi || !upiId}
                      className="bg-secondary text-secondary-foreground px-4 py-2 rounded-r-md hover:bg-secondary/80 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      {savingUpi ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8 flex flex-col justify-center">
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={balance <= 0}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard className="h-5 w-5" /> Withdraw Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-semibold">Recent Transactions</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${tx.type.includes('DEBIT') ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                          {getTypeIcon(tx.type)}
                        </div>
                        <span className="font-medium text-xs bg-muted px-2 py-1 rounded-full">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${tx.type.includes('DEBIT') ? 'text-red-500' : 'text-green-500'}`}>
                        {tx.type.includes('DEBIT') ? '-' : '+'}₹{tx.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(tx.status)}
                        <span className="capitalize">{tx.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                      {tx.description || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Withdrawal</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the amount you wish to withdraw to your registered UPI ID.
            </p>
            
            <form onSubmit={handleWithdraw}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                <input 
                  type="number" 
                  min="1"
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-medium"
                  placeholder="0.00"
                  autoFocus
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Min: ₹1</span>
                  <span>Max: ₹{balance.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={withdrawing || !withdrawAmount || withdrawAmount > balance}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {withdrawing ? 'Processing...' : 'Confirm Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
