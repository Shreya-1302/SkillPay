import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyOrdersClient } from '../../api/order.api';
import Navbar from '../../components/Navbar';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const MyHires = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['myOrdersClient'],
    queryFn: getMyOrdersClient
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Hires</h1>
          <p className="text-muted-foreground">Manage all your requested services and active projects.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size={40} /></div>
        ) : orders?.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
            <h3 className="text-xl font-bold mb-2">No hires found</h3>
            <p className="text-muted-foreground mb-6">You haven't hired any students yet.</p>
            <Link to="/gigs" className="bg-primary px-6 py-2 rounded-full text-primary-foreground font-medium">
              Find Talent
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 text-muted-foreground text-sm">
                  <tr>
                    <th className="p-4 font-medium">Order Info</th>
                    <th className="p-4 font-medium">Student</th>
                    <th className="p-4 font-medium">Price</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {orders?.map(order => (
                    <tr key={order._id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-4">
                        <p className="font-medium max-w-[200px] truncate">{order.gig.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 text-ellipsis overflow-hidden">ID: {order._id.substring(order._id.length - 8)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img src={order.student.avatar || `https://ui-avatars.com/api/?name=${order.student.name}`} alt="" className="w-6 h-6 rounded-full" />
                          <span className="text-sm">{order.student.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-sm">{formatINR(order.amount)}</td>
                      <td className="p-4">
                        <Badge variant={order.status === 'in_escrow' ? 'warning' : order.status === 'completed' ? 'success' : 'secondary'}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(order.createdAt)}</td>
                      <td className="p-4 text-right">
                        <Link to={`/orders/${order._id}`} className="text-primary font-medium hover:underline text-sm">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyHires;
