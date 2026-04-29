import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import { getGigs } from '../api/gig.api';
import { CATEGORIES } from '../utils/constants';
import Navbar from '../components/Navbar';
import GigCard from '../components/GigCard';
import Spinner from '../components/ui/Spinner';

const GigList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Parse initial state from URL
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    maxDeliveryDays: searchParams.get('maxDeliveryDays') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
  });

  // Sync URL changes to state
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      maxDeliveryDays: searchParams.get('maxDeliveryDays') || '',
      page: parseInt(searchParams.get('page') || '1', 10),
    });
  }, [searchParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['gigs', filters],
    queryFn: () => getGigs(filters),
    keepPreviousData: true,
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            {filters.search ? `Results for "${filters.search}"` : 'Explore Services'}
          </h1>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-full font-medium"
          >
            <Filter size={18} /> Filters
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`w-full md:w-64 shrink-0 space-y-6 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-card border border-border/50 rounded-xl p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear all</button>
              </div>

              {/* Category */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Category</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="category" 
                      checked={filters.category === ''}
                      onChange={() => handleFilterChange('category', '')}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm">All Categories</span>
                  </label>
                  {CATEGORIES.map(cat => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="category" 
                        checked={filters.category === cat}
                        onChange={() => handleFilterChange('category', cat)}
                        className="text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Price Range</h4>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              {/* Delivery Days */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Max Delivery Time</h4>
                <select 
                  value={filters.maxDeliveryDays}
                  onChange={(e) => handleFilterChange('maxDeliveryDays', e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary"
                >
                  <option value="">Any Delivery Time</option>
                  <option value="1">Up to 1 Day</option>
                  <option value="3">Up to 3 Days</option>
                  <option value="7">Up to 7 Days</option>
                  <option value="14">Up to 14 Days</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Results Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Spinner size={40} />
              </div>
            ) : isError ? (
              <div className="text-center py-12 bg-destructive/10 text-destructive rounded-xl">
                <p>Failed to load gigs. Please try again.</p>
              </div>
            ) : data?.gigs?.length === 0 ? (
              <div className="text-center py-24 bg-card/50 rounded-xl border border-border/50">
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
                <button 
                  onClick={clearFilters}
                  className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {data?.gigs?.length} {data?.gigs?.length === 1 ? 'service' : 'services'}
                  {data?.totalGigs > data?.gigs?.length && ` of ${data.totalGigs}`}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data?.gigs?.map(gig => (
                    <GigCard key={gig._id} gig={gig} />
                  ))}
                </div>

                {/* Pagination */}
                {data?.totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      disabled={filters.page === 1}
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                      className="px-4 py-2 border border-border rounded-md disabled:opacity-50 hover:bg-secondary/50"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: data.totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handleFilterChange('page', i + 1)}
                          className={`w-10 h-10 rounded-md flex items-center justify-center ${
                            filters.page === i + 1 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-secondary/50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={filters.page === data.totalPages}
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      className="px-4 py-2 border border-border rounded-md disabled:opacity-50 hover:bg-secondary/50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GigList;
