import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X, Upload, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { createGig } from '../../api/gig.api';
import { CATEGORIES } from '../../utils/constants';
import Navbar from '../../components/Navbar';

const CreateGig = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    price: '',
    deliveryDays: '',
    revisions: 1,
    skills: '', // comma separated initially
  });
  
  const [images, setImages] = useState([]); // File objects
  const [previews, setPreviews] = useState([]); // Blob URLs for preview
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || Number(formData.price) < 50) newErrors.price = 'Price must be at least ₹50';
    if (!formData.deliveryDays || Number(formData.deliveryDays) < 1) newErrors.deliveryDays = 'Delivery days must be at least 1';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutate: submitGig, isLoading } = useMutation({
    mutationFn: createGig,
    onSuccess: (data) => {
      toast.success('Gig created successfully!');
      queryClient.invalidateQueries(['myGigs']);
      navigate('/student/my-gigs');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create gig');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('You can upload a maximum of 5 images');
      return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('basePrice', formData.price);
    data.append('deliveryDays', formData.deliveryDays);
    data.append('revisions', formData.revisions);
    
    // Send raw comma separated string to backend so it can be parsed cleanly
    data.append('tags', formData.skills);

    images.forEach(img => {
      data.append('images', img);
    });

    submitGig(data);
  };

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
            <h1 className="text-3xl font-bold mb-2">Create a New Service</h1>
            <p className="text-muted-foreground text-sm">Showcase your skills and start earning by offering your services.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border/50 rounded-2xl p-6 sm:p-10 shadow-sm">
          
          {/* Basic Info */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Gig Title <span className="text-destructive">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="I will build a responsive website..."
                className={`w-full bg-background border ${errors.title ? 'border-destructive' : 'border-input'} rounded-md px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all`}
                maxLength={80}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-destructive">{errors.title}</span>
                <span className="text-xs text-muted-foreground">{formData.title.length}/80 max</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category <span className="text-destructive">*</span></label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-background border border-input rounded-md px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description <span className="text-destructive">*</span></label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what you will do, the tools you use, and why clients should choose you..."
                rows={6}
                className={`w-full bg-background border ${errors.description ? 'border-destructive' : 'border-input'} rounded-md px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-y`}
              />
              {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Skills / Tags</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="React, Node.js, UI Design (comma separated)"
                className="w-full bg-background border border-input rounded-md px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </section>

          {/* Pricing & Scope */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Pricing & Scope</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Price (INR) <span className="text-destructive">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="1000"
                    min="50"
                    className={`w-full bg-background border ${errors.price ? 'border-destructive' : 'border-input'} rounded-md pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all`}
                  />
                </div>
                {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Delivery Time (Days) <span className="text-destructive">*</span></label>
                <input
                  type="number"
                  name="deliveryDays"
                  value={formData.deliveryDays}
                  onChange={handleChange}
                  placeholder="3"
                  min="1"
                  max="30"
                  className={`w-full bg-background border ${errors.deliveryDays ? 'border-destructive' : 'border-input'} rounded-md px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all`}
                />
                {errors.deliveryDays && <p className="text-xs text-destructive mt-1">{errors.deliveryDays}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Revisions</label>
                <input
                  type="number"
                  name="revisions"
                  value={formData.revisions}
                  onChange={handleChange}
                  placeholder="1"
                  min="0"
                  className="w-full bg-background border border-input rounded-md px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>
          </section>

          {/* Media */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-border/50 pb-2">Project Gallery</h2>
            <p className="text-sm text-muted-foreground">Upload images that showcase your work. The first image will be your gig's thumbnail.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                  <img src={preview} alt={`Preview ${idx}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X size={14} />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-1 rounded">
                      THUMBNAIL
                    </span>
                  )}
                </div>
              ))}
              
              {/* Remaining Empty Slots */}
              {[...Array(Math.max(0, 5 - previews.length))].map((_, idx) => (
                <label key={`empty-${idx}`} className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary">
                  <ImagePlus size={24} />
                  <span className="text-xs font-medium">{previews.length === 0 && idx === 0 ? 'Add Thumbnail' : 'Add Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-6 border-t border-border/50">
            <button
              type="button"
              onClick={() => navigate('/student/my-gigs')}
              className="px-6 py-3 font-medium border border-border rounded-full hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>Creating...</>
              ) : (
                <>
                  <Upload size={18} />
                  Publish Gig
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateGig;
