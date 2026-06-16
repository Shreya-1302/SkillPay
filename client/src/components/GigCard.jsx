import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, BadgeCheck } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';

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

const GigCard = ({ gig, listMode = false }) => {
  const catColor = CAT_COLORS[gig.category] || '#6366f1';

  if (listMode) {
    /* ── LIST VIEW ── */
    return (
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
        style={{ '--gc': catColor }}
        className="gc-list-card"
      >
        {/* thumbnail */}
        <Link to={`/gigs/${gig._id}`} className="gc-list-thumb">
          <img
            src={gig.portfolioImages?.[0] || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80'}
            alt={gig.title}
            className="gc-list-img"
          />
        </Link>

        {/* body */}
        <div className="gc-list-body">
          <div className="gc-list-top">
            <span className="gc-cat-badge" style={{ background: `${catColor}18`, color: catColor, borderColor: `${catColor}30` }}>
              {gig.category}
            </span>
            <div className="gc-rating">
              <Star className="gc-star" />
              <span>{gig.avgRating > 0 ? gig.avgRating.toFixed(1) : 'New'}</span>
            </div>
          </div>

          <Link to={`/gigs/${gig._id}`}>
            <h3 className="gc-list-title">{gig.title}</h3>
          </Link>

          <p className="gc-list-desc">{gig.description?.slice(0, 120)}{gig.description?.length > 120 ? '…' : ''}</p>

          <div className="gc-list-footer">
            <div className="gc-seller">
              <img
                src={gig.studentId?.avatar || `https://ui-avatars.com/api/?name=${gig.studentId?.name || 'S'}&background=6366f1&color=fff`}
                alt={gig.studentId?.name}
                className="gc-seller-avatar"
              />
              <span className="gc-seller-name">{gig.studentId?.name || 'Anonymous Student'}</span>
              <BadgeCheck className="gc-verified" />
            </div>

            <div className="gc-list-meta">
              <span className="gc-delivery">
                <Clock className="w-3.5 h-3.5" />
                {gig.deliveryDays} days
              </span>
              <div className="gc-price-block">
                <span className="gc-price-label">Starting at</span>
                <span className="gc-price">{formatINR(gig.basePrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── GRID VIEW (default) ── */
  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: `0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px ${catColor}40` }}
      transition={{ duration: 0.25 }}
      style={{ '--gc': catColor }}
      className="gc-card"
    >
      {/* image */}
      <Link to={`/gigs/${gig._id}`} className="gc-img-wrap">
        <img
          src={gig.portfolioImages?.[0] || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80'}
          alt={gig.title}
          className="gc-img"
        />
        {/* overlay on hover */}
        <div className="gc-img-overlay" />
        {/* rating badge */}
        <div className="gc-rating-badge">
          <Star className="gc-star-sm" />
          <span>{gig.avgRating > 0 ? gig.avgRating.toFixed(1) : 'New'}</span>
        </div>
      </Link>

      {/* body */}
      <div className="gc-body">
        {/* category */}
        <span className="gc-cat-badge" style={{ background: `${catColor}18`, color: catColor, borderColor: `${catColor}30` }}>
          {gig.category}
        </span>

        {/* title */}
        <Link to={`/gigs/${gig._id}`}>
          <h3 className="gc-title">{gig.title}</h3>
        </Link>

        {/* seller */}
        <div className="gc-seller">
          <img
            src={gig.studentId?.avatar || `https://ui-avatars.com/api/?name=${gig.studentId?.name || 'S'}&background=6366f1&color=fff`}
            alt={gig.studentId?.name}
            className="gc-seller-avatar"
          />
          <span className="gc-seller-name">{gig.studentId?.name || 'Anonymous Student'}</span>
          <BadgeCheck className="gc-verified" />
        </div>

        {/* footer */}
        <div className="gc-footer">
          <span className="gc-delivery">
            <Clock className="w-3.5 h-3.5" />
            {gig.deliveryDays} days
          </span>
          <div className="gc-price-block">
            <span className="gc-price-label">Starting at</span>
            <span className="gc-price">{formatINR(gig.basePrice)}</span>
          </div>
        </div>
      </div>

      {/* color accent bar */}
      <div className="gc-accent-bar" style={{ background: `linear-gradient(90deg, ${catColor}, ${catColor}80)` }} />

      <style>{`
        .gc-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.25s;
          cursor: pointer;
          font-family: Georgia, 'Times New Roman', Times, serif;
        }
        .gc-card:hover { border-color: var(--gc, #6366f1); }

        /* image */
        .gc-img-wrap {
          display: block;
          aspect-ratio: 16/10;
          overflow: hidden;
          position: relative;
        }
        .gc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .gc-card:hover .gc-img { transform: scale(1.06); }
        .gc-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(15,23,42,0.6) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .gc-card:hover .gc-img-overlay { opacity: 1; }

        .gc-rating-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(6px);
          color: #fbbf24;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid rgba(251,191,36,0.3);
        }
        .gc-star-sm { width: 13px; height: 13px; fill: #fbbf24; color: #fbbf24; }

        /* body */
        .gc-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 16px;
          gap: 10px;
        }

        .gc-cat-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid transparent;
          width: fit-content;
          letter-spacing: 0.02em;
        }

        .gc-title {
          font-size: 1rem;
          font-weight: 700;
          color: hsl(214 32% 88%);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s;
          margin: 0;
        }
        .gc-card:hover .gc-title { color: var(--gc, #a5b4fc); }

        .gc-seller {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: auto;
        }
        .gc-seller-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(99,102,241,0.3);
          flex-shrink: 0;
        }
        .gc-seller-name {
          font-size: 0.8rem;
          color: hsl(215 20% 60%);
          font-weight: 500;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gc-verified { width: 14px; height: 14px; color: #6366f1; flex-shrink: 0; }

        /* footer */
        .gc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid rgba(99,102,241,0.1);
        }
        .gc-delivery {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          color: hsl(215 20% 55%);
        }
        .gc-price-block { text-align: right; }
        .gc-price-label {
          display: block;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: hsl(215 20% 50%);
          font-weight: 600;
        }
        .gc-price {
          font-size: 1.1rem;
          font-weight: 800;
          color: hsl(214 32% 91%);
        }

        /* accent bar */
        .gc-accent-bar {
          height: 3px;
          width: 100%;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .gc-card:hover .gc-accent-bar { opacity: 1; }

        /* ── LIST CARD ── */
        .gc-list-card {
          display: flex;
          gap: 0;
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 18px;
          overflow: hidden;
          transition: all 0.25s;
          font-family: Georgia, 'Times New Roman', Times, serif;
          border-left: 3px solid var(--gc, #6366f1);
        }
        .gc-list-card:hover {
          border-color: var(--gc, #6366f1);
          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        }
        .gc-list-thumb {
          display: block;
          width: 180px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .gc-list-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .gc-list-card:hover .gc-list-img { transform: scale(1.05); }

        .gc-list-body {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .gc-list-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .gc-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 700;
          color: #fbbf24;
        }
        .gc-star { width: 14px; height: 14px; fill: #fbbf24; color: #fbbf24; flex-shrink: 0; }
        .gc-list-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: hsl(214 32% 88%);
          line-height: 1.4;
          margin: 0;
          transition: color 0.2s;
        }
        .gc-list-card:hover .gc-list-title { color: var(--gc, #a5b4fc); }
        .gc-list-desc {
          font-size: 0.825rem;
          color: hsl(215 20% 55%);
          line-height: 1.6;
          margin: 0;
        }
        .gc-list-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid rgba(99,102,241,0.08);
          flex-wrap: wrap;
        }
        .gc-list-meta {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        @media (max-width: 520px) {
          .gc-list-thumb { width: 120px; }
        }
      `}</style>
    </motion.div>
  );
};

export default GigCard;
