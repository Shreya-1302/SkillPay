import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, IndianRupee, AlertTriangle, TrendingUp } from 'lucide-react';
import { getPlatformStats, getOrdersByMonth, getDisputedOrders } from '../../api/admin.api';
import { formatINR } from '../../utils/formatCurrency';
import Navbar from '../../components/Navbar';
import Skeleton from '../../components/ui/Skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-start gap-4"
  >
    <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
      <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getPlatformStats,
  });

  const { data: disputes, isLoading: disputesLoading } = useQuery({
    queryKey: ['adminDisputes'],
    queryFn: getDisputedOrders,
  });

  const { data: monthlyOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['adminOrdersByMonth'],
    queryFn: getOrdersByMonth,
  });

  const isLoading = statsLoading || disputesLoading || ordersLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and key metrics.</p>
        </div>

        {isLoading ? (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <>
            {/* ── Metric Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              <StatCard
                icon={IndianRupee}
                label="Total Revenue"
                value={formatINR(stats?.totalRevenue || 0)}
                color="bg-emerald-500"
                delay={0}
              />
              <StatCard
                icon={ShoppingBag}
                label="Total Orders"
                value={stats?.totalOrders ?? '—'}
                color="bg-blue-500"
                delay={0.05}
              />
              <StatCard
                icon={Users}
                label="Total Users"
                value={stats?.totalUsers ?? '—'}
                color="bg-violet-500"
                delay={0.1}
              />
              <StatCard
                icon={AlertTriangle}
                label="Open Disputes"
                value={disputes?.length ?? '—'}
                color="bg-amber-500"
                delay={0.15}
              />
            </div>

            {/* ── Orders Per Month Bar Chart ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Orders Per Month</h2>
              </div>

              {monthlyOrders && monthlyOrders.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyOrders} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--secondary)/0.5)' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                      formatter={(v) => [v, 'Orders']}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">
                  No order data available yet.
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
