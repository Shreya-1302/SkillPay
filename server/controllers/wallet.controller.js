const WalletTransaction = require('../models/WalletTransaction');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

// @desc    Get monthly earnings for logged-in user
// @route   GET /api/wallet/earnings-by-month
// @access  Private (student typically)
const getEarningsByMonth = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // We only aggregate MILESTONE_CREDIT transactions to determine earnings
    const earnings = await WalletTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'MILESTONE_CREDIT',
          status: 'completed',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalEarnings: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Format output for Recharts: { month: "Jan", amount: 500 }
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const formattedData = earnings.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      amount: item.totalEarnings,
    }));

    // If no earnings, provide an empty skeleton or base case so the chart renders properly
    if (formattedData.length === 0) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      formattedData.push({
        month: `${monthNames[currentMonth]} ${currentYear}`,
        amount: 0,
      });
    }

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEarningsByMonth,
};
