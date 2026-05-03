import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { getMyOrdersStudent } from '../../api/order.api';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Navbar from '../../components/Navbar';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import EarningsChart from '../../components/EarningsChart';

const StudentDashboard = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['studentOrders'],
    queryFn: getMyOrdersStudent,
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'payment_pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Pending Payment</Badge>;
      case 'in_escrow':
        return <Badge variant="success" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><AlertCircle className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'completed':
        return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const activeOrders = orders?.filter(o => !['completed', 'cancelled', 'payment_pending'].includes(o.status)) || [];
  const totalEarned = orders?.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">Manage your orders and track your earnings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-muted-foreground font-medium mb-2">Total Earnings</h3>
            <p className="text-3xl font-bold text-foreground">{formatINR(totalEarned)}</p>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-muted-foreground font-medium mb-2">Active Orders</h3>
            <p className="text-3xl font-bold text-foreground">{activeOrders.length}</p>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-muted-foreground font-medium mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-foreground">{orders?.length || 0}</p>
          </div>
        </div>

        {/* Earnings Chart Section */}
        <div className="mb-10">
          <EarningsChart />
        </div>

        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-xl font-bold">Recent Orders</h2>
          </div>
          
          {isLoading ? (
            <div className="p-12 flex justify-center"><Spinner size={40} /></div>
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
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="p-4 font-bold text-foreground">
                        {formatINR(order.amount)}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(order.status)}
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

export default StudentDashboard;
