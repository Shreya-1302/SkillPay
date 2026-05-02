import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrderById } from '../../api/order.api';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import MilestonePanel from '../../components/MilestonePanel';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle,
  ShieldCheck, Banknote, XCircle, PackageCheck,
} from 'lucide-react';

// ─── Status display helpers ────────────────────────────────────────────────────
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
    <Badge variant={cfg.variant} className="flex items-center gap-1.5 px-3 py-1 text-xs">
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
};

// ─── Escrow info banner ────────────────────────────────────────────────────────
const EscrowBanner = ({ status, amount }) => {
  if (!['in_escrow', 'in_progress'].includes(status)) return null;
  return (
    <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
      <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-blue-400">
          {formatINR(amount)} held securely in escrow
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Funds are released to the student only when you approve each milestone. 8% platform fee applies per milestone.
        </p>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const role = user?.role; // 'client' | 'student'

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size={48} />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <XCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-medium">Order not found or access denied.</p>
          <Link to={role === 'student' ? '/student/orders' : '/dashboard'} className="text-primary hover:underline text-sm">
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  const backHref = role === 'student' ? '/student/orders' : '/client/hires';
  const backLabel = role === 'student' ? 'My Orders' : 'My Hires';
  const counterparty = role === 'student' ? order.client : order.student;
  const counterpartyLabel = role === 'student' ? 'Client' : 'Student';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">

        {/* Back link */}
        <Link
          to={backHref}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          {backLabel}
        </Link>

        {/* ── Order header card ─────────────────────────────────────────────── */}
        <div className="bg-card rounded-3xl border border-border/50 p-6 md:p-8 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs font-mono">
                  #{order._id.slice(-8).toUpperCase()}
                </Badge>
                <OrderStatusBadge status={order.status} />
              </div>
              <h1 className="text-xl md:text-2xl font-bold mb-1">{order.gig?.title}</h1>
              <p className="text-sm text-muted-foreground">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 justify-end">
                <Banknote className="w-3.5 h-3.5" /> Total Value
              </p>
              <p className="text-3xl font-bold text-primary">{formatINR(order.amount)}</p>
            </div>
          </div>

          {/* Escrow banner */}
          <EscrowBanner status={order.status} amount={order.amount} />

          {/* Counterparty + Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border/30 pt-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {counterpartyLabel}
              </h3>
              <div className="flex items-center gap-3 bg-secondary/30 p-4 rounded-2xl">
                <img
                  src={
                    counterparty?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(counterparty?.name || 'U')}&background=random&color=fff`
                  }
                  className="w-11 h-11 rounded-full ring-2 ring-border/50"
                  alt={counterparty?.name}
                />
                <div>
                  <p className="font-semibold text-sm">{counterparty?.name}</p>
                  <p className="text-xs text-muted-foreground">{counterparty?.email}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Requirements
              </h3>
              <div className="bg-secondary/30 p-4 rounded-2xl text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                {order.requirements}
              </div>
            </div>
          </div>
        </div>

        {/* ── Milestones card ───────────────────────────────────────────────── */}
        <div className="bg-card rounded-3xl border border-border/50 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Milestones &amp; Payments</h2>
            {order.status === 'completed' && (
              <Badge variant="success" className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Order Complete
              </Badge>
            )}
          </div>

          <MilestonePanel
            orderId={order._id}
            role={role}
            orderStatus={order.status}
          />
        </div>

      </main>
    </div>
  );
};

export default OrderDetail;
