import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyOrdersClient } from '../../api/order.api';
import Navbar from '../../components/Navbar';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Briefcase, CreditCard, ArrowRight } from 'lucide-react';

const ClientDashboard = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['myOrdersClient'],
    queryFn: getMyOrdersClient
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

  const activeOrders = orders?.filter(o => !['completed', 'cancelled'].includes(o.status)) || [];
  const totalSpent = orders?.reduce((sum, o) => sum + o.amount, 0) || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Client Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-2xl border border-border/50 p-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Briefcase className="h-7 w-7" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Active Hires</p>
              <p className="text-3xl font-bold">{activeOrders.length}</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border/50 p-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <CreditCard className="h-7 w-7" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Spent</p>
              <p className="text-3xl font-bold">{formatINR(totalSpent)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recent Orders</h2>
          <Link to="/client/hires" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          {orders?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>You haven't hired anyone yet.</p>
              <Link to="/gigs" className="text-primary mt-2 inline-block font-medium hover:underline">Browse Gigs</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50 text-left text-sm text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">Service</th>
                    <th className="p-4 font-medium">Student</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {orders?.slice(0, 5).map(order => (
                    <tr key={order._id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-medium">{order.gig.title}</td>
                      <td className="p-4">{order.student.name}</td>
                      <td className="p-4">{formatINR(order.amount)}</td>
                      <td className="p-4">
                        <Badge variant={order.status === 'in_escrow' ? 'warning' : 'secondary'}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Link to={`/orders/${order._id}`} className="text-primary font-medium hover:underline">
                          View
                        </Link>
                      </td>
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

export default ClientDashboard;
