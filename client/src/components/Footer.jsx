import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/50 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SkillPay
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6">
              Empowering students to showcase their skills and helping clients find the perfect university talent for their projects.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Discover</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/gigs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Explore Services
                </Link>
              </li>
              <li>
                <Link to="/gigs?category=Programming%20%26%20Tech" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Programming & Tech
                </Link>
              </li>
              <li>
                <Link to="/gigs?category=Graphics%20%26%20Design" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Graphics & Design
                </Link>
              </li>
              <li>
                <Link to="/gigs?category=Writing%20%26%20Translation" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Writing & Translation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Clients</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  How to Hire
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Client Dashboard
                </Link>
              </li>
              <li>
                <Link to="/client/my-hires" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  My Hires
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Students</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Become a Freelancer
                </Link>
              </li>
              <li>
                <Link to="/student-dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/student/create-gig" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Create a Gig
                </Link>
              </li>
              <li>
                <Link to="/student/wallet" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Wallet & Earnings
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SkillPay. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
