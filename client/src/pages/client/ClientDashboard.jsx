import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase, IndianRupee, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { getMyOrdersClient } from '../../api/order.api';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const ClientDashboard = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['clientOrders'],
    queryFn: getMyOrdersClient,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-6">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  // Calculate summary metrics
  const activeOrders = orders?.filter(o => o.status === 'in_escrow' || o.status === 'in_progress') || [];
  const completedOrders = orders?.filter(o => o.status === 'completed') || [];
  const validSpentOrders = orders?.filter(o => !['cancelled', 'pending_payment'].includes(o.status)) || [];
  const totalSpent = validSpentOrders.reduce((sum, o) => sum + o.amount, 0);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'in_escrow': return <Badge variant="warning">In Escrow</Badge>;
      case 'in_progress': return <Badge variant="primary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">In Progress</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'disputed': return <Badge variant="destructive">Disputed</Badge>;
      case 'pending_payment': return <Badge variant="secondary">Pending Payment</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Client Dashboard</h1>
          <Link 
            to="/client/my-hires"
            className="text-primary hover:underline font-medium text-sm"
          >
            View All Hires
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Active Hires</p>
              <h3 className="text-2xl font-bold">{activeOrders.length}</h3>
            </div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Completed Projects</p>
              <h3 className="text-2xl font-bold">{completedOrders.length}</h3>
            </div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <IndianRupee className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Spent</p>
              <h3 className="text-2xl font-bold">{formatINR(totalSpent)}</h3>
            </div>
          </div>
        </div>

        {/* Recent Orders List */}
        {orders?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 mt-8 text-center bg-card rounded-3xl border border-border/50 shadow-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
              <Briefcase className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Ready to start your first project?</h3>
            <p className="text-muted-foreground max-w-md mb-8 text-lg">Browse through thousands of talented student freelancers and get your project done today.</p>
            <Link to="/gigs" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg">
              Browse services to find your first freelancer <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 bg-secondary/30">
              <h3 className="font-bold">Recent Orders</h3>
            </div>
            <div className="divide-y divide-border/50">
              {orders?.slice(0, 5).map(order => (
                <Link 
                  key={order._id} 
                  to={`/orders/${order._id}`}
                  className="flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-md bg-secondary overflow-hidden shrink-0 border border-border/50">
                      <img 
                        src={order.gig?.portfolioImages?.[0] || `https://ui-avatars.com/api/?name=${order.gig?.title || 'G'}&background=random`} 
                        alt="Gig"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground line-clamp-1">{order.gig?.title}</h4>
                      <p className="text-sm text-muted-foreground">Freelancer: {order.student?.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Ordered: {formatDate(order.createdAt)}</span>
                        </div>
                        {order.deadline && (
                          <div className="flex items-center gap-1 font-medium text-amber-500">
                            <Clock className="h-3 w-3" />
                            <span>Due: {formatDate(order.deadline)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="font-bold text-lg">{formatINR(order.amount)}</p>
                      <div className="mt-1">{getStatusBadge(order.status)}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
