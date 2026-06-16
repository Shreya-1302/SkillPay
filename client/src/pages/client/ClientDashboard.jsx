import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, IndianRupee, CheckCircle2, Clock, ChevronRight,
  ArrowUpRight, Search, LayoutList, ListOrdered, User,
  Activity, TrendingUp, Package, AlertCircle, XCircle,
  PlusCircle, Star, ShoppingBag
} from 'lucide-react';
import { getMyOrdersClient } from '../../api/order.api';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Navbar from '../../components/Navbar';
import Skeleton from '../../components/ui/Skeleton';

/* ── status config ── */
const statusConfig = {
  in_escrow:       { label: 'In Escrow',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock },
  in_progress:     { label: 'In Progress',    color: '#6366f1', bg: 'rgba(99,102,241,0.12)',   icon: Activity },
  completed:       { label: 'Completed',      color: '#10b981', bg: 'rgba(16,185,129,0.12)',   icon: CheckCircle2 },
  cancelled:       { label: 'Cancelled',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    icon: XCircle },
  disputed:        { label: 'Disputed',       color: '#f97316', bg: 'rgba(249,115,22,0.12)',   icon: AlertCircle },
  pending_payment: { label: 'Pending Payment',color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: Clock },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
      className="cd-status-badge">
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

/* ── metric card ── */
const MetricCard = ({ icon: Icon, label, value, sub, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="cd-metric-card"
    style={{ '--g': gradient }}
  >
    <div className="cd-metric-icon"><Icon className="w-5 h-5" /></div>
    <div>
      <p className="cd-metric-label">{label}</p>
      <p className="cd-metric-value">{value}</p>
      {sub && <p className="cd-metric-sub">{sub}</p>}
    </div>
    <div className="cd-metric-glow" />
  </motion.div>
);

/* ── action card ── */
const ActionCard = ({ to, icon: Icon, label, desc, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -4 }}
  >
    <Link to={to} className="cd-action-card" style={{ '--ac': color }}>
      <div className="cd-action-icon" style={{ background: `${color}18`, color }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="cd-action-text">
        <span className="cd-action-label">{label}</span>
        <span className="cd-action-desc">{desc}</span>
      </div>
      <ArrowUpRight className="cd-action-arrow" />
    </Link>
  </motion.div>
);

/* ════════════════════════════════════════════════════════════ */
const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['clientOrders'],
    queryFn: getMyOrdersClient,
  });

  /* metrics */
  const activeOrders    = orders?.filter(o => ['in_escrow','in_progress'].includes(o.status)) || [];
  const completedOrders = orders?.filter(o => o.status === 'completed') || [];
  const pendingOrders   = orders?.filter(o => o.status === 'pending_payment') || [];
  const validSpent      = orders?.filter(o => !['cancelled','pending_payment'].includes(o.status)) || [];
  const totalSpent      = validSpent.reduce((sum, o) => sum + o.amount, 0);
  const uniqueStudents  = new Set((orders || []).map(o => o.student?._id).filter(Boolean)).size;

  /* tab filtering */
  const tabOrders = activeTab === 'all'       ? orders || []
    : activeTab === 'active'    ? activeOrders
    : activeTab === 'completed' ? completedOrders
    : pendingOrders;

  const recentOrders = (orders || []).slice(0, 4);

  return (
    <div className="cd-root">
      <Navbar />

      <div className="cd-layout">

        {/* ── SIDEBAR ── */}
        <aside className="cd-sidebar">
          <div className="cd-sidebar-inner">

            {/* profile */}
            <div className="cd-profile-block">
              <div className="cd-profile-avatar"><span>CL</span></div>
              <div>
                <p className="cd-profile-name">Client</p>
                <p className="cd-profile-role">Hiring Manager</p>
              </div>
            </div>

            {/* nav */}
            <nav className="cd-nav">
              {[
                { to: '/dashboard',       icon: TrendingUp,  label: 'Dashboard',  active: true },
                { to: '/client/my-hires', icon: ListOrdered, label: 'My Hires' },
                { to: '/gigs',            icon: Search,      label: 'Find Talent' },
                { to: '/profile',         icon: User,        label: 'Profile' },
              ].map(({ to, icon: Icon, label, active }) => (
                <Link key={to} to={to} className={`cd-nav-link ${active ? 'active' : ''}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                </Link>
              ))}
            </nav>

            {/* mini stats */}
            <div className="cd-sidebar-stats">
              <div className="cd-sidebar-stat">
                <span className="cd-sidebar-stat-num" style={{ color: '#6366f1' }}>{activeOrders.length}</span>
                <span className="cd-sidebar-stat-label">Active</span>
              </div>
              <div className="cd-sidebar-stat-divider" />
              <div className="cd-sidebar-stat">
                <span className="cd-sidebar-stat-num" style={{ color: '#10b981' }}>{completedOrders.length}</span>
                <span className="cd-sidebar-stat-label">Done</span>
              </div>
              <div className="cd-sidebar-stat-divider" />
              <div className="cd-sidebar-stat">
                <span className="cd-sidebar-stat-num" style={{ color: '#f59e0b' }}>{uniqueStudents}</span>
                <span className="cd-sidebar-stat-label">Freelancers</span>
              </div>
            </div>

            {/* find talent CTA */}
            <Link to="/gigs" className="cd-find-btn">
              <Search className="w-4 h-4" />
              Find Talent
            </Link>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="cd-main">

          {/* Page header */}
          <div className="cd-page-header">
            <div>
              <h1 className="cd-page-title">Client Dashboard</h1>
              <p className="cd-page-sub">Manage your projects and freelancers in one place.</p>
            </div>
            <Link to="/gigs" className="cd-browse-btn">
              <PlusCircle className="w-4 h-4" />
              New Hire
            </Link>
          </div>

          {/* Metric cards */}
          <div className="cd-metrics-grid">
            <MetricCard
              icon={Activity}
              label="Active Hires"
              value={activeOrders.length}
              sub="Currently in progress"
              gradient="linear-gradient(135deg,#6366f1,#8b5cf6)"
              delay={0}
            />
            <MetricCard
              icon={CheckCircle2}
              label="Completed"
              value={completedOrders.length}
              sub={`of ${orders?.length || 0} total projects`}
              gradient="linear-gradient(135deg,#10b981,#059669)"
              delay={0.08}
            />
            <MetricCard
              icon={IndianRupee}
              label="Total Spent"
              value={formatINR(totalSpent)}
              sub="Across all projects"
              gradient="linear-gradient(135deg,#f59e0b,#f97316)"
              delay={0.16}
            />
            <MetricCard
              icon={Star}
              label="Freelancers Hired"
              value={uniqueStudents}
              sub="Unique collaborators"
              gradient="linear-gradient(135deg,#ec4899,#a855f7)"
              delay={0.24}
            />
          </div>

          {/* Quick actions */}
          <div className="cd-actions-grid">
            <ActionCard to="/gigs"            icon={Search}      label="Browse Services"  desc="Find the right freelancer"    color="#6366f1" delay={0.1} />
            <ActionCard to="/client/my-hires" icon={ListOrdered} label="All My Hires"     desc="View complete order history"  color="#10b981" delay={0.18} />
            <ActionCard to="/profile"         icon={User}        label="My Profile"       desc="Update your client details"  color="#f59e0b" delay={0.26} />
          </div>

          {isLoading ? (
            <div className="cd-loading">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          ) : orders?.length === 0 ? (
            /* ── Empty state ── */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="cd-empty-state"
            >
              <div className="cd-empty-icon">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="cd-empty-title">Ready to start your first project?</h3>
              <p className="cd-empty-sub">
                Browse thousands of talented student freelancers and get your project done today.
              </p>
              <Link to="/gigs" className="cd-empty-btn">
                Browse Services <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <>
              {/* ── Active Orders spotlight ── */}
              {activeOrders.length > 0 && (
                <div className="cd-spotlight-card">
                  <div className="cd-spotlight-header">
                    <div>
                      <h2 className="cd-section-title">Active Projects</h2>
                      <p className="cd-section-sub">{activeOrders.length} project{activeOrders.length > 1 ? 's' : ''} currently in progress</p>
                    </div>
                    <Link to="/client/my-hires" className="cd-viewall-btn">
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="cd-active-grid">
                    {activeOrders.slice(0, 3).map((order, idx) => (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.07 }}
                      >
                        <Link to={`/orders/${order._id}`} className="cd-active-card">
                          <div className="cd-active-thumb">
                            <img
                              src={order.gig?.portfolioImages?.[0] || `https://ui-avatars.com/api/?name=${order.gig?.title || 'G'}&background=6366f1&color=fff`}
                              alt=""
                              className="cd-active-img"
                            />
                          </div>
                          <div className="cd-active-body">
                            <p className="cd-active-title">{order.gig?.title || 'Unknown Gig'}</p>
                            <div className="cd-active-meta">
                              <img
                                src={order.student?.avatar || `https://ui-avatars.com/api/?name=${order.student?.name || 'S'}&background=8b5cf6&color=fff`}
                                alt=""
                                className="cd-active-avatar"
                              />
                              <span className="cd-active-student">{order.student?.name}</span>
                            </div>
                            <div className="cd-active-footer">
                              <StatusBadge status={order.status} />
                              <span className="cd-active-amount">{formatINR(order.amount)}</span>
                            </div>
                          </div>
                          {order.deadline && (
                            <div className="cd-active-deadline">
                              <Clock className="w-3 h-3" />
                              Due {formatDate(order.deadline)}
                            </div>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── All Orders Table ── */}
              <div className="cd-table-card">
                <div className="cd-table-header">
                  <div>
                    <h2 className="cd-section-title">Order History</h2>
                    <p className="cd-section-sub">All your projects at a glance</p>
                  </div>
                  <Link to="/client/my-hires" className="cd-viewall-btn">
                    All hires <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Tab filters */}
                <div className="cd-tabs">
                  {[
                    { key: 'all',       label: `All (${orders?.length || 0})` },
                    { key: 'active',    label: `Active (${activeOrders.length})` },
                    { key: 'completed', label: `Completed (${completedOrders.length})` },
                    { key: 'pending',   label: `Pending (${pendingOrders.length})` },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`cd-tab ${activeTab === tab.key ? 'active' : ''}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="cd-table-wrap">
                  <table className="cd-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Freelancer</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabOrders.slice(0, 10).map((order, idx) => (
                        <motion.tr
                          key={order._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="cd-table-row"
                        >
                          <td>
                            <div className="cd-table-project">
                              <div className="cd-table-thumb">
                                <img
                                  src={order.gig?.portfolioImages?.[0] || `https://ui-avatars.com/api/?name=${order.gig?.title || 'G'}&background=6366f1&color=fff`}
                                  alt=""
                                  className="cd-table-thumb-img"
                                />
                              </div>
                              <Link to={`/orders/${order._id}`} className="cd-table-title">
                                {order.gig?.title || 'Unknown Gig'}
                              </Link>
                            </div>
                          </td>
                          <td>
                            <div className="cd-table-freelancer">
                              <img
                                src={order.student?.avatar || `https://ui-avatars.com/api/?name=${order.student?.name || 'S'}&background=8b5cf6&color=fff`}
                                alt=""
                                className="cd-table-avatar"
                              />
                              <span>{order.student?.name}</span>
                            </div>
                          </td>
                          <td className="cd-table-date">{formatDate(order.createdAt)}</td>
                          <td className="cd-table-amount">{formatINR(order.amount)}</td>
                          <td><StatusBadge status={order.status} /></td>
                          <td>
                            <Link to={`/orders/${order._id}`} className="cd-table-detail-btn">
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {tabOrders.length === 0 && (
                    <div className="cd-table-empty">
                      <Package className="w-8 h-8 opacity-30" />
                      <p>No orders in this category</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* ── Scoped Styles ── */}
      <style>{`
        .cd-root {
          min-height: 100vh;
          background: hsl(222 47% 11%);
          font-family: Georgia, 'Times New Roman', Times, serif;
        }
        .cd-layout { display: flex; min-height: calc(100vh - 64px); }

        /* ── SIDEBAR ── */
        .cd-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: hsl(217 33% 14%);
          border-right: 1px solid rgba(99,102,241,0.1);
          padding: 24px 16px;
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
          overflow-y: auto;
        }
        @media (max-width: 768px) { .cd-sidebar { display: none; } }

        .cd-sidebar-inner { display: flex; flex-direction: column; gap: 24px; }

        .cd-profile-block {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: hsl(217 33% 17%);
          border-radius: 14px;
          border: 1px solid rgba(99,102,241,0.12);
        }
        .cd-profile-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          color: white;
          flex-shrink: 0;
        }
        .cd-profile-name { font-weight: 700; font-size: 0.875rem; color: hsl(214 32% 91%); margin: 0; }
        .cd-profile-role { font-size: 0.75rem; color: #6ee7b7; margin: 2px 0 0; }

        .cd-nav { display: flex; flex-direction: column; gap: 4px; }
        .cd-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 0.875rem;
          color: hsl(215 20% 60%);
          text-decoration: none;
          transition: all 0.2s;
          font-weight: 500;
        }
        .cd-nav-link:hover { background: rgba(16,185,129,0.08); color: hsl(214 32% 85%); }
        .cd-nav-link.active {
          background: rgba(16,185,129,0.12);
          color: #6ee7b7;
          border: 1px solid rgba(16,185,129,0.2);
        }

        .cd-sidebar-stats {
          display: flex;
          align-items: center;
          padding: 14px;
          background: hsl(217 33% 17%);
          border-radius: 14px;
          border: 1px solid rgba(99,102,241,0.1);
          gap: 4px;
        }
        .cd-sidebar-stat { flex: 1; text-align: center; }
        .cd-sidebar-stat-num { display: block; font-size: 1.25rem; font-weight: 800; line-height: 1; }
        .cd-sidebar-stat-label { display: block; font-size: 10px; color: hsl(215 20% 50%); margin-top: 4px; font-weight: 500; }
        .cd-sidebar-stat-divider { width: 1px; height: 32px; background: rgba(99,102,241,0.15); flex-shrink: 0; }

        .cd-find-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border-radius: 12px;
          padding: 11px;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 4px 14px rgba(16,185,129,0.3);
        }
        .cd-find-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* ── MAIN ── */
        .cd-main {
          flex: 1;
          min-width: 0;
          padding: 32px 28px 64px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        @media (max-width: 640px) { .cd-main { padding: 20px 16px 48px; } }

        .cd-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .cd-page-title {
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800;
          color: hsl(214 32% 91%);
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }
        .cd-page-sub { font-size: 0.875rem; color: hsl(215 20% 55%); margin: 0; }
        .cd-browse-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border-radius: 12px;
          padding: 10px 20px;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 4px 16px rgba(16,185,129,0.3);
        }
        .cd-browse-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* metric cards */
        .cd-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 16px;
        }
        .cd-metric-card {
          position: relative;
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          overflow: hidden;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .cd-metric-card:hover {
          border-color: rgba(99,102,241,0.25);
          box-shadow: 0 12px 32px rgba(0,0,0,0.2);
        }
        .cd-metric-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: var(--g);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .cd-metric-label { font-size: 0.72rem; color: hsl(215 20% 55%); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px; }
        .cd-metric-value { font-size: 1.6rem; font-weight: 800; color: hsl(214 32% 91%); margin: 0; line-height: 1.1; }
        .cd-metric-sub { font-size: 0.72rem; color: hsl(215 20% 50%); margin: 5px 0 0; }
        .cd-metric-glow {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--g);
          opacity: 0.06;
          right: -20px;
          top: -20px;
          filter: blur(20px);
          pointer-events: none;
        }

        /* action cards */
        .cd-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }
        .cd-action-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 20px;
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.1);
          border-left: 3px solid var(--ac, #10b981);
          border-radius: 16px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .cd-action-card:hover {
          background: hsl(217 33% 17%);
          border-color: var(--ac);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .cd-action-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cd-action-text { flex: 1; min-width: 0; }
        .cd-action-label { display: block; font-size: 0.875rem; font-weight: 700; color: hsl(214 32% 88%); }
        .cd-action-desc  { display: block; font-size: 0.72rem; color: hsl(215 20% 55%); margin-top: 2px; }
        .cd-action-arrow { width: 16px; height: 16px; color: hsl(215 20% 45%); flex-shrink: 0; transition: all 0.2s; }
        .cd-action-card:hover .cd-action-arrow { color: var(--ac); transform: translate(2px,-2px); }

        /* loading */
        .cd-loading { display: flex; flex-direction: column; gap: 12px; }

        /* empty state */
        .cd-empty-state {
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
        .cd-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: rgba(16,185,129,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          margin-bottom: 20px;
        }
        .cd-empty-title { font-size: 1.3rem; font-weight: 700; color: hsl(214 32% 91%); margin: 0 0 10px; }
        .cd-empty-sub { font-size: 0.9rem; color: hsl(215 20% 55%); max-width: 380px; line-height: 1.6; margin: 0 0 24px; }
        .cd-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border-radius: 999px;
          padding: 12px 28px;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 4px 16px rgba(16,185,129,0.3);
        }
        .cd-empty-btn:hover { opacity: 0.9; transform: translateY(-2px); }

        /* shared section labels */
        .cd-section-title { font-size: 1.05rem; font-weight: 700; color: hsl(214 32% 91%); margin: 0 0 4px; }
        .cd-section-sub { font-size: 0.8rem; color: hsl(215 20% 55%); margin: 0; }

        /* spotlight */
        .cd-spotlight-card {
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 20px;
          padding: 24px;
        }
        .cd-spotlight-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .cd-active-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .cd-active-card {
          display: flex;
          flex-direction: column;
          background: hsl(217 33% 11%);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          transition: all 0.25s;
          position: relative;
        }
        .cd-active-card:hover {
          border-color: rgba(99,102,241,0.3);
          box-shadow: 0 12px 30px rgba(0,0,0,0.2);
          transform: translateY(-3px);
        }
        .cd-active-thumb { aspect-ratio: 16/7; overflow: hidden; }
        .cd-active-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .cd-active-card:hover .cd-active-img { transform: scale(1.05); }
        .cd-active-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
        .cd-active-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: hsl(214 32% 88%);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .cd-active-meta { display: flex; align-items: center; gap: 7px; }
        .cd-active-avatar { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1.5px solid rgba(99,102,241,0.4); }
        .cd-active-student { font-size: 0.75rem; color: hsl(215 20% 55%); font-weight: 500; }
        .cd-active-footer { display: flex; align-items: center; justify-content: space-between; }
        .cd-active-amount { font-size: 0.9rem; font-weight: 800; color: hsl(214 32% 91%); }
        .cd-active-deadline {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(6px);
          color: #fbbf24;
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid rgba(251,191,36,0.3);
        }

        /* viewall btn */
        .cd-viewall-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #6ee7b7;
          text-decoration: none;
          padding: 7px 14px;
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 999px;
          transition: all 0.2s;
        }
        .cd-viewall-btn:hover { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.4); }

        /* table card */
        .cd-table-card {
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 20px;
          overflow: hidden;
        }
        .cd-table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 24px 16px;
          border-bottom: 1px solid rgba(99,102,241,0.08);
          flex-wrap: wrap;
          gap: 12px;
        }
        .cd-tabs {
          display: flex;
          gap: 4px;
          padding: 12px 24px 0;
          border-bottom: 1px solid rgba(99,102,241,0.08);
          overflow-x: auto;
        }
        .cd-tab {
          padding: 8px 16px;
          border-radius: 10px 10px 0 0;
          border: none;
          background: transparent;
          color: hsl(215 20% 55%);
          font-size: 0.8rem;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
        .cd-tab:hover { color: hsl(214 32% 80%); }
        .cd-tab.active {
          color: #6ee7b7;
          border-bottom-color: #10b981;
        }
        .cd-table-wrap { overflow-x: auto; }
        .cd-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .cd-table thead tr { background: rgba(16,185,129,0.04); }
        .cd-table th {
          padding: 12px 20px;
          text-align: left;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: hsl(215 20% 50%);
          font-weight: 700;
          white-space: nowrap;
        }
        .cd-table-row { border-top: 1px solid rgba(99,102,241,0.06); transition: background 0.2s; }
        .cd-table-row:hover { background: rgba(16,185,129,0.03); }
        .cd-table td { padding: 14px 20px; vertical-align: middle; }

        .cd-table-project { display: flex; align-items: center; gap: 12px; }
        .cd-table-thumb {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid rgba(99,102,241,0.15);
        }
        .cd-table-thumb-img { width: 100%; height: 100%; object-fit: cover; }
        .cd-table-title {
          font-weight: 600;
          color: hsl(214 32% 85%);
          text-decoration: none;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          max-width: 200px;
          transition: color 0.2s;
        }
        .cd-table-title:hover { color: #6ee7b7; }
        .cd-table-freelancer { display: flex; align-items: center; gap: 8px; color: hsl(215 20% 65%); white-space: nowrap; }
        .cd-table-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(16,185,129,0.3);
          flex-shrink: 0;
        }
        .cd-table-date { color: hsl(215 20% 50%); white-space: nowrap; }
        .cd-table-amount { font-weight: 800; color: hsl(214 32% 91%); white-space: nowrap; }
        .cd-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .cd-table-detail-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          color: hsl(215 20% 50%);
          text-decoration: none;
          transition: all 0.2s;
        }
        .cd-table-detail-btn:hover { background: rgba(16,185,129,0.1); color: #6ee7b7; }
        .cd-table-empty {
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: hsl(215 20% 50%);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default ClientDashboard;
