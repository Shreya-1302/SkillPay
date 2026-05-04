import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp, Star, IndianRupee } from 'lucide-react';
import { getMyOrdersStudent } from '../../api/order.api';
import { getEarningsByMonth } from '../../api/wallet.api';
import { getMyGigs } from '../../api/gig.api';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Navbar from '../../components/Navbar';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const MetricCard = ({ icon: Icon, label, value, sub, color = 'text-primary' }) => (
  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-start gap-4">
    <div className={`p-3 rounded-xl bg-secondary/60 ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  </div>
);

const StudentDashboard = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['studentOrders'],
    queryFn: getMyOrdersStudent,
  });

  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ['earningsByMonth'],
    queryFn: getEarningsByMonth,
    select: (res) => res.data || [],
  });

  const { data: myGigs } = useQuery({
    queryKey: ['myGigs'],
    queryFn: getMyGigs,
    select: (res) => res.data || [],
  });

  // Compute avg rating from gigs that have reviews
  const gigsWithRatings = (myGigs || []).filter(g => g.avgRating > 0);
  const avgRating = gigsWithRatings.length
    ? (gigsWithRatings.reduce((s, g) => s + g.avgRating, 0) / gigsWithRatings.length).toFixed(1)
    : null;
  const totalReviews = (myGigs || []).reduce((s, g) => s + (g.totalReviews || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'payment_pending':
      case 'pending_payment':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Pending Payment</Badge>;
      case 'in_escrow':
      case 'in_progress':
        return <Badge variant="success" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><AlertCircle className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'completed':
        return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      case 'disputed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Disputed</Badge>;
      default:
        return <Badge className="capitalize">{status.replace('_', ' ')}</Badge>;
    }
  };

  const completedOrders = orders?.filter(o => o.status === 'completed') || [];
  const activeOrders = orders?.filter(o => !['completed', 'cancelled', 'pending_payment'].includes(o.status)) || [];
  const totalEarned = earningsData?.reduce((sum, item) => sum + item.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Student Dashboard</h1>
          <p className="text-muted-foreground">Track your earnings, orders, and performance.</p>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <MetricCard
            icon={IndianRupee}
            label="Total Earned"
            value={formatINR(totalEarned)}
            sub={`${completedOrders.length} completed orders`}
            color="text-emerald-500"
          />
          <MetricCard
            icon={TrendingUp}
            label="Active Orders"
            value={activeOrders.length}
            sub="Currently in progress"
            color="text-blue-500"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Total Orders"
            value={orders?.length || 0}
            sub="All time"
            color="text-primary"
          />
          <MetricCard
            icon={Star}
            label="Avg Rating"
            value={avgRating ? `${avgRating} ★` : '—'}
            sub={avgRating ? `From ${totalReviews} reviews` : 'No reviews yet'}
            color="text-yellow-500"
          />
        </div>

        {/* ── Quick Action Buttons ── */}
        <div className="flex flex-wrap gap-4 mb-10">
          <Link 
            to="/student/my-orders" 
            className="flex-1 min-w-[200px] text-center bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            View Active Orders
          </Link>
          <Link 
            to="/student/create-gig" 
            className="flex-1 min-w-[200px] text-center bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold hover:bg-secondary/80 transition-colors shadow-sm"
          >
            Create New Gig
          </Link>
          <Link 
            to="/student/wallet" 
            className="flex-1 min-w-[200px] text-center bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold hover:bg-secondary/80 transition-colors shadow-sm"
          >
            Go to Wallet
          </Link>
        </div>

        {/* ── Earnings Chart ── */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm mb-10">
          <h2 className="text-xl font-bold mb-6">Earnings Overview</h2>
          {earningsLoading ? (
            <div className="flex h-52 items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : earningsData && earningsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={earningsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--secondary)/0.5)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(v) => [`₹${v}`, 'Earnings']}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-52 items-center justify-center text-muted-foreground text-sm">
              No earnings data yet. Complete orders to see your chart.
            </div>
          )}
        </div>

        {/* ── Recent Orders Table ── */}
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-xl font-bold">Recent Orders</h2>
          </div>

          {isLoading ? (
            <div className="p-6"><Skeleton className="h-64 w-full" /></div>
          ) : orders?.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-bold mb-2">No orders yet</h3>
              <p className="text-muted-foreground">When clients hire you, their orders will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 text-sm text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-medium">Gig</th>
                    <th className="p-4 font-medium">Client</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {orders?.map(order => (
                    <tr key={order._id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <Link to={`/orders/${order._id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                          {order.gig?.title || 'Unknown Gig'}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-secondary overflow-hidden">
                            <img
                              src={order.client?.avatar || `https://ui-avatars.com/api/?name=${order.client?.name || 'C'}&background=random`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium">{order.client?.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(order.createdAt)}</td>
                      <td className="p-4 font-bold text-foreground">{formatINR(order.amount)}</td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
