import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, Zap, Shield, Sparkles, Code, Paintbrush,
  PenTool, Video, Music, Briefcase, PlusCircle, UserCheck, CreditCard,
  Users, ShieldCheck, GraduationCap, Star, TrendingUp, ChevronRight,
  Award, Globe, CheckCircle
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { getGigs, getPopularTags } from '../api/gig.api';
import GigCard from '../components/GigCard';
import Skeleton from '../components/ui/Skeleton';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/* ─────────────────────────── animated counter ─────────────────────────── */
const AnimatedCounter = ({ target, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(current));
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ─────────────────────────── floating orb ─────────────────────────── */
const FloatingOrb = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
    animate={{ y: [0, -30, 0], scale: [1, 1.08, 1] }}
    transition={{ duration: 7 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

/* ─────────────────────────── typing effect ─────────────────────────── */
const words = ['freelance', 'student', 'creative', 'tech'];
const TypingWord = () => {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index];
    if (!deleting && displayed.length < word.length) {
      const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === word.length) {
      const t = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
    }
  }, [displayed, deleting, index]);

  return (
    <span className="hero-typing-word">
      {displayed}
      <span className="hero-cursor">|</span>
    </span>
  );
};

/* ─────────────────────────── testimonials ─────────────────────────── */
const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Startup Founder',
    avatar: 'PS',
    text: 'Found an amazing React developer in under 24 hours. The escrow system gave me total peace of mind — SkillPay is now my go-to for all dev work.',
    rating: 5,
  },
  {
    name: 'Arjun Mehta',
    role: 'CS Student, IIT Delhi',
    avatar: 'AM',
    text: 'I\'ve earned ₹45,000 in two months building projects for real clients. The platform is slick and payouts are always on time.',
    rating: 5,
  },
  {
    name: 'Tanvi Kapoor',
    role: 'Marketing Manager',
    avatar: 'TK',
    text: 'Hired a graphic designer for our brand refresh. The work was stellar at a fraction of agency cost. Highly recommend!',
    rating: 5,
  },
];

/* ══════════════════════════════════════════════════════════════════════ */
const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial((i) => (i + 1) % testimonials.length), 4500);
    return () => clearInterval(t);
  }, []);

  const { data: gigsData, isLoading } = useQuery({
    queryKey: ['featuredGigs'],
    queryFn: () => getGigs({ limit: 4, sort: 'rating_desc' }),
  });

  const { data: popularTags } = useQuery({
    queryKey: ['popularTags'],
    queryFn: getPopularTags,
  });

  const visualCategories = [
    { name: 'Programming & Tech', icon: Code, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { name: 'Graphics & Design', icon: Paintbrush, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    { name: 'Writing & Translation', icon: PenTool, color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
    { name: 'Video & Animation', icon: Video, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { name: 'Music & Audio', icon: Music, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { name: 'Business', icon: Briefcase, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/gigs?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="home-root">
      <Navbar />

      <main>
        {/* ══ HERO ══ */}
        <section ref={heroRef} className="home-hero">
          {/* background orbs */}
          <FloatingOrb className="w-[600px] h-[600px] bg-indigo-500 -top-40 -right-40" delay={0} />
          <FloatingOrb className="w-[400px] h-[400px] bg-purple-600 bottom-0 left-0" delay={2} />
          <FloatingOrb className="w-[300px] h-[300px] bg-emerald-500 top-1/2 left-1/3" delay={4} />

          {/* grid overlay */}
          <div className="home-hero-grid" />

          <motion.div className="home-hero-content" style={{ y: heroY, opacity: heroOpacity }}>
            {/* badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="home-hero-badge"
            >
              <Sparkles className="w-4 h-4" />
              <span>India's #1 Student Freelance Marketplace</span>
            </motion.div>

            {/* headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="home-hero-title"
            >
              Find the right{' '}
              <span className="home-hero-title-accent">
                <TypingWord />
              </span>
              {' '}service,{' '}
              <span className="home-hero-title-gradient">right away</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="home-hero-sub"
            >
              Connect with college-verified students for your projects. Quality work, flexible pricing, and secure escrow payments.
            </motion.p>

            {/* search bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onSubmit={handleSearch}
              className="home-hero-search"
            >
              <Search className="home-hero-search-icon" />
              <input
                type="text"
                placeholder="e.g. logo design, React app, video editing…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="home-hero-search-input"
              />
              <button type="submit" className="home-hero-search-btn">
                Search
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.form>

            {/* popular tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="home-hero-tags"
            >
              <span className="home-hero-tags-label">Popular:</span>
              {popularTags?.slice(0, 7).map((cat) => (
                <Link
                  key={cat}
                  to={`/gigs?search=${encodeURIComponent(cat)}`}
                  className="home-hero-tag"
                >
                  {cat}
                </Link>
              ))}
            </motion.div>
          </motion.div>

          {/* hero bottom wave */}
          <div className="home-hero-wave">
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
              <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="var(--home-bg)" />
            </svg>
          </div>
        </section>

        {/* ══ TRUST STATS ══ */}
        <section className="home-stats">
          {[
            { icon: Users, value: 500, suffix: '+', label: 'Active Students', color: '#6366f1' },
            { icon: ShieldCheck, value: 1200, suffix: '+', label: 'Orders Completed', color: '#a855f7' },
            { icon: GraduationCap, value: 30, suffix: '+', label: 'Top Colleges', color: '#10b981' },
            { icon: TrendingUp, value: 98, suffix: '%', label: 'Satisfaction Rate', color: '#f59e0b' },
          ].map(({ icon: Icon, value, suffix, label, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="home-stat-card"
            >
              <div className="home-stat-icon" style={{ background: `${color}20`, color }}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="home-stat-value">
                  <AnimatedCounter target={value} suffix={suffix} />
                </p>
                <p className="home-stat-label">{label}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section className="home-section home-hiw-section">
          <div className="home-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="home-section-header"
            >
              <span className="home-section-badge">Simple Process</span>
              <h2 className="home-section-title">How SkillPay works</h2>
              <p className="home-section-sub">Get your project done in three easy steps.</p>
            </motion.div>

            <div className="home-hiw-grid">
              {[
                {
                  icon: PlusCircle, step: '01', title: 'Post or Search',
                  desc: 'Browse hundreds of services or post exactly what you need.',
                  color: '#6366f1',
                },
                {
                  icon: UserCheck, step: '02', title: 'Hire the Best',
                  desc: 'Review portfolios, compare prices, and connect with top student talent.',
                  color: '#a855f7',
                },
                {
                  icon: CreditCard, step: '03', title: 'Pay Safely',
                  desc: 'Funds are held in escrow and released only when you approve the work.',
                  color: '#10b981',
                },
              ].map(({ icon: Icon, step, title, desc, color }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="home-hiw-card"
                >
                  <div className="home-hiw-step-num" style={{ color }}>{step}</div>
                  <div className="home-hiw-icon-wrap" style={{ background: `${color}15`, color }}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="home-hiw-title">{title}</h3>
                  <p className="home-hiw-desc">{desc}</p>
                  {i < 2 && <div className="home-hiw-connector" />}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CATEGORIES ══ */}
        <section className="home-section home-cat-section">
          <div className="home-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="home-section-header"
            >
              <span className="home-section-badge">Explore</span>
              <h2 className="home-section-title">Browse by Category</h2>
              <p className="home-section-sub">Find services across all the skills you need.</p>
            </motion.div>

            <div className="home-cat-grid">
              {visualCategories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -6 }}
                  >
                    <Link
                      to={`/gigs?category=${encodeURIComponent(cat.name)}`}
                      className="home-cat-card"
                      style={{ '--cat-color': cat.color, '--cat-bg': cat.bg }}
                    >
                      <div className="home-cat-icon-wrap">
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="home-cat-name">{cat.name}</span>
                      <ArrowRight className="home-cat-arrow" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ FEATURED GIGS ══ */}
        <section className="home-section home-gigs-section">
          <div className="home-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="home-gigs-header"
            >
              <div>
                <span className="home-section-badge">Hand-picked</span>
                <h2 className="home-section-title" style={{ marginTop: '8px', textAlign: 'left' }}>
                  Featured Services
                </h2>
              </div>
              <Link to="/gigs" className="home-gigs-viewall">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {isLoading ? (
              <div className="home-gigs-grid">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-80 w-full" />)}
              </div>
            ) : (
              <div className="home-gigs-grid">
                {gigsData?.gigs?.map((gig, idx) => (
                  <motion.div
                    key={gig._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <GigCard gig={gig} />
                  </motion.div>
                ))}
                {(!gigsData?.gigs || gigsData.gigs.length === 0) && (
                  <div className="home-gigs-empty">No gigs found. Check back later!</div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ══ TESTIMONIALS ══ */}
        <section className="home-section home-testimonials-section">
          <div className="home-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="home-section-header"
            >
              <span className="home-section-badge">Reviews</span>
              <h2 className="home-section-title">Loved by clients & students</h2>
            </motion.div>

            <div className="home-testimonials-wrap">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                  className="home-testimonial-card"
                >
                  <div className="home-testimonial-stars">
                    {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="home-testimonial-text">
                    "{testimonials[activeTestimonial].text}"
                  </p>
                  <div className="home-testimonial-author">
                    <div className="home-testimonial-avatar">
                      {testimonials[activeTestimonial].avatar}
                    </div>
                    <div>
                      <p className="home-testimonial-name">{testimonials[activeTestimonial].name}</p>
                      <p className="home-testimonial-role">{testimonials[activeTestimonial].role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="home-testimonial-dots">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`home-testimonial-dot ${i === activeTestimonial ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section className="home-section home-features-section">
          <div className="home-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="home-section-header"
            >
              <span className="home-section-badge">Why SkillPay</span>
              <h2 className="home-section-title">Built for trust & results</h2>
            </motion.div>

            <div className="home-features-grid">
              {[
                {
                  icon: Zap, color: '#f59e0b', title: 'Fast Delivery',
                  desc: 'Motivated student freelancers deliver on time, every time.',
                  perks: ['48-hr turnaround options', 'Real-time progress updates'],
                },
                {
                  icon: Shield, color: '#6366f1', title: 'Secure Payments',
                  desc: 'Funds are locked in escrow until you approve — zero risk.',
                  perks: ['Razorpay-powered', '100% refund guarantee'],
                },
                {
                  icon: Award, color: '#a855f7', title: 'Verified Talent',
                  desc: 'Every student is college-verified so you hire with confidence.',
                  perks: ['Portfolio reviewed', 'Skill-tested profiles'],
                },
                {
                  icon: Globe, color: '#10b981', title: 'Nationwide Reach',
                  desc: 'Access top talent from IITs, NITs, and leading universities.',
                  perks: ['30+ partner colleges', '6 major skill categories'],
                },
              ].map(({ icon: Icon, color, title, desc, perks }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="home-feature-card"
                >
                  <div className="home-feature-icon" style={{ background: `${color}15`, color }}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="home-feature-title">{title}</h3>
                  <p className="home-feature-desc">{desc}</p>
                  <ul className="home-feature-perks">
                    {perks.map((p) => (
                      <li key={p} className="home-feature-perk">
                        <CheckCircle className="w-4 h-4" style={{ color }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA BANNER ══ */}
        <section className="home-cta-section">
          <FloatingOrb className="w-[500px] h-[500px] bg-indigo-500 -top-20 -right-20" delay={1} />
          <FloatingOrb className="w-[300px] h-[300px] bg-purple-600 bottom-0 left-10" delay={3} />
          <div className="home-container home-cta-inner">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="home-cta-content"
            >
              <h2 className="home-cta-title">Ready to get started?</h2>
              <p className="home-cta-sub">
                Join thousands of clients and student freelancers already on SkillPay.
              </p>
              <div className="home-cta-actions">
                <Link to="/gigs" className="home-cta-btn-primary">
                  Find Talent <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/register" className="home-cta-btn-secondary">
                  Become a Freelancer
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />

      {/* scoped styles */}
      <style>{`
        /* ── root ── */
        .home-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--home-bg, hsl(222 47% 11%));
          --home-bg: hsl(222 47% 11%);
          font-family: Georgia, 'Times New Roman', Times, serif;
        }

        /* ── hero ── */
        .home-hero {
          position: relative;
          overflow: hidden;
          padding: 120px 24px 140px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .home-hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }
        .home-hero-content {
          position: relative;
          z-index: 10;
          max-width: 780px;
          margin: 0 auto;
          width: 100%;
        }

        .home-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          border: 1px solid rgba(99,102,241,0.4);
          background: rgba(99,102,241,0.1);
          color: #a5b4fc;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 28px;
          backdrop-filter: blur(8px);
        }

        .home-hero-title {
          font-size: clamp(2.4rem, 5vw, 4.2rem);
          font-weight: 800;
          line-height: 1.15;
          color: hsl(214 32% 91%);
          margin-bottom: 24px;
          letter-spacing: -0.02em;
        }
        .home-hero-title-accent {
          color: #a5b4fc;
          min-width: 180px;
          display: inline-block;
        }
        .hero-cursor {
          animation: blink 1s step-end infinite;
          color: #6366f1;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .home-hero-title-gradient {
          background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .home-hero-sub {
          font-size: 1.125rem;
          color: hsl(215 20% 65%);
          margin-bottom: 36px;
          max-width: 600px;
          line-height: 1.7;
        }

        /* search bar */
        .home-hero-search {
          display: flex;
          align-items: center;
          max-width: 640px;
          background: rgba(30,41,59,0.8);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 999px;
          padding: 6px 6px 6px 20px;
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.1);
          transition: box-shadow 0.3s, border-color 0.3s;
        }
        .home-hero-search:focus-within {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 8px 40px rgba(99,102,241,0.15), 0 0 0 3px rgba(99,102,241,0.08);
        }
        .home-hero-search-icon {
          width: 20px;
          height: 20px;
          color: hsl(215 20% 50%);
          flex-shrink: 0;
          margin-right: 10px;
        }
        .home-hero-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: hsl(214 32% 91%);
          font-size: 0.95rem;
          padding: 10px 0;
        }
        .home-hero-search-input::placeholder { color: hsl(215 20% 50%); }
        .home-hero-search-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 999px;
          padding: 12px 28px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .home-hero-search-btn:hover { opacity: 0.9; transform: scale(1.02); }

        /* tags */
        .home-hero-tags {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 24px;
        }
        .home-hero-tags-label {
          font-size: 13px;
          color: hsl(215 20% 55%);
          font-weight: 500;
        }
        .home-hero-tag {
          font-size: 12px;
          padding: 5px 14px;
          border-radius: 999px;
          border: 1px solid rgba(99,102,241,0.25);
          background: rgba(99,102,241,0.08);
          color: #a5b4fc;
          text-decoration: none;
          transition: all 0.2s;
        }
        .home-hero-tag:hover {
          background: rgba(99,102,241,0.2);
          border-color: rgba(99,102,241,0.5);
        }

        /* wave */
        .home-hero-wave {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 80px;
          z-index: 5;
        }
        .home-hero-wave svg { width: 100%; height: 100%; }

        /* ── stats ── */
        .home-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1px;
          background: rgba(99,102,241,0.1);
          border-top: 1px solid rgba(99,102,241,0.12);
          border-bottom: 1px solid rgba(99,102,241,0.12);
        }
        .home-stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 28px 32px;
          background: hsl(222 47% 11%);
          transition: background 0.2s;
        }
        .home-stat-card:hover { background: hsl(217 33% 14%); }
        .home-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .home-stat-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: hsl(214 32% 91%);
          line-height: 1;
        }
        .home-stat-label {
          font-size: 0.8rem;
          color: hsl(215 20% 55%);
          margin-top: 4px;
          font-weight: 500;
        }

        /* ── shared section ── */
        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          width: 100%;
        }
        .home-section {
          padding: 96px 0;
        }
        .home-section-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .home-section-badge {
          display: inline-block;
          padding: 5px 16px;
          border-radius: 999px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.25);
          color: #a5b4fc;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }
        .home-section-title {
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          font-weight: 800;
          color: hsl(214 32% 91%);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .home-section-sub {
          color: hsl(215 20% 55%);
          font-size: 1rem;
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ── how it works ── */
        .home-hiw-section { background: hsl(217 33% 14%); }
        .home-hiw-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 32px;
          position: relative;
        }
        .home-hiw-card {
          position: relative;
          background: hsl(217 33% 17%);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 20px;
          padding: 36px 28px;
          text-align: center;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .home-hiw-card:hover {
          border-color: rgba(99,102,241,0.3);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .home-hiw-step-num {
          font-size: 3.5rem;
          font-weight: 900;
          opacity: 0.08;
          position: absolute;
          top: 16px;
          right: 20px;
          line-height: 1;
        }
        .home-hiw-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .home-hiw-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: hsl(214 32% 91%);
          margin-bottom: 10px;
        }
        .home-hiw-desc {
          font-size: 0.9rem;
          color: hsl(215 20% 55%);
          line-height: 1.6;
        }
        .home-hiw-connector {
          display: none;
        }

        /* ── categories ── */
        .home-cat-section { background: hsl(222 47% 11%); }
        .home-cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 16px;
          align-items: stretch;
        }
        .home-cat-grid > div {
          display: flex;
          height: 100%;
        }
        .home-cat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 32px 20px;
          border-radius: 20px;
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.1);
          text-decoration: none;
          text-align: center;
          transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
        .home-cat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--cat-bg);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .home-cat-card:hover::before { opacity: 1; }
        .home-cat-card:hover {
          border-color: var(--cat-color, #6366f1);
          box-shadow: 0 0 0 1px var(--cat-color, #6366f1), 0 20px 40px rgba(0,0,0,0.2);
        }
        .home-cat-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: var(--cat-bg);
          color: var(--cat-color, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          transition: transform 0.3s;
        }
        .home-cat-card:hover .home-cat-icon-wrap { transform: scale(1.1); }
        .home-cat-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(214 32% 85%);
          position: relative;
          z-index: 1;
          transition: color 0.3s;
        }
        .home-cat-card:hover .home-cat-name { color: var(--cat-color, #6366f1); }
        .home-cat-arrow {
          width: 16px;
          height: 16px;
          color: hsl(215 20% 45%);
          opacity: 0;
          transform: translateX(-8px);
          transition: opacity 0.3s, transform 0.3s;
          position: relative;
          z-index: 1;
        }
        .home-cat-card:hover .home-cat-arrow {
          opacity: 1;
          transform: translateX(0);
          color: var(--cat-color, #6366f1);
        }

        /* ── featured gigs ── */
        .home-gigs-section { background: hsl(217 33% 14%); }
        .home-gigs-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .home-gigs-viewall {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #a5b4fc;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          padding: 10px 20px;
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 999px;
          transition: all 0.2s;
        }
        .home-gigs-viewall:hover {
          background: rgba(99,102,241,0.1);
          border-color: rgba(99,102,241,0.5);
        }
        .home-gigs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }
        .home-gigs-empty {
          grid-column: 1/-1;
          text-align: center;
          padding: 80px 0;
          color: hsl(215 20% 45%);
        }

        /* ── testimonials ── */
        .home-testimonials-section { background: hsl(222 47% 11%); }
        .home-testimonials-wrap {
          max-width: 640px;
          margin: 0 auto;
        }
        .home-testimonial-card {
          background: hsl(217 33% 17%);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 24px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .home-testimonial-stars {
          display: flex;
          justify-content: center;
          gap: 4px;
          margin-bottom: 20px;
        }
        .home-testimonial-text {
          font-size: 1.05rem;
          color: hsl(214 32% 80%);
          line-height: 1.7;
          margin-bottom: 28px;
          font-style: italic;
        }
        .home-testimonial-author {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }
        .home-testimonial-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          color: white;
          flex-shrink: 0;
        }
        .home-testimonial-name {
          font-weight: 700;
          color: hsl(214 32% 91%);
          font-size: 0.95rem;
        }
        .home-testimonial-role {
          color: hsl(215 20% 55%);
          font-size: 0.8rem;
          margin-top: 2px;
        }
        .home-testimonial-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 28px;
        }
        .home-testimonial-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: rgba(99,102,241,0.25);
          cursor: pointer;
          transition: all 0.3s;
          padding: 0;
        }
        .home-testimonial-dot.active {
          background: #6366f1;
          width: 24px;
          border-radius: 999px;
        }

        /* ── features ── */
        .home-features-section { background: hsl(217 33% 14%); }
        .home-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }
        .home-feature-card {
          background: hsl(217 33% 17%);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 20px;
          padding: 32px;
          transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
        }
        .home-feature-card:hover {
          border-color: rgba(99,102,241,0.25);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          transform: translateY(-4px);
        }
        .home-feature-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .home-feature-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: hsl(214 32% 91%);
          margin-bottom: 10px;
        }
        .home-feature-desc {
          font-size: 0.875rem;
          color: hsl(215 20% 55%);
          line-height: 1.6;
          margin-bottom: 18px;
        }
        .home-feature-perks { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .home-feature-perk {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.825rem;
          color: hsl(214 32% 75%);
        }

        /* ── cta ── */
        .home-cta-section {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, hsl(230 60% 14%), hsl(250 60% 16%));
          padding: 100px 24px;
        }
        .home-cta-inner {
          position: relative;
          z-index: 10;
        }
        .home-cta-content {
          text-align: center;
          max-width: 560px;
          margin: 0 auto;
        }
        .home-cta-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        .home-cta-sub {
          color: rgba(255,255,255,0.65);
          font-size: 1.05rem;
          margin-bottom: 36px;
          line-height: 1.6;
        }
        .home-cta-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .home-cta-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: #4f46e5;
          border-radius: 999px;
          padding: 14px 32px;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .home-cta-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
        .home-cta-btn-secondary {
          display: inline-flex;
          align-items: center;
          border: 2px solid rgba(255,255,255,0.3);
          color: white;
          border-radius: 999px;
          padding: 14px 32px;
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s;
        }
        .home-cta-btn-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.5); }
      `}</style>
    </div>
  );
};

export default Home;
