import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SkillPay
              </span>
            </Link>
            
            <div className="hidden md:block">
              <form onSubmit={handleSearch} className="relative w-96">
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

          <div className="hidden md:flex items-center gap-6">
            <Link to="/gigs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Explore
            </Link>
            
            {user ? (
              <>
                {user.role === 'student' && (
                  <Link to="/student-dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                )}
                {user.role === 'client' && (
                  <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                )}
                
                <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"></span>
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 rounded-full border border-border/50 p-1 pr-2 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=random`} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{user.name?.split(' ')[0] || 'User'}</span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-popover shadow-lg py-1">
                      <div className="px-4 py-2 border-b border-border/50">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground" onClick={() => setIsProfileOpen(false)}>
                        <User className="h-4 w-4" /> Profile
                      </Link>
                      {user.role === 'student' && (
                        <Link to="/student/my-gigs" className="block px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground" onClick={() => setIsProfileOpen(false)}>
                          My Gigs
                        </Link>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
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

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-muted-foreground">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background px-4 py-4 space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Find services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-input bg-background px-10 py-2 text-sm text-foreground focus:outline-none"
            />
          </form>
          
          <div className="flex flex-col space-y-2">
            <Link to="/gigs" onClick={() => setIsMenuOpen(false)} className="px-2 py-2 text-sm font-medium text-foreground">Explore</Link>
            
            {user ? (
              <>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="px-2 py-2 text-sm font-medium text-foreground">Profile</Link>
                {user.role === 'student' && (
                  <Link to="/student/my-gigs" onClick={() => setIsMenuOpen(false)} className="px-2 py-2 text-sm font-medium text-foreground">My Gigs</Link>
                )}
                <button onClick={handleLogout} className="text-left px-2 py-2 text-sm font-medium text-destructive">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="px-2 py-2 text-sm font-medium text-foreground">Sign In</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="px-2 py-2 text-sm font-medium text-primary">Join Now</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
