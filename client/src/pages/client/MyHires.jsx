import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { getMyOrdersClient } from '../../api/order.api';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Search } from 'lucide-react';

const MyHires = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['clientOrders'],
    queryFn: getMyOrdersClient,
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
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Hires</h1>
            <p className="text-muted-foreground mt-1">Manage all your freelance projects</p>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          {orders?.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground">
               <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                 <Search className="h-8 w-8" />
               </div>
               <p className="text-lg font-medium text-foreground">No hires found</p>
               <p className="mb-6">You haven't hired anyone yet.</p>
               <Link to="/gigs" className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium">
                 Find a Freelancer
               </Link>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium">Project</th>
                    <th scope="col" className="px-6 py-4 font-medium">Freelancer</th>
                    <th scope="col" className="px-6 py-4 font-medium">Amount</th>
                    <th scope="col" className="px-6 py-4 font-medium">Status</th>
                    <th scope="col" className="px-6 py-4 font-medium">Date</th>
                    <th scope="col" className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {orders?.map((order) => (
                    <tr key={order._id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="line-clamp-2 max-w-[250px]">
                          {order.gig?.title || 'Unknown Gig'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <img 
                            src={order.student?.avatar || `https://ui-avatars.com/api/?name=${order.student?.name || 'S'}&background=random`} 
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                          <span>{order.student?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatINR(order.amount)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/orders/${order._id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          View Details
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

export default MyHires;
