import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Clock, CheckCircle2, CheckCircle, FileText,
  Star, AlertTriangle, ShieldAlert,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import StarRating from '../../components/ui/StarRating';
import { getOrderById, raiseDispute } from '../../api/order.api';
import { createReview } from '../../api/review.api';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';
import MilestonePanel from '../../components/MilestonePanel';

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /* ── review form state ── */
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  /* ── dispute state ── */
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeError, setDisputeError] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id),
  });

  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  React.useEffect(() => {
    if (!order?.deadline || order.status === 'completed' || order.status === 'cancelled') {
      setTimeLeft('');
      return;
    }
    
    const calculateTimeLeft = () => {
      const difference = new Date(order.deadline) - new Date();
      if (difference <= 0) {
        setTimeLeft('Overdue');
        setIsUrgent(true);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      
      setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m remaining`);
      setIsUrgent(difference < 24 * 60 * 60 * 1000); // less than 24 hours
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [order]);

  /* ── mutations ── */
  const reviewMutation = useMutation({
    mutationFn: () => createReview(id, { rating, comment }),
    onSuccess: () => {
      setReviewSubmitted(true);
      queryClient.invalidateQueries(['order', id]);
    },
  });

  const disputeMutation = useMutation({
    mutationFn: () => raiseDispute(id, disputeReason),
    onSuccess: () => {
      setShowDisputeForm(false);
      queryClient.invalidateQueries(['order', id]);
    },
    onError: (err) => setDisputeError(err?.response?.data?.message || 'Failed to raise dispute.'),
  });

  /* ── loading / not-found guards ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
             </div>
             <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
             </div>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p>Order not found</p>
        </div>
      </div>
    );
  }

  const isClient = user?._id === order.client?._id;
  const isCompleted = order.status === 'completed';
  const isInProgress = order.status === 'in_progress';
  const hasReview = !!order.review;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_escrow':   return <Badge variant="warning">In Escrow</Badge>;
      case 'in_progress': return <Badge variant="primary">In Progress</Badge>;
      case 'completed':   return <Badge variant="success">Completed</Badge>;
      case 'cancelled':   return <Badge variant="destructive">Cancelled</Badge>;
      case 'disputed':    return <Badge variant="destructive">Disputed</Badge>;
      default:            return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link
            to={isClient ? '/dashboard' : '/student-dashboard'}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        {/* ── Order Header ── */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">Order #{order._id.substring(0, 8)}</h1>
              {getStatusBadge(order.status)}
            </div>
            <Link to={`/gigs/${order.gig?._id}`} className="text-primary hover:underline font-medium text-lg block mb-4">
              {order.gig?.title}
            </Link>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Created {formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{isClient ? `Freelancer: ${order.student?.name}` : `Client: ${order.client?.name}`}</span>
              </div>
            </div>
          </div>

          <div className="md:text-right shrink-0">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-primary">{formatINR(order.amount)}</p>
            {order.status !== 'cancelled' && (
              <div className="inline-flex items-center gap-1 text-sm text-success mt-2 bg-success/10 px-2 py-1 rounded">
                <CheckCircle2 className="h-4 w-4" />
                <span>Paid &amp; Secured in Escrow</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Requirements */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Requirements
              </h2>
              <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-wrap bg-secondary/30 p-4 rounded-xl border border-border/50">
                {order.requirements || 'No requirements provided.'}
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Milestones &amp; Deliverables
                </h2>
              </div>
              <MilestonePanel 
                orderId={order._id} 
                role={isClient ? 'client' : 'student'} 
                orderStatus={order.status} 
              />
            </div>

            {/* ── Review Section (client + completed only) ── */}
            {isClient && isCompleted && (
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  {hasReview || reviewSubmitted ? 'Your Review' : 'Leave a Review'}
                </h2>

                {hasReview || reviewSubmitted ? (
                  /* Existing review */
                  <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                    <StarRating value={order.review?.rating || rating} readOnly />
                    <p className="mt-3 text-muted-foreground text-sm whitespace-pre-wrap">
                      {order.review?.comment || comment}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-3">
                      Submitted {order.review?.createdAt ? formatDate(order.review.createdAt) : 'just now'}
                    </p>
                  </div>
                ) : (
                  /* Review form */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Rating</label>
                      <StarRating value={rating} onChange={setRating} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Comment</label>
                      <textarea
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-none"
                        placeholder="Share your experience with this freelancer..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </div>
                    {reviewMutation.isError && (
                      <p className="text-destructive text-sm">
                        {reviewMutation.error?.response?.data?.message || 'Failed to submit review.'}
                      </p>
                    )}
                    <button
                      onClick={() => reviewMutation.mutate()}
                      disabled={rating === 0 || reviewMutation.isPending}
                      className="bg-primary text-primary-foreground px-5 py-2 rounded-full font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {reviewMutation.isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : null}
                      Submit Review
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Raise Dispute (client + in_progress) ── */}
            {isClient && isInProgress && (
              <div className="bg-card border border-amber-500/30 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="h-5 w-5" />
                  Have an Issue?
                </h2>
                {!showDisputeForm ? (
                  <div className="flex items-start gap-4">
                    <p className="text-sm text-muted-foreground flex-1">
                      If you're experiencing a problem with this order, you can raise a dispute for admin review.
                    </p>
                    <button
                      onClick={() => setShowDisputeForm(true)}
                      className="shrink-0 border border-amber-500 text-amber-500 hover:bg-amber-500/10 px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Raise Dispute
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      className="w-full rounded-xl border border-amber-500/40 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-h-[80px] resize-none"
                      placeholder="Briefly describe the issue..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                    />
                    {disputeError && <p className="text-destructive text-sm">{disputeError}</p>}
                    <div className="flex gap-3">
                      <button
                        onClick={() => disputeMutation.mutate()}
                        disabled={!disputeReason.trim() || disputeMutation.isPending}
                        className="bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                      >
                        {disputeMutation.isPending ? 'Submitting…' : 'Submit Dispute'}
                      </button>
                      <button
                        onClick={() => { setShowDisputeForm(false); setDisputeError(''); }}
                        className="border border-border px-5 py-2 rounded-full text-sm font-semibold hover:bg-secondary/50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column — Order Summary */}
          <div className="space-y-6">
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-3 border-b border-border/50">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{order.status.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-border/50">
                  <span className="text-muted-foreground">Order Date</span>
                  <span className="font-medium">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-border/50">
                  <span className="text-muted-foreground">Delivery Due</span>
                  <span className={`font-medium ${isUrgent ? 'text-destructive font-bold' : ''}`}>
                    {timeLeft ? timeLeft : (order.deadline ? formatDate(order.deadline) : 'TBD')}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
                <a
                  href={`mailto:${isClient ? order.student?.email || '' : order.client?.email || ''}?subject=Regarding Order #${order._id.substring(0, 8)} - ${order.gig?.title}`}
                  className="w-full flex justify-center items-center gap-2 bg-secondary text-secondary-foreground py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                >
                  Contact via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetail;
