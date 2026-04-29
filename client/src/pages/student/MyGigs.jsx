import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, PauseCircle, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyGigs, deleteGig, updateGig } from '../../api/gig.api';
import { formatINR } from '../../utils/formatCurrency';
import Navbar from '../../components/Navbar';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

const MyGigs = () => {
  const queryClient = useQueryClient();

  const { data: gigs, isLoading } = useQuery({
    queryKey: ['myGigs'],
    queryFn: getMyGigs,
  });

  const { mutate: removeGig } = useMutation({
    mutationFn: deleteGig,
    onSuccess: () => {
      toast.success('Gig deleted successfully');
      queryClient.invalidateQueries(['myGigs']);
    },
    onError: () => toast.error('Failed to delete gig')
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, isActive }) => {
      const formData = new FormData();
      formData.append('isActive', isActive);
      return updateGig(id, formData);
    },
    onSuccess: () => {
      toast.success('Gig status updated');
      queryClient.invalidateQueries(['myGigs']);
    },
    onError: () => toast.error('Failed to update status')
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      removeGig(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Services</h1>
            <p className="text-muted-foreground">Manage your gigs and track their performance.</p>
          </div>
          <Link 
            to="/student/create-gig"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            Create New Gig
          </Link>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Spinner size={40} /></div>
        ) : !gigs || gigs.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-2xl p-12 text-center shadow-sm">
            <h3 className="text-xl font-bold mb-2">No Gigs Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven't created any services yet. Create your first gig to start getting orders from clients.
            </p>
            <Link 
              to="/student/create-gig"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90"
            >
              <Plus size={18} />
              Create First Gig
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border/50 text-muted-foreground text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium">Gig Details</th>
                    <th className="p-4 font-medium">Price</th>
                    <th className="p-4 font-medium">Rating</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {gigs.map((gig) => (
                    <tr key={gig._id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-16 rounded bg-secondary overflow-hidden shrink-0">
                            <img src={gig.portfolioImages?.[0] || ''} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <Link to={`/gigs/${gig._id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                              {gig.title}
                            </Link>
                            <span className="text-sm text-muted-foreground">{gig.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-foreground">{formatINR(gig.basePrice)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-yellow-500 font-medium">
                          ★ {gig.rating || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        {gig.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">Paused</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            to={`/gigs/${gig._id}`}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link 
                            to={`/student/edit-gig/${gig._id}`}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button 
                            onClick={() => toggleStatus({ id: gig._id, isActive: !gig.isActive })}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                            title={gig.isActive ? "Pause Gig" : "Activate Gig"}
                          >
                            {gig.isActive ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                          </button>
                          <button 
                            onClick={() => handleDelete(gig._id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
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

export default MyGigs;
