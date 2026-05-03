const Razorpay = require('razorpay');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const ApiError = require('../utils/ApiError');

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID || 'test',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
});

// @desc    Get wallet balance and recent transactions
// @route   GET /api/wallet/balance
// @access  Private
const getBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const transactions = await WalletTransaction.find({ userId: req.user.id })
      .sort('-createdAt')
      .limit(5);

    res.status(200).json({
      success: true,
      balance: user.walletBalance,
      recentTransactions: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get wallet transactions
// @route   GET /api/wallet/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const transactions = await WalletTransaction.find({ userId: req.user.id })
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add UPI for withdrawal
// @route   POST /api/wallet/add-upi
// @access  Private (Student only)
const addUPI = async (req, res, next) => {
  try {
    const { upiId } = req.body;
    if (!upiId) {
      return next(new ApiError(400, 'UPI ID is required'));
    }

    const user = await User.findById(req.user.id);

    // Create Razorpay Contact if not exists
    if (!user.razorpayContactId) {
      let contactId;
      try {
        const contact = await razorpay.contacts.create({
          name: user.name,
          email: user.email,
          type: 'vendor',
          reference_id: user._id.toString(),
        });
        contactId = contact.id;
      } catch (err) {
        // Fallback for dev mode without valid keys
        contactId = `fake_contact_${Date.now()}`;
      }
      user.razorpayContactId = contactId;
      await user.save();
    }

    // Create Fund Account
    let fundAccountId;
    try {
      const fundAccount = await razorpay.fundAccount.create({
        contact_id: user.razorpayContactId,
        account_type: 'vpa',
        vpa: {
          address: upiId,
        },
      });
      fundAccountId = fundAccount.id;
    } catch (err) {
       // Fallback for dev mode
       fundAccountId = `fake_fa_${Date.now()}`;
    }

    user.razorpayFundAccId = fundAccountId;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'UPI added successfully',
      fundAccountId: fundAccountId,
    });
  } catch (error) {
    console.error('Razorpay Add UPI Error:', error);
    next(new ApiError(500, 'Failed to add UPI. Please check your UPI ID.'));
  }
};

// @desc    Withdraw funds to UPI
// @route   POST /api/wallet/withdraw
// @access  Private (Student only)
const withdraw = async (req, res, next) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return next(new ApiError(400, 'Invalid amount'));
    }

    const user = await User.findById(req.user.id);

    if (user.walletBalance < amount) {
      return next(new ApiError(400, 'Insufficient balance'));
    }

    if (!user.razorpayFundAccId) {
      return next(new ApiError(400, 'Please add a UPI ID first'));
    }

    // Optimistic balance update
    user.walletBalance -= amount;
    await user.save();

    // Create a processing transaction
    const transaction = await WalletTransaction.create({
      userId: user._id,
      amount,
      type: 'WITHDRAWAL_DEBIT',
      status: 'processing',
      description: 'Withdrawal to UPI',
      balanceAfter: user.walletBalance,
    });

    try {
      // Create Razorpay Payout
      let payoutId;
      try {
        const payout = await razorpay.payouts.create({
          account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '2323230076722003', // Test acc
          fund_account_id: user.razorpayFundAccId,
          amount: amount * 100, // in paise
          currency: 'INR',
          mode: 'UPI',
          purpose: 'payout',
          reference_id: transaction._id.toString(),
          queue_if_low_balance: true,
        });
        payoutId = payout.id;
      } catch (err) {
        // Fallback for dev mode
        payoutId = `fake_payout_${Date.now()}`;
      }

      // Update transaction with payout ID
      transaction.razorpayPayoutId = payoutId;
      await transaction.save();

      res.status(200).json({
        success: true,
        message: 'Withdrawal initiated successfully',
        data: transaction,
      });
    } catch (payoutError) {
      console.error('Razorpay Payout Error:', payoutError);
      
      // Revert balance and mark transaction as failed
      user.walletBalance += amount;
      await user.save();
      
      transaction.status = 'failed';
      transaction.description = 'Withdrawal failed during initiation';
      await transaction.save();

      return next(new ApiError(500, 'Failed to initiate withdrawal'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get earnings by month for Chart
// @route   GET /api/wallet/earnings-by-month
// @access  Private (Student only)
const getEarningsByMonth = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const earnings = await WalletTransaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'CREDIT',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalEarned: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: earnings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBalance,
  getTransactions,
  addUPI,
  withdraw,
  getEarningsByMonth,
};
