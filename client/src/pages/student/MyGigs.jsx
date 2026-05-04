import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, PauseCircle, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyGigs, deleteGig, updateGig } from '../../api/gig.api';
import { formatINR } from '../../utils/formatCurrency';
import Navbar from '../../components/Navbar';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

const MyGigs = () => {
  const queryClient = useQueryClient();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gigToDelete, setGigToDelete] = useState(null);

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
    mutationFn: ({ id, status }) => {
      const formData = new FormData();
      formData.append('status', status);
      return updateGig(id, formData);
    },
    onSuccess: () => {
      toast.success('Gig status updated');
      queryClient.invalidateQueries(['myGigs']);
    },
    onError: () => toast.error('Failed to update status')
  });

  const handleDeleteClick = (id) => {
    setGigToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (gigToDelete) {
      removeGig(gigToDelete);
      setDeleteModalOpen(false);
      setGigToDelete(null);
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
          <div className="py-20"><Skeleton className="h-64 w-full" /></div>
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
                    <th className="p-4 font-medium text-center">Orders</th>
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
                            <img src={gig.portfolioImages?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(gig.title)}&size=64&background=random`} alt="" className="h-full w-full object-cover" />
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
                      <td className="p-4 text-center font-semibold">{gig.totalOrders || 0}</td>
                      <td className="p-4">
                        {gig.avgRating > 0 ? (
                          <div className="flex items-center gap-1 text-yellow-500 font-medium">
                            ★ {gig.avgRating}
                          </div>
                        ) : (
                          <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20 px-2 py-0.5 text-xs">New</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        {gig.status === 'active' ? (
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
                            onClick={() => toggleStatus({ id: gig._id, status: gig.status === 'active' ? 'paused' : 'active' })}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                            title={gig.status === 'active' ? 'Pause this gig' : 'Resume this gig'}
                          >
                            {gig.status === 'active' ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(gig._id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete this gig"
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

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">Are you sure? This cannot be undone. All data related to this gig will be permanently deleted.</p>
          <div className="flex gap-3 justify-end pt-4">
            <button 
              onClick={() => setDeleteModalOpen(false)} 
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete} 
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors shadow-sm"
            >
              Delete Service
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyGigs;
