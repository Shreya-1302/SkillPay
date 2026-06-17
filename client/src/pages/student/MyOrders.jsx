import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle2, XCircle, AlertCircle, ShieldCheck,
  PackageCheck, Wallet, ArrowRight, RefreshCcw, ArrowLeft,
} from 'lucide-react';
import { getMyOrdersStudent } from '../../api/order.api';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  payment_pending:  { label: 'Awaiting Payment',  variant: 'warning',     icon: Clock },
  in_escrow:        { label: 'Payment Held',       variant: 'outline',     icon: ShieldCheck },
  in_progress:      { label: 'In Progress',        variant: 'secondary',   icon: AlertCircle },
  delivered:        { label: 'Delivered',          variant: 'outline',     icon: PackageCheck },
  completed:        { label: 'Completed',          variant: 'success',     icon: CheckCircle2 },
  cancelled:        { label: 'Cancelled',          variant: 'destructive', icon: XCircle },
  disputed:         { label: 'Disputed',           variant: 'destructive', icon: AlertCircle },
};

const OrderStatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, variant: 'secondary', icon: Clock };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1.5">
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, valueClass = '', iconBg = 'bg-primary/15 text-primary' }) => (
  <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4">
    <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['studentOrders'],
    queryFn: getMyOrdersStudent,
  });

  const activeOrders = orders?.filter(o =>
    ['in_escrow', 'in_progress', 'delivered'].includes(o.status)
  ) || [];

  const completedOrders = orders?.filter(o => o.status === 'completed') || [];

  // Net earnings = completed order amounts after 8% fee
  const totalNetEarned = completedOrders.reduce((sum, o) => sum + o.amount * 0.92, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors shrink-0 cursor-pointer"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">My Orders</h1>
              <p className="text-muted-foreground text-sm mt-1">Track deliverables and milestone payments</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border/50 rounded-xl px-3 py-2 transition-colors hover:bg-secondary/30 disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Wallet + Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            icon={Wallet}
            label="Wallet Balance"
            value={formatINR(user?.walletBalance ?? 0)}
            valueClass="text-green-400"
            iconBg="bg-green-400/15 text-green-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="Net Earned (after fee)"
            value={formatINR(totalNetEarned)}
            valueClass="text-foreground"
            iconBg="bg-accent/20 text-accent"
          />
          <StatCard
            icon={AlertCircle}
            label="Active Orders"
            value={activeOrders.length}
            iconBg="bg-blue-400/15 text-blue-400"
          />
          <StatCard
            icon={PackageCheck}
            label="Completed Orders"
            value={completedOrders.length}
            iconBg="bg-primary/15 text-primary"
          />
        </div>

        {/* Orders list */}
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/30 flex items-center justify-between">
            <h2 className="text-lg font-bold">All Orders</h2>
            <span className="text-xs text-muted-foreground">{orders?.length || 0} total</span>
          </div>

          {isLoading ? (
            <div className="p-6"><Skeleton className="h-64 w-full" /></div>
          ) : !orders?.length ? (
            <div className="p-12 text-center">
              <PackageCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="text-base font-semibold mb-1">No orders yet</h3>
              <p className="text-sm text-muted-foreground">When clients hire you, their orders will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {orders.map(order => {
                const netEarn = +(order.amount * 0.92).toFixed(2);
                return (
                  <div key={order._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-5 hover:bg-secondary/20 transition-colors">
                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link
                          to={`/orders/${order._id}`}
                          className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate"
                        >
                          {order.gig?.title || 'Untitled Gig'}
                        </Link>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Client: <span className="text-foreground/80">{order.client?.name}</span></span>
                        <span>·</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Earnings breakdown */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Order Value</p>
                        <p className="text-sm font-bold">{formatINR(order.amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">You Earn (92%)</p>
                        <p className="text-sm font-bold text-green-400">{formatINR(netEarn)}</p>
                      </div>
                      <Link
                        to={`/orders/${order._id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 rounded-xl px-3 py-2 whitespace-nowrap"
                      >
                        Manage <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fee notice */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          SkillPay deducts an 8% platform fee per approved milestone. Wallet balance reflects credited earnings after fees.
        </p>
      </main>
    </div>
  );
};

export default MyOrders;
