import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, X, SearchX, ArrowUpDown, SlidersHorizontal,
  Code, Paintbrush, PenTool, Video, Music, Briefcase,
  Megaphone, Grid3X3, LayoutList, ChevronLeft, ChevronRight,
  Tag, Clock, TrendingUp, Star, ArrowLeft
} from 'lucide-react';
import { getGigs } from '../api/gig.api';
import { CATEGORIES } from '../utils/constants';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GigCard from '../components/GigCard';
import Skeleton from '../components/ui/Skeleton';

/* ── category icon map ── */
const CAT_ICONS = {
  'Programming & Tech': Code,
  'Graphics & Design': Paintbrush,
  'Digital Marketing': Megaphone,
  'Writing & Translation': PenTool,
  'Video & Animation': Video,
  'Music & Audio': Music,
  'Business': Briefcase,
  'Other': Grid3X3,
};
const CAT_COLORS = {
  'Programming & Tech': '#6366f1',
  'Graphics & Design': '#a855f7',
  'Digital Marketing': '#ec4899',
  'Writing & Translation': '#f59e0b',
  'Video & Animation': '#10b981',
  'Music & Audio': '#3b82f6',
  'Business': '#14b8a6',
  'Other': '#8b5cf6',
};

const SORT_OPTIONS = [
  { value: '',           label: 'Newest',           icon: TrendingUp },
  { value: 'price_asc',  label: 'Price: Low → High', icon: Tag },
  { value: 'price_desc', label: 'Price: High → Low', icon: Tag },
  { value: 'rating_desc',label: 'Top Rated',         icon: Star },
];

const DELIVERY_OPTIONS = [
  { value: '',   label: 'Any Time' },
  { value: '1',  label: 'Up to 1 Day' },
  { value: '3',  label: 'Up to 3 Days' },
  { value: '7',  label: 'Up to 7 Days' },
  { value: '14', label: 'Up to 14 Days' },
];

/* ══════════════════════════════════════════════════════════════════════ */
const GigList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    maxDeliveryDays: searchParams.get('maxDeliveryDays') || '',
    sort: searchParams.get('sort') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
  });

  const [priceInput, setPriceInput] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      maxDeliveryDays: searchParams.get('maxDeliveryDays') || '',
      sort: searchParams.get('sort') || '',
      page: parseInt(searchParams.get('page') || '1', 10),
    });
    setPriceInput({
      min: searchParams.get('minPrice') || '',
      max: searchParams.get('maxPrice') || '',
    });
  }, [searchParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['gigs', filters],
    queryFn: () => getGigs(filters),
    keepPreviousData: true,
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    setSearchParams(params);
  };

  const applyPriceFilter = () => {
    setPriceError('');
    if (priceInput.min && priceInput.max && Number(priceInput.max) < Number(priceInput.min)) {
      setPriceError('Max must be ≥ Min');
      return;
    }
    const newFilters = { ...filters, minPrice: priceInput.min, maxPrice: priceInput.max, page: 1 };
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  /* active filter count */
  const activeCount = [
    filters.category, filters.minPrice, filters.maxPrice, filters.maxDeliveryDays
  ].filter(Boolean).length;

  const pageTitle = filters.search
    ? `Results for "${filters.search}"`
    : 'Explore Services';

  return (
    <div className="gl-root">
      <Navbar />

      <main className="gl-main">

        {/* ── Page Header ── */}
        <div className="gl-page-header">
          <div className="gl-header-left flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors shrink-0 cursor-pointer animate-none"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="gl-page-title">{pageTitle}</h1>
              {data?.totalGigs != null && !isLoading && (
                <span className="gl-result-count">
                  {data.totalGigs} {data.totalGigs === 1 ? 'service' : 'services'} available
                </span>
              )}
            </div>
          </div>

          <div className="gl-header-right">
            {/* Sort */}
            <div className="gl-sort-wrap">
              <ArrowUpDown className="w-4 h-4 gl-sort-icon" />
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="gl-sort-select"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* View toggle */}
            <div className="gl-view-toggle">
              <button
                onClick={() => setViewMode('grid')}
                className={`gl-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`gl-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                title="List view"
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="gl-filter-toggle-btn"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeCount > 0 && (
                <span className="gl-filter-badge">{activeCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Active Filter Pills ── */}
        {activeCount > 0 && (
          <div className="gl-active-filters">
            {filters.category && (
              <span className="gl-filter-pill">
                {filters.category}
                <button onClick={() => handleFilterChange('category', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="gl-filter-pill">
                ₹{filters.minPrice || '0'} – ₹{filters.maxPrice || '∞'}
                <button onClick={() => { setPriceInput({ min: '', max: '' }); handleFilterChange('minPrice', ''); handleFilterChange('maxPrice', ''); }}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.maxDeliveryDays && (
              <span className="gl-filter-pill">
                <Clock className="w-3 h-3" /> ≤ {filters.maxDeliveryDays} day{filters.maxDeliveryDays > 1 ? 's' : ''}
                <button onClick={() => handleFilterChange('maxDeliveryDays', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="gl-clear-all-btn">Clear all</button>
          </div>
        )}

        <div className="gl-body">

          {/* ── SIDEBAR ── */}
          <AnimatePresence>
            {(isFilterOpen || true) && (
              <motion.aside
                className={`gl-sidebar ${isFilterOpen ? 'gl-sidebar-open' : ''}`}
                initial={false}
              >
                {/* Mobile close */}
                <div className="gl-sidebar-header">
                  <div className="gl-sidebar-title-row">
                    <SlidersHorizontal className="w-5 h-5" style={{ color: '#6366f1' }} />
                    <h3 className="gl-sidebar-title">Filters</h3>
                    {activeCount > 0 && (
                      <span className="gl-sidebar-badge">{activeCount} active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {activeCount > 0 && (
                      <button onClick={clearFilters} className="gl-sidebar-clear">Clear all</button>
                    )}
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="md:hidden p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/45 transition-colors"
                      aria-label="Close filters"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* ─ Category ─ */}
                <div className="gl-filter-section">
                  <h4 className="gl-filter-label">Category</h4>
                  <div className="gl-cat-list">
                    <button
                      onClick={() => handleFilterChange('category', '')}
                      className={`gl-cat-btn ${filters.category === '' ? 'active' : ''}`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                      All Categories
                    </button>
                    {CATEGORIES.map(cat => {
                      const Icon = CAT_ICONS[cat] || Grid3X3;
                      const color = CAT_COLORS[cat] || '#6366f1';
                      const isActive = filters.category === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => handleFilterChange('category', cat)}
                          className={`gl-cat-btn ${isActive ? 'active' : ''}`}
                          style={isActive ? { '--cat-c': color } : {}}
                        >
                          <Icon className="w-4 h-4" style={{ color: isActive ? color : undefined }} />
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─ Price ─ */}
                <div className="gl-filter-section">
                  <h4 className="gl-filter-label">Budget (₹)</h4>
                  <div className="gl-price-inputs">
                    <div className="gl-price-field">
                      <span className="gl-price-prefix">₹</span>
                      <input
                        type="number"
                        placeholder="Min"
                        min="0"
                        value={priceInput.min}
                        onChange={(e) => setPriceInput({ ...priceInput, min: e.target.value })}
                        className="gl-price-input"
                      />
                    </div>
                    <div className="gl-price-divider">—</div>
                    <div className="gl-price-field">
                      <span className="gl-price-prefix">₹</span>
                      <input
                        type="number"
                        placeholder="Max"
                        min="0"
                        value={priceInput.max}
                        onChange={(e) => setPriceInput({ ...priceInput, max: e.target.value })}
                        className="gl-price-input"
                      />
                    </div>
                  </div>
                  {priceError && <p className="gl-price-error">{priceError}</p>}
                  <button onClick={applyPriceFilter} className="gl-apply-btn">
                    Apply Budget
                  </button>
                </div>

                {/* ─ Delivery ─ */}
                <div className="gl-filter-section">
                  <h4 className="gl-filter-label">Delivery Time</h4>
                  <div className="gl-delivery-list">
                    {DELIVERY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleFilterChange('maxDeliveryDays', opt.value)}
                        className={`gl-delivery-btn ${filters.maxDeliveryDays === opt.value ? 'active' : ''}`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── CONTENT ── */}
          <div className="gl-content">

            {isLoading ? (
              <div className={viewMode === 'grid' ? 'gl-grid' : 'gl-list'}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-80 w-full rounded-2xl" />
                ))}
              </div>
            ) : isError ? (
              <div className="gl-error-state">
                <div className="gl-error-icon">⚠️</div>
                <h3>Something went wrong</h3>
                <p>Failed to load services. Please try again.</p>
                <button onClick={() => window.location.reload()} className="gl-retry-btn">
                  Retry
                </button>
              </div>
            ) : data?.gigs?.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="gl-empty-state"
              >
                <div className="gl-empty-icon">
                  <SearchX className="w-10 h-10" />
                </div>
                <h3 className="gl-empty-title">No services found</h3>
                <p className="gl-empty-sub">
                  Try adjusting your filters or search for something else.
                </p>
                <button onClick={clearFilters} className="gl-apply-btn" style={{ marginTop: '20px', maxWidth: '200px' }}>
                  Clear all filters
                </button>
              </motion.div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'gl-grid' : 'gl-list'}>
                  {data?.gigs?.map((gig, idx) => (
                    <motion.div
                      key={gig._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.35 }}
                    >
                      <GigCard gig={gig} listMode={viewMode === 'list'} />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {data?.totalPages > 1 && (
                  <div className="gl-pagination">
                    <button
                      disabled={filters.page === 1}
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                      className="gl-page-nav"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>

                    <div className="gl-page-nums">
                      {Array.from({ length: data.totalPages }).map((_, i) => {
                        const p = i + 1;
                        const isCur = filters.page === p;
                        const isNear = Math.abs(filters.page - p) <= 2;
                        if (!isNear && p !== 1 && p !== data.totalPages) {
                          return p === 2 || p === data.totalPages - 1
                            ? <span key={p} className="gl-page-ellipsis">…</span>
                            : null;
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => handleFilterChange('page', p)}
                            className={`gl-page-num ${isCur ? 'active' : ''}`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      disabled={filters.page === data.totalPages}
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      className="gl-page-nav"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* ── Scoped styles ── */}
      <style>{`
        .gl-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: hsl(222 47% 11%);
          font-family: Georgia, 'Times New Roman', Times, serif;
        }

        .gl-main {
          flex: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          width: 100%;
        }

        /* ── header ── */
        .gl-page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }
        .gl-header-left { display: flex; flex-direction: column; gap: 6px; }
        .gl-page-title {
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 800;
          color: hsl(214 32% 91%);
          letter-spacing: -0.02em;
          margin: 0;
        }
        .gl-result-count {
          font-size: 0.875rem;
          color: hsl(215 20% 55%);
        }

        .gl-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* sort */
        .gl-sort-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: hsl(217 33% 17%);
          border: 1px solid rgba(99,102,241,0.18);
          border-radius: 12px;
          padding: 8px 14px;
        }
        .gl-sort-icon { color: hsl(215 20% 50%); flex-shrink: 0; }
        .gl-sort-select {
          background: transparent;
          border: none;
          outline: none;
          color: hsl(214 32% 85%);
          font-size: 0.875rem;
          font-family: inherit;
          cursor: pointer;
          padding-right: 4px;
        }
        .gl-sort-select option { background: hsl(217 33% 17%); }

        /* view toggle */
        .gl-view-toggle {
          display: flex;
          background: hsl(217 33% 17%);
          border: 1px solid rgba(99,102,241,0.18);
          border-radius: 12px;
          overflow: hidden;
        }
        .gl-view-btn {
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: hsl(215 20% 50%);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .gl-view-btn.active {
          background: rgba(99,102,241,0.2);
          color: #a5b4fc;
        }
        .gl-view-btn:hover:not(.active) { background: rgba(99,102,241,0.08); }

        /* filter toggle (mobile) */
        .gl-filter-toggle-btn {
          display: none;
          align-items: center;
          gap: 8px;
          background: hsl(217 33% 17%);
          border: 1px solid rgba(99,102,241,0.25);
          color: hsl(214 32% 85%);
          border-radius: 12px;
          padding: 8px 16px;
          font-size: 0.875rem;
          font-family: inherit;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .gl-filter-toggle-btn:hover { border-color: rgba(99,102,241,0.5); }
        .gl-filter-badge {
          background: #6366f1;
          color: white;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          margin-left: 2px;
        }
        @media (max-width: 768px) {
          .gl-filter-toggle-btn { display: flex; }
        }

        /* ── active filter pills ── */
        .gl-active-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
          align-items: center;
        }
        .gl-filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 999px;
          color: #a5b4fc;
          font-size: 12px;
          font-weight: 500;
        }
        .gl-filter-pill button {
          background: none;
          border: none;
          color: #a5b4fc;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .gl-filter-pill button:hover { opacity: 1; }
        .gl-clear-all-btn {
          background: none;
          border: none;
          color: hsl(215 20% 55%);
          font-size: 12px;
          cursor: pointer;
          text-decoration: underline;
          font-family: inherit;
          transition: color 0.2s;
        }
        .gl-clear-all-btn:hover { color: hsl(215 20% 75%); }

        /* ── body layout ── */
        .gl-body {
          display: flex;
          gap: 28px;
          align-items: flex-start;
        }

        /* ── SIDEBAR ── */
        .gl-sidebar {
          width: 260px;
          flex-shrink: 0;
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 20px;
          padding: 24px;
          position: sticky;
          top: 90px;
          max-height: calc(100vh - 110px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(99,102,241,0.3) transparent;
        }
        .gl-sidebar::-webkit-scrollbar { width: 4px; }
        .gl-sidebar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }

        @media (max-width: 768px) {
          .gl-sidebar {
            display: none;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100%;
            border-radius: 0;
            z-index: 100;
            max-height: 100vh;
          }
          .gl-sidebar.gl-sidebar-open { display: block; }
        }

        .gl-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(99,102,241,0.12);
        }
        .gl-sidebar-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gl-sidebar-title {
          font-size: 1rem;
          font-weight: 700;
          color: hsl(214 32% 91%);
          margin: 0;
        }
        .gl-sidebar-badge {
          font-size: 10px;
          padding: 2px 8px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 999px;
          color: #a5b4fc;
          font-weight: 600;
        }
        .gl-sidebar-clear {
          background: none;
          border: none;
          color: #a5b4fc;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
          text-decoration: underline;
          transition: opacity 0.2s;
        }
        .gl-sidebar-clear:hover { opacity: 0.7; }

        .gl-filter-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(99,102,241,0.08);
        }
        .gl-filter-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .gl-filter-label {
          font-size: 10px;
          font-weight: 700;
          color: hsl(215 20% 50%);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 12px;
        }

        /* categories */
        .gl-cat-list { display: flex; flex-direction: column; gap: 4px; }
        .gl-cat-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: hsl(215 20% 60%);
          font-size: 0.85rem;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.2s;
        }
        .gl-cat-btn:hover {
          background: rgba(99,102,241,0.08);
          color: hsl(214 32% 85%);
        }
        .gl-cat-btn.active {
          background: rgba(99,102,241,0.15);
          color: var(--cat-c, #a5b4fc);
          font-weight: 600;
          border: 1px solid rgba(99,102,241,0.25);
        }

        /* price */
        .gl-price-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .gl-price-divider { color: hsl(215 20% 50%); font-size: 0.875rem; }
        .gl-price-field {
          flex: 1;
          display: flex;
          align-items: center;
          background: hsl(217 33% 11%);
          border: 1px solid rgba(99,102,241,0.18);
          border-radius: 10px;
          padding: 0 10px;
          transition: border-color 0.2s;
        }
        .gl-price-field:focus-within {
          border-color: rgba(99,102,241,0.4);
        }
        .gl-price-prefix {
          color: hsl(215 20% 50%);
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .gl-price-input {
          background: transparent;
          border: none;
          outline: none;
          color: hsl(214 32% 85%);
          font-size: 0.85rem;
          font-family: inherit;
          width: 100%;
          padding: 9px 6px;
        }
        .gl-price-input::-webkit-outer-spin-button,
        .gl-price-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .gl-price-error {
          color: #f87171;
          font-size: 11px;
          margin: 0 0 8px;
        }
        .gl-apply-btn {
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }
        .gl-apply-btn:hover { opacity: 0.9; transform: scale(1.01); }

        /* delivery */
        .gl-delivery-list { display: flex; flex-direction: column; gap: 4px; }
        .gl-delivery-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: hsl(215 20% 60%);
          font-size: 0.85rem;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.2s;
        }
        .gl-delivery-btn:hover {
          background: rgba(99,102,241,0.08);
          color: hsl(214 32% 85%);
        }
        .gl-delivery-btn.active {
          background: rgba(99,102,241,0.15);
          color: #a5b4fc;
          font-weight: 600;
          border: 1px solid rgba(99,102,241,0.25);
        }

        /* ── content ── */
        .gl-content { flex: 1; min-width: 0; }

        .gl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 22px;
        }
        .gl-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* states */
        .gl-error-state, .gl-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 80px 24px;
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 24px;
        }
        .gl-error-icon { font-size: 3rem; margin-bottom: 16px; }
        .gl-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: rgba(99,102,241,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a5b4fc;
          margin-bottom: 20px;
        }
        .gl-empty-title, .gl-error-state h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(214 32% 91%);
          margin: 0 0 8px;
        }
        .gl-empty-sub, .gl-error-state p {
          color: hsl(215 20% 55%);
          font-size: 0.9rem;
          max-width: 360px;
          margin: 0;
          line-height: 1.6;
        }
        .gl-retry-btn {
          margin-top: 20px;
          padding: 10px 28px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .gl-retry-btn:hover { opacity: 0.9; }

        /* pagination */
        .gl-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 48px;
          flex-wrap: wrap;
        }
        .gl-page-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: hsl(217 33% 17%);
          border: 1px solid rgba(99,102,241,0.18);
          border-radius: 12px;
          color: hsl(214 32% 75%);
          font-size: 0.875rem;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }
        .gl-page-nav:hover:not(:disabled) {
          background: rgba(99,102,241,0.12);
          border-color: rgba(99,102,241,0.35);
          color: #a5b4fc;
        }
        .gl-page-nav:disabled { opacity: 0.4; cursor: not-allowed; }
        .gl-page-nums { display: flex; align-items: center; gap: 4px; }
        .gl-page-num {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid rgba(99,102,241,0.12);
          background: hsl(217 33% 17%);
          color: hsl(214 32% 75%);
          font-size: 0.875rem;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }
        .gl-page-num:hover:not(.active) {
          background: rgba(99,102,241,0.1);
          border-color: rgba(99,102,241,0.3);
          color: #a5b4fc;
        }
        .gl-page-num.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: transparent;
          color: white;
          font-weight: 700;
        }
        .gl-page-ellipsis {
          width: 40px;
          text-align: center;
          color: hsl(215 20% 45%);
          font-size: 0.875rem;
        }

        /* responsive */
        @media (max-width: 768px) {
          .gl-body { flex-direction: column; }
          .gl-sidebar { position: static; width: 100%; max-height: none; }
          .gl-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default GigList;
