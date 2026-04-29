import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';
import Badge from './ui/Badge';

const GigCard = ({ gig }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-lg hover:border-primary/50"
    >
      <Link to={`/gigs/${gig._id}`} className="block aspect-[4/3] overflow-hidden">
        <img
          src={gig.portfolioImages?.[0] || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80'}
          alt={gig.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="secondary" className="font-medium">
            {gig.category}
          </Badge>
          <div className="flex items-center gap-1 text-sm font-medium text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span>{gig.rating || 'New'}</span>
          </div>
        </div>

        <Link to={`/gigs/${gig._id}`}>
          <h3 className="line-clamp-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {gig.title}
          </h3>
        </Link>

        <div className="mt-4 flex items-center gap-2">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-secondary">
            <img
              src={gig.student?.avatar || `https://ui-avatars.com/api/?name=${gig.student?.name || 'S'}&background=random`}
              alt={gig.student?.name}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground line-clamp-1">
            {gig.student?.name || 'Anonymous Student'}
          </span>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{gig.deliveryDays} Days</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Starting at</span>
            <span className="text-lg font-bold text-foreground">{formatINR(gig.basePrice)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GigCard;
