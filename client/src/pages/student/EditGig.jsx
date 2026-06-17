import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getGigById, updateGig } from '../../api/gig.api';
import { CATEGORIES } from '../../utils/constants';
import Navbar from '../../components/Navbar';
import Spinner from '../../components/ui/Spinner';

const EditGig = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    deliveryDays: '',
    revisions: 1,
    skills: '', 
  });
  
  const [existingImages, setExistingImages] = useState([]); // URLs from backend
  const [newImages, setNewImages] = useState([]); // New File objects
  const [newPreviews, setNewPreviews] = useState([]); // New Blob URLs for preview

  // Fetch existing gig data
  const { data: gig, isLoading: isFetching } = useQuery({
    queryKey: ['gig', id],
    queryFn: () => getGigById(id),
    onSuccess: (data) => {
      setFormData({
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.basePrice,
        deliveryDays: data.deliveryDays,
        revisions: data.revisions || 1,
        skills: data.tags?.join(', ') || '',
      });
      setExistingImages(data.portfolioImages || []);
    }
  });

  const { mutate: submitUpdate, isLoading: isUpdating } = useMutation({
    mutationFn: (data) => updateGig(id, data),
    onSuccess: () => {
      toast.success('Gig updated successfully!');
      queryClient.invalidateQueries(['gig', id]);
      queryClient.invalidateQueries(['myGigs']);
      navigate('/student/my-gigs');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update gig');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingImages.length + newImages.length > 5) {
      toast.error('You can have a maximum of 5 images');
      return;
    }

    const previews = files.map(file => URL.createObjectURL(file));
    setNewImages(prev => [...prev, ...files]);
    setNewPreviews(prev => [...prev, ...previews]);
  };

  const removeExistingImage = (imgUrl) => {
    // In a real app, you might want to keep track of removed image IDs to send to the backend
    // For now, we just remove it from UI state and we would handle it on backend if implemented
    setExistingImages(prev => prev.filter(img => img !== imgUrl));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(newPreviews[index]);
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.deliveryDays) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('basePrice', formData.price);
    data.append('deliveryDays', formData.deliveryDays);
    data.append('revisions', formData.revisions);
    
    const tagsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
    data.append('tags', JSON.stringify(tagsArray));

    // Optional: send existing images data to keep them, depending on backend implementation
    data.append('existingImages', JSON.stringify(existingImages));

    newImages.forEach(img => {
      data.append('images', img);
    });

    submitUpdate(data);
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[80vh] items-center justify-center">
          <Spinner size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors shrink-0 cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Service</h1>
            <p className="text-muted-foreground text-sm">Update your gig details to attract more clients.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border/50 rounded-2xl p-6 sm:p-10 shadow-sm">
          {/* Form fields are identical to CreateGig... */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Gig Title</label>
              <input
                type="text" name="title" value={formData.title} onChange={handleChange}
                className="w-full bg-background border border-input rounded-md px-4 py-3 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                name="category" value={formData.category} onChange={handleChange}
                className="w-full bg-background border border-input rounded-md px-4 py-3 focus:ring-primary"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description" value={formData.description} onChange={handleChange} rows={6}
                className="w-full bg-background border border-input rounded-md px-4 py-3 focus:ring-primary resize-y"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Skills / Tags</label>
              <input
                type="text" name="skills" value={formData.skills} onChange={handleChange}
                className="w-full bg-background border border-input rounded-md px-4 py-3 focus:ring-primary"
              />
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Pricing & Scope</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Price (INR)</label>
                <input
                  type="number" name="price" value={formData.price} onChange={handleChange}
                  className="w-full bg-background border border-input rounded-md px-4 py-3 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Time (Days)</label>
                <input
                  type="number" name="deliveryDays" value={formData.deliveryDays} onChange={handleChange}
                  className="w-full bg-background border border-input rounded-md px-4 py-3 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Revisions</label>
                <input
                  type="number" name="revisions" value={formData.revisions} onChange={handleChange}
                  className="w-full bg-background border border-input rounded-md px-4 py-3 focus:ring-primary"
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Project Gallery</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Existing Images */}
              {existingImages.map((imgUrl, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                  <img src={imgUrl} alt={`Existing ${idx}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(imgUrl)}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive"
                  >
                    <X size={14} />
                  </button>
                  {idx === 0 && <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-primary px-2 py-1 rounded">THUMBNAIL</span>}
                </div>
              ))}

              {/* New Previews */}
              {newPreviews.map((preview, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                  <img src={preview} alt={`New ${idx}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {existingImages.length + newPreviews.length < 5 && (
                <label className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary">
                  <ImagePlus size={24} />
                  <span className="text-xs">Add Image</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-6 border-t border-border/50">
            <button
              type="button" onClick={() => navigate('/student/my-gigs')}
              className="px-6 py-3 font-medium border border-border rounded-full hover:bg-secondary/50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isUpdating}
              className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 flex items-center gap-2"
            >
              {isUpdating ? 'Saving...' : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditGig;
