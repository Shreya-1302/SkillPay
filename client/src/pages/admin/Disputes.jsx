import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle2, UserCheck, Undo2, ArrowLeft } from 'lucide-react';
import { getDisputedOrders, resolveDispute } from '../../api/admin.api';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Navbar from '../../components/Navbar';
import Skeleton from '../../components/ui/Skeleton';

const DisputeModal = ({ order, onClose, onResolve, isPending }) => {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10"
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">Dispute Details</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Order Info */}
        <div className="bg-secondary/30 rounded-xl p-4 space-y-3 mb-6 border border-border/50 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono font-medium">#{order._id.substring(0, 10)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gig</span>
            <span className="font-medium truncate max-w-[60%] text-right">{order.gig?.title || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold text-primary">{formatINR(order.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Student</span>
            <span className="font-medium">{order.student?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Client</span>
            <span className="font-medium">{order.client?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Raised On</span>
            <span className="font-medium">{formatDate(order.updatedAt)}</span>
          </div>
        </div>

        {/* Resolve buttons */}
        <p className="text-sm font-medium mb-3 text-muted-foreground">Resolve In Favour Of:</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            id={`resolve-student-${order._id}`}
            onClick={() => onResolve(order._id, 'student')}
            disabled={isPending}
            className="flex flex-col items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl px-4 py-4 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <UserCheck className="h-6 w-6" />
            Release to Student
            <span className="text-xs font-normal text-muted-foreground">Funds → Student Wallet</span>
          </button>
          <button
            id={`resolve-client-${order._id}`}
            onClick={() => onResolve(order._id, 'client')}
            disabled={isPending}
            className="flex flex-col items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 rounded-xl px-4 py-4 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <Undo2 className="h-6 w-6" />
            Refund to Client
            <span className="text-xs font-normal text-muted-foreground">Refund via Razorpay</span>
          </button>
        </div>

        {isPending && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Processing resolution…
          </div>
        )}
      </motion.div>
    </div>
  );
};

const AdminDisputes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['adminDisputes'],
    queryFn: getDisputedOrders,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, winner }) => resolveDispute(id, winner),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminDisputes']);
      setSelectedOrder(null);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors shrink-0 cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
              Dispute Management
            </h1>
            <p className="text-muted-foreground text-sm">Review and resolve disputed orders.</p>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-96 w-full" /></div>
          ) : !disputes || disputes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <CheckCircle2 className="h-14 w-14 mb-4 text-emerald-500/40" />
              <p className="text-lg font-semibold">No open disputes</p>
              <p className="text-sm mt-1">All orders are running smoothly.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="p-4 font-medium">Order ID</th>
                      <th className="p-4 font-medium">Gig</th>
                      <th className="p-4 font-medium">Student</th>
                      <th className="p-4 font-medium">Client</th>
                      <th className="p-4 font-medium">Amount</th>
                      <th className="p-4 font-medium">Raised</th>
                      <th className="p-4 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {disputes.map((order) => (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setSelectedOrder(order)}
                        className="hover:bg-amber-500/5 transition-colors cursor-pointer"
                      >
                        <td className="p-4">
                          <span className="font-mono text-sm text-muted-foreground">
                            #{order._id.substring(0, 8)}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium max-w-[180px] truncate">
                          {order.gig?.title || '—'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-secondary overflow-hidden shrink-0">
                              <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(order.student?.name || 'S')}&background=random`}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="text-sm">{order.student?.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-secondary overflow-hidden shrink-0">
                              <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(order.client?.name || 'C')}&background=random`}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="text-sm">{order.client?.name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-amber-400">{formatINR(order.amount)}</td>
                        <td className="p-4 text-sm text-muted-foreground">{formatDate(order.updatedAt)}</td>
                        <td className="p-4 text-center">
                          <button
                            id={`open-dispute-${order._id}`}
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                            className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Resolve
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="block md:hidden divide-y divide-border/50">
                {disputes.map((order) => (
                  <div
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    className="p-4 space-y-3 hover:bg-amber-500/5 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">Order #{order._id.substring(0, 8)}</span>
                        <p className="font-semibold text-sm text-foreground line-clamp-2 mt-1">
                          {order.gig?.title || '—'}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-amber-400">{formatINR(order.amount)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-border/30 pt-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground w-12">Student:</span>
                          <span className="font-medium text-foreground">{order.student?.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground w-12">Client:</span>
                          <span className="font-medium text-foreground">{order.client?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">Raised On</span>
                        <span className="font-medium text-foreground">{formatDate(order.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        id={`open-dispute-mobile-${order._id}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                        className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Resolve Dispute
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Dispute Detail Modal ── */}
      <AnimatePresence>
        {selectedOrder && (
          <DisputeModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onResolve={(id, winner) => resolveMutation.mutate({ id, winner })}
            isPending={resolveMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDisputes;
