import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Zap, Shield, Sparkles, Code, Paintbrush, PenTool, Video, Music, Briefcase, PlusCircle, UserCheck, CreditCard, Users, ShieldCheck, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { getGigs, getPopularTags } from '../api/gig.api';
import GigCard from '../components/GigCard';
import Skeleton from '../components/ui/Skeleton';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: gigsData, isLoading } = useQuery({
    queryKey: ['featuredGigs'],
    queryFn: () => getGigs({ limit: 4, sort: 'rating_desc' }),
  });

  const { data: popularTags } = useQuery({
    queryKey: ['popularTags'],
    queryFn: getPopularTags,
  });

  const visualCategories = [
    { name: 'Programming & Tech', icon: Code },
    { name: 'Graphics & Design', icon: Paintbrush },
    { name: 'Writing & Translation', icon: PenTool },
    { name: 'Video & Animation', icon: Video },
    { name: 'Music & Audio', icon: Music },
    { name: 'Business', icon: Briefcase },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gigs?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6"
              >
                Find the right <span className="text-primary inline-block">freelance</span> service, right away
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-lg text-muted-foreground mb-8 max-w-2xl"
              >
                Connect with talented students for your projects. Quality work, flexible pricing, and a secure platform.
              </motion.p>
              
              <motion.form 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onSubmit={handleSearch} 
                className="relative flex items-center max-w-2xl bg-card rounded-full p-2 border border-border shadow-lg"
              >
                <Search className="absolute left-6 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="What service are you looking for today?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-14 py-3 text-foreground focus:outline-none"
                />
                <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-medium transition-colors">
                  Search
                </button>
              </motion.form>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8 flex flex-wrap items-center gap-2"
              >
                <span className="text-sm font-medium text-muted-foreground mr-2">Popular:</span>
                {popularTags?.map(cat => (
                  <Link key={cat} to={`/gigs?search=${encodeURIComponent(cat)}`} className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors">
                    {cat}
                  </Link>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trust Stats Bar */}
        <section className="border-y border-border/50 bg-card/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-wrap justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <span className="font-medium text-muted-foreground">500+ Active Students</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <span className="font-medium text-muted-foreground">Secure Escrow Payments</span>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="font-medium text-muted-foreground">College Verified Talent</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-10">How it works</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <PlusCircle className="h-8 w-8" />
                </div>
                <h3 className="font-bold mb-2">1. Post a gig or Search</h3>
                <p className="text-sm text-muted-foreground">Find exactly what you need or post your requirements.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <UserCheck className="h-8 w-8" />
                </div>
                <h3 className="font-bold mb-2">2. Hire</h3>
                <p className="text-sm text-muted-foreground">Review portfolios, compare prices, and hire the best fit.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <CreditCard className="h-8 w-8" />
                </div>
                <h3 className="font-bold mb-2">3. Pay Safely</h3>
                <p className="text-sm text-muted-foreground">Payment is held in escrow until you approve the work.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-card/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {visualCategories.map((cat, index) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link 
                      to={`/gigs?category=${encodeURIComponent(cat.name)}`}
                      className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-md transition-all group text-center h-full"
                    >
                      <Icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{cat.name}</h3>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Gigs Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold">Featured Services</h2>
              <Link to="/gigs" className="flex items-center text-primary font-medium hover:underline">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-80 w-full" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <div className="col-span-full text-center py-20 text-muted-foreground">
                    No gigs found. Check back later!
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card/30 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Fast Delivery</h3>
                <p className="text-muted-foreground">Get your projects done quickly with our motivated student freelancers.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-6 text-accent">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Secure Payments</h3>
                <p className="text-muted-foreground">Your money is held securely until you approve the final work.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 text-secondary">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Quality Work</h3>
                <p className="text-muted-foreground">Access top talent from universities, ready to showcase their skills.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
