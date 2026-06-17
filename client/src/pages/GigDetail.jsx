import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Clock, Calendar, CheckCircle2, AlertCircle, MessageSquare, ArrowLeft } from 'lucide-react';
import { getGigById } from '../api/gig.api';
import { getReviewsByGig } from '../api/review.api';
import { formatINR } from '../utils/formatCurrency';
import { formatDate, timeAgo } from '../utils/formatDate';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Skeleton from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import StarRating from '../components/ui/StarRating';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import RazorpayCheckout from '../components/RazorpayCheckout';
import Footer from '../components/Footer';

const GigDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [requirements, setRequirements] = useState('');

  const { data: gig, isLoading, isError } = useQuery({
    queryKey: ['gig', id],
    queryFn: () => getGigById(id),
  });

  const { data: reviewsRes, isLoading: reviewsLoading } = useQuery({
    queryKey: ['gigReviews', id],
    queryFn: () => getReviewsByGig(id),
    enabled: !!id,
  });

  const reviews = reviewsRes?.data || [];
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-8">
              <Skeleton className="h-20 w-3/4" />
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <aside className="w-full lg:w-96 shrink-0">
              <Skeleton className="h-[400px] w-full" />
            </aside>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !gig) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Service Not Found</h2>
          <p className="text-muted-foreground mb-6">The service you are looking for does not exist or has been removed.</p>
          <Link to="/gigs" className="bg-primary px-6 py-2 rounded-full text-primary-foreground font-medium">
            Browse Gigs
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?._id === gig.student?._id;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors shrink-0 cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left Column ── */}
          <div className="flex-1 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary">{gig.category}</Badge>
                {gig.status === 'active' ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="warning">Paused</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{gig.title}</h1>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-secondary overflow-hidden">
                    <img
                      src={gig.student?.avatar || `https://ui-avatars.com/api/?name=${gig.student?.name || 'S'}&background=random`}
                      alt={gig.student?.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="font-medium">{gig.student?.name}</span>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-1 text-yellow-500 font-medium">
                    <Star className="h-4 w-4 fill-current" />
                    <span>{avgRating}</span>
                    <span className="text-muted-foreground text-xs">({reviews.length})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Image Gallery */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-video w-full rounded-2xl overflow-hidden bg-secondary border border-border/50"
              >
                <img
                  src={gig.portfolioImages?.[activeImage] || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'}
                  alt="Gig Presentation"
                  className="h-full w-full object-cover"
                />
              </motion.div>

              {gig.portfolioImages && gig.portfolioImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {gig.portfolioImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative shrink-0 h-20 w-32 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImage === idx ? 'border-primary shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold mb-4">About This Service</h2>
              <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                {gig.description}
              </div>
            </div>

            {/* Tags */}
            {gig.tags && gig.tags.length > 0 && (
              <div className="pt-2">
                <h3 className="font-bold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {gig.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="bg-secondary/20">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* ── Reviews Section ── */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Reviews
                </h2>
                {avgRating && (
                  <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-yellow-400">{avgRating}</span>
                    <span className="text-muted-foreground text-xs">/ 5 ({reviews.length})</span>
                  </div>
                )}
              </div>

              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-card border border-border/50 rounded-2xl p-8 text-center text-muted-foreground">
                  <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No reviews yet</p>
                  <p className="text-sm mt-1">Be the first to review this service.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <motion.div
                      key={review._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border/50 rounded-2xl p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden shrink-0">
                          <img
                            src={review.clientId?.avatar || `https://ui-avatars.com/api/?name=${review.clientId?.name || 'C'}&background=random`}
                            alt={review.clientId?.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{review.clientId?.name || 'Anonymous'}</span>
                            <span className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</span>
                          </div>
                          <StarRating value={review.rating} readOnly />
                          {review.comment && (
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column — Pricing & Hire ── */}
          <aside className="w-full lg:w-96 shrink-0">
            <div className="sticky top-24 space-y-6">

              {/* Pricing Box */}
              <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-foreground">Project Details</h3>
                  <span className="text-2xl font-bold text-primary">{formatINR(gig.basePrice)}</span>
                </div>

                <div className="space-y-4 mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-foreground" />
                    <span><strong className="text-foreground">{gig.deliveryDays} Days</strong> Delivery</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-foreground" />
                    <span>Includes <strong>{gig.revisions || 1} Revisions</strong></span>
                  </div>
                </div>

                {!isOwner ? (
                  gig.status === 'active' ? (
                    <button
                      onClick={() => setIsHireModalOpen(true)}
                      className="flex w-full justify-center items-center gap-2 bg-primary text-primary-foreground py-3 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
                    >
                      Hire Now
                    </button>
                  ) : (
                    <div className="text-center py-3 bg-secondary/50 rounded-full text-muted-foreground font-medium">
                      This service is currently unavailable
                    </div>
                  )
                ) : (
                  <Link
                    to={`/student/edit-gig/${gig._id}`}
                    className="flex w-full justify-center items-center gap-2 bg-secondary text-secondary-foreground py-3 rounded-full font-bold hover:bg-secondary/80 transition-colors"
                  >
                    Edit Your Service
                  </Link>
                )}
              </div>

              {/* Student Profile Box */}
              <div className="bg-card rounded-2xl border border-border/50 p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden mx-auto mb-4 border-2 border-border/50">
                  <img
                    src={gig.student?.avatar || `https://ui-avatars.com/api/?name=${gig.student?.name || 'S'}&background=random`}
                    alt={gig.student?.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold mb-4">{gig.student?.name}</h3>

                <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Rating</p>
                    <div className="flex items-center justify-center gap-1 font-semibold">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span>{avgRating || gig.rating || 'New'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Joined</p>
                    <p className="font-semibold">{formatDate(gig.student?.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Modal
        isOpen={isHireModalOpen}
        onClose={() => setIsHireModalOpen(false)}
        title={`Hire for: ${gig.title}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Requirements</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[120px]"
              placeholder="Describe what you need the freelancer to do in detail..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>
          <RazorpayCheckout
            gigId={gig._id}
            gigTitle={gig.title}
            amount={gig.basePrice}
            requirements={requirements}
            onSuccess={(orderId) => {
              setIsHireModalOpen(false);
              navigate(`/orders/${orderId}`);
            }}
          />
        </div>
      </Modal>

      <Footer />
    </div>
  );
};

export default GigDetail;
