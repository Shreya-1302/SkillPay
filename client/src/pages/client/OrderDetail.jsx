import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, CheckCircle2, CheckCircle, FileText, IndianRupee } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { getOrderById } from '../../api/order.api';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';

const OrderDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: order, isLoading } = useQuery({
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'in_escrow': return <Badge variant="warning">In Escrow</Badge>;
      case 'in_progress': return <Badge variant="primary">In Progress</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link to={isClient ? "/dashboard" : "/student-dashboard"} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        {/* Order Header */}
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
                 <span>Paid & Secured in Escrow</span>
               </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Requirements & Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Requirements
              </h2>
              <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-wrap bg-secondary/30 p-4 rounded-xl border border-border/50">
                {order.requirements || "No requirements provided."}
              </div>
            </div>
            
            {/* Milestones (Placeholder for Day 4) */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Milestones & Deliverables
                </h2>
              </div>
              <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                <p>Milestone tracking will be available soon (Day 4 feature).</p>
                <p className="text-sm mt-2">Currently the full amount is held in escrow.</p>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Summary */}
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
                  <span className="font-medium">
                    {order.gig?.deliveryDays ? `${order.gig.deliveryDays} days` : 'TBD'}
                  </span>
                </div>
              </div>

              {/* Action Buttons (Read-only for day 3) */}
              <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
                <button 
                  className="w-full bg-secondary text-secondary-foreground py-2 rounded-lg font-medium opacity-50 cursor-not-allowed"
                  disabled
                >
                  Contact {isClient ? 'Freelancer' : 'Client'}
                </button>
                {isClient && order.status === 'in_escrow' && (
                   <button 
                     className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium opacity-50 cursor-not-allowed"
                     disabled
                   >
                     Approve Delivery & Release Funds
                   </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetail;
