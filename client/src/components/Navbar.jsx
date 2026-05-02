import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Bell, Menu, X, User, LogOut, Wallet, PackageCheck, Briefcase } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/auth.api';
import { formatINR } from '../utils/formatCurrency';

const Navbar = () => {
  const { user, clearAuth, isAuthenticated } = useAuth();
  const updateUser = useAuthStore(s => s.updateUser);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Refresh wallet balance on mount and every 60s while logged in
  const { data: freshUser } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (freshUser) {
      updateUser({ walletBalance: freshUser.walletBalance });
    }
  }, [freshUser, updateUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gigs?search=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const closeAll = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  const walletBalance = user?.walletBalance ?? 0;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Left: Logo + Search */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2" onClick={closeAll}>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SkillPay
              </span>
            </Link>
            <div className="hidden md:block">
              <form onSubmit={handleSearch} className="relative w-80 xl:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Find services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-input bg-background px-10 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </form>
            </div>
          </div>

          {/* Right: Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <Link to="/gigs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Explore
            </Link>

            {user ? (
              <>
                {/* Role-specific nav links */}
                {user.role === 'student' && (
                  <>
                    <Link to="/student-dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/student/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5" /> Orders
                    </Link>
                  </>
                )}
                {user.role === 'client' && (
                  <>
                    <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/client/hires" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> My Hires
                    </Link>
                  </>
                )}

                {/* Wallet balance pill (students only — they have a wallet) */}
                {user.role === 'student' && (
                  <Link
                    to="/student/orders"
                    className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-400/10 hover:bg-green-400/20 border border-green-400/20 rounded-full px-3 py-1.5 transition-colors"
                    title="Your wallet balance"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    {formatINR(walletBalance)}
                  </Link>
                )}

                {/* Bell */}
                <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 rounded-full border border-border/50 p-1 pr-3 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&color=fff`}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{user.name?.split(' ')[0] || 'User'}</span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover shadow-xl py-1 z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-border/50">
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.role === 'student' && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-green-400">
                            <Wallet className="w-3 h-3" />
                            Balance: {formatINR(walletBalance)}
                          </div>
                        )}
                      </div>

                      {/* Menu items */}
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        onClick={closeAll}
                      >
                        <User className="h-4 w-4" /> Profile
                      </Link>

                      {user.role === 'student' && (
                        <>
                          <Link
                            to="/student/orders"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            onClick={closeAll}
                          >
                            <PackageCheck className="h-4 w-4" /> My Orders
                          </Link>
                          <Link
                            to="/student/my-gigs"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            onClick={closeAll}
                          >
                            <Briefcase className="h-4 w-4" /> My Gigs
                          </Link>
                        </>
                      )}

                      {user.role === 'client' && (
                        <Link
                          to="/client/hires"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          onClick={closeAll}
                        >
                          <Briefcase className="h-4 w-4" /> My Hires
                        </Link>
                      )}

                      <div className="border-t border-border/50 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {user?.role === 'student' && (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2.5 py-1">
                <Wallet className="w-3 h-3" /> {formatINR(walletBalance)}
              </span>
            )}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-muted-foreground">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background px-4 py-4 space-y-1">
          <form onSubmit={handleSearch} className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Find services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-input bg-background px-10 py-2 text-sm text-foreground focus:outline-none"
            />
          </form>

          <Link to="/gigs" onClick={closeAll} className="block px-2 py-2.5 text-sm font-medium text-foreground hover:text-primary">Explore</Link>

          {user ? (
            <>
              {user.role === 'student' && (
                <>
                  <Link to="/student-dashboard" onClick={closeAll} className="block px-2 py-2.5 text-sm font-medium text-foreground hover:text-primary">Dashboard</Link>
                  <Link to="/student/orders" onClick={closeAll} className="block px-2 py-2.5 text-sm font-medium text-foreground hover:text-primary">My Orders</Link>
                  <Link to="/student/my-gigs" onClick={closeAll} className="block px-2 py-2.5 text-sm font-medium text-foreground hover:text-primary">My Gigs</Link>
                </>
              )}
              {user.role === 'client' && (
                <>
                  <Link to="/dashboard" onClick={closeAll} className="block px-2 py-2.5 text-sm font-medium text-foreground hover:text-primary">Dashboard</Link>
                  <Link to="/client/hires" onClick={closeAll} className="block px-2 py-2.5 text-sm font-medium text-foreground hover:text-primary">My Hires</Link>
                </>
              )}
              <Link to="/profile" onClick={closeAll} className="block px-2 py-2.5 text-sm font-medium text-foreground hover:text-primary">Profile</Link>
              <button onClick={handleLogout} className="block w-full text-left px-2 py-2.5 text-sm font-medium text-destructive">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeAll} className="block px-2 py-2.5 text-sm font-medium text-foreground">Sign In</Link>
              <Link to="/register" onClick={closeAll} className="block px-2 py-2.5 text-sm font-medium text-primary">Join Now</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
