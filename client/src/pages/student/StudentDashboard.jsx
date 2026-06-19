import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp,
  Star, IndianRupee, PlusCircle, Wallet, ListOrdered,
  BarChart2, ArrowUpRight, Briefcase, ChevronRight,
  Activity, Package
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { getMyOrdersStudent } from '../../api/order.api';
import { getEarningsByMonth } from '../../api/wallet.api';
import { getMyGigs } from '../../api/gig.api';
import { formatINR } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Navbar from '../../components/Navbar';
import Skeleton from '../../components/ui/Skeleton';

/* ─── helpers ─── */
const statusConfig = {
  payment_pending:  { label: 'Pending Payment', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  pending_payment:  { label: 'Pending Payment', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  in_escrow:        { label: 'In Progress',     color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: Activity },
  in_progress:      { label: 'In Progress',     color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: Activity },
  completed:        { label: 'Completed',       color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: CheckCircle2 },
  cancelled:        { label: 'Cancelled',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: XCircle },
  disputed:         { label: 'Disputed',        color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: AlertCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
      className="sd-status-badge"
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

/* ─── metric card ─── */
const MetricCard = ({ icon: Icon, label, value, sub, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="sd-metric-card"
    style={{ '--g': gradient }}
  >
    <div className="sd-metric-icon-wrap">
      <Icon className="w-5 h-5" />
    </div>
    <div className="sd-metric-body">
      <p className="sd-metric-label">{label}</p>
      <p className="sd-metric-value">{value}</p>
      {sub && <p className="sd-metric-sub">{sub}</p>}
    </div>
    <div className="sd-metric-glow" />
  </motion.div>
);

/* ─── quick action card ─── */
const ActionCard = ({ to, icon: Icon, label, desc, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -4 }}
  >
    <Link to={to} className="sd-action-card" style={{ '--ac': color }}>
      <div className="sd-action-icon" style={{ background: `${color}18`, color }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="sd-action-text">
        <span className="sd-action-label">{label}</span>
        <span className="sd-action-desc">{desc}</span>
      </div>
      <ArrowUpRight className="sd-action-arrow" />
    </Link>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════════════ */
const StudentDashboard = () => {
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'area'

  const { data: orders, isLoading } = useQuery({
    queryKey: ['studentOrders'],
    queryFn: getMyOrdersStudent,
  });

  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ['earningsByMonth'],
    queryFn: getEarningsByMonth,
    select: (res) => res.data || [],
  });

  const { data: myGigs } = useQuery({
    queryKey: ['myGigs'],
    queryFn: getMyGigs,
    select: (res) => res.data || [],
  });

  const gigsWithRatings = (myGigs || []).filter(g => g.avgRating > 0);
  const avgRating = gigsWithRatings.length
    ? (gigsWithRatings.reduce((s, g) => s + g.avgRating, 0) / gigsWithRatings.length).toFixed(1)
    : null;
  const totalReviews = (myGigs || []).reduce((s, g) => s + (g.totalReviews || 0), 0);

  const completedOrders = orders?.filter(o => o.status === 'completed') || [];
  const activeOrders    = orders?.filter(o => !['completed', 'cancelled', 'pending_payment'].includes(o.status)) || [];
  const totalEarned     = earningsData?.reduce((sum, item) => sum + item.amount, 0) || 0;

  const recentOrders = (orders || []).slice(0, 8);

  return (
    <div className="sd-root">
      <Navbar />

      <div className="sd-layout">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="sd-sidebar">
          <div className="sd-sidebar-inner">

            {/* profile block */}
            <div className="sd-profile-block">
              <div className="sd-profile-avatar">
                <span>ST</span>
              </div>
              <div>
                <p className="sd-profile-name">Student</p>
                <p className="sd-profile-role">Freelancer</p>
              </div>
            </div>

            {/* nav links */}
            <nav className="sd-nav">
              {[
                { to: '/student-dashboard', icon: BarChart2, label: 'Dashboard', active: true },
                { to: '/student/orders',    icon: ListOrdered, label: 'My Orders' },
                { to: '/student/my-gigs',  icon: Briefcase,   label: 'My Gigs' },
                { to: '/student/create-gig',icon: PlusCircle, label: 'Create Gig' },
                { to: '/student/wallet',   icon: Wallet,      label: 'Wallet' },
              ].map(({ to, icon: Icon, label, active }) => (
                <Link key={to} to={to} className={`sd-nav-link ${active ? 'active' : ''}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                </Link>
              ))}
            </nav>

            {/* quick stats in sidebar */}
            <div className="sd-sidebar-stats">
              <div className="sd-sidebar-stat">
                <span className="sd-sidebar-stat-num" style={{ color: '#10b981' }}>{completedOrders.length}</span>
                <span className="sd-sidebar-stat-label">Completed</span>
              </div>
              <div className="sd-sidebar-stat-divider" />
              <div className="sd-sidebar-stat">
                <span className="sd-sidebar-stat-num" style={{ color: '#6366f1' }}>{activeOrders.length}</span>
                <span className="sd-sidebar-stat-label">Active</span>
              </div>
              <div className="sd-sidebar-stat-divider" />
              <div className="sd-sidebar-stat">
                <span className="sd-sidebar-stat-num" style={{ color: '#f59e0b' }}>{(myGigs || []).length}</span>
                <span className="sd-sidebar-stat-label">Gigs</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="sd-main">

          {/* Page Header */}
          <div className="sd-page-header">
            <div>
              <h1 className="sd-page-title">Student Dashboard</h1>
              <p className="sd-page-sub">Track your earnings, orders, and performance.</p>
            </div>
            <Link to="/student/create-gig" className="sd-create-btn">
              <PlusCircle className="w-4 h-4" />
              New Gig
            </Link>
          </div>

          {/* Metric Cards */}
          <div className="sd-metrics-grid">
            <MetricCard
              icon={IndianRupee}
              label="Total Earned"
              value={formatINR(totalEarned)}
              sub={`${completedOrders.length} completed orders`}
              gradient="linear-gradient(135deg,#10b981,#059669)"
              delay={0}
            />
            <MetricCard
              icon={Activity}
              label="Active Orders"
              value={activeOrders.length}
              sub="Currently in progress"
              gradient="linear-gradient(135deg,#6366f1,#8b5cf6)"
              delay={0.08}
            />
            <MetricCard
              icon={Package}
              label="Total Orders"
              value={orders?.length || 0}
              sub="All time"
              gradient="linear-gradient(135deg,#3b82f6,#6366f1)"
              delay={0.16}
            />
            <MetricCard
              icon={Star}
              label="Avg Rating"
              value={avgRating ? `${avgRating} ★` : '—'}
              sub={avgRating ? `From ${totalReviews} reviews` : 'No reviews yet'}
              gradient="linear-gradient(135deg,#f59e0b,#f97316)"
              delay={0.24}
            />
          </div>

          {/* Quick Actions */}
          <div className="sd-actions-grid">
            <ActionCard to="/student/orders"     icon={ListOrdered} label="View Active Orders" desc="Manage in-progress work"   color="#6366f1" delay={0.1} />
            <ActionCard to="/student/create-gig" icon={PlusCircle}  label="Create New Gig"     desc="Add a new service listing" color="#10b981" delay={0.18} />
            <ActionCard to="/student/wallet"     icon={Wallet}      label="Go to Wallet"        desc="View earnings & withdraw" color="#f59e0b" delay={0.26} />
          </div>

          {/* Chart + Side Panel */}
          <div className="sd-chart-row">
            {/* Earnings Chart */}
            <div className="sd-chart-card">
              <div className="sd-chart-header">
                <div>
                  <h2 className="sd-section-title">Earnings Overview</h2>
                  <p className="sd-section-sub">Monthly earnings breakdown</p>
                </div>
                <div className="sd-chart-toggle">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`sd-chart-toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setChartType('area')}
                    className={`sd-chart-toggle-btn ${chartType === 'area' ? 'active' : ''}`}
                  >
                    Area
                  </button>
                </div>
              </div>

              {earningsLoading ? (
                <Skeleton className="h-56 w-full rounded-xl" />
              ) : earningsData && earningsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  {chartType === 'bar' ? (
                    <BarChart data={earningsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11, fontFamily: 'Georgia' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11, fontFamily: 'Georgia' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                      <Tooltip
                        cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                        contentStyle={{ backgroundColor: 'hsl(217 33% 17%)', borderColor: 'rgba(99,102,241,0.25)', borderRadius: '12px', color: 'hsl(214 32% 91%)', fontFamily: 'Georgia' }}
                        formatter={v => [`₹${v.toLocaleString()}`, 'Earnings']}
                      />
                      <Bar dataKey="amount" fill="url(#barGrad)" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  ) : (
                    <AreaChart data={earningsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11, fontFamily: 'Georgia' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11, fontFamily: 'Georgia' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(217 33% 17%)', borderColor: 'rgba(99,102,241,0.25)', borderRadius: '12px', color: 'hsl(214 32% 91%)', fontFamily: 'Georgia' }}
                        formatter={v => [`₹${v.toLocaleString()}`, 'Earnings']}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="sd-chart-empty">
                  <BarChart2 className="w-10 h-10 opacity-30" />
                  <p>No earnings yet. Complete orders to see your chart.</p>
                </div>
              )}
            </div>

            {/* Active Orders Mini Panel */}
            <div className="sd-side-panel">
              <h2 className="sd-section-title" style={{ marginBottom: '16px' }}>Active Orders</h2>
              {activeOrders.length === 0 ? (
                <div className="sd-panel-empty">
                  <Package className="w-8 h-8 opacity-30" />
                  <p>No active orders</p>
                </div>
              ) : (
                <div className="sd-active-list">
                  {activeOrders.slice(0, 4).map(order => (
                    <Link key={order._id} to={`/orders/${order._id}`} className="sd-active-item">
                      <div className="sd-active-dot" />
                      <div className="sd-active-info">
                        <span className="sd-active-title">{order.gig?.title || 'Unknown Gig'}</span>
                        <span className="sd-active-client">{order.client?.name}</span>
                      </div>
                      <span className="sd-active-price">{formatINR(order.amount)}</span>
                    </Link>
                  ))}
                  {activeOrders.length > 4 && (
                    <Link to="/student/orders" className="sd-panel-viewall">
                      View all {activeOrders.length} orders →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="sd-table-card">
            <div className="sd-table-header">
              <div>
                <h2 className="sd-section-title">Recent Orders</h2>
                <p className="sd-section-sub">Your latest order activity</p>
              </div>
              <Link to="/student/orders" className="sd-table-viewall">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="sd-table-loading">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="sd-table-empty">
                <Package className="w-10 h-10 opacity-30" />
                <p className="sd-table-empty-title">No orders yet</p>
                <p className="sd-table-empty-sub">When clients hire you, their orders will appear here.</p>
              </div>
            ) : (
              <>
                <div className="sd-table-wrap hidden md:block">
                  <table className="sd-table">
                    <thead>
                      <tr>
                        <th>Gig</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, idx) => (
                        <motion.tr
                          key={order._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="sd-table-row"
                        >
                          <td>
                            <Link to={`/orders/${order._id}`} className="sd-table-gig-link">
                              {order.gig?.title || 'Unknown Gig'}
                            </Link>
                          </td>
                          <td>
                            <div className="sd-table-client">
                              <img
                                src={order.client?.avatar || `https://ui-avatars.com/api/?name=${order.client?.name || 'C'}&background=6366f1&color=fff`}
                                alt=""
                                className="sd-table-avatar"
                              />
                              <span>{order.client?.name}</span>
                            </div>
                          </td>
                          <td className="sd-table-date">{formatDate(order.createdAt)}</td>
                          <td className="sd-table-amount">{formatINR(order.amount)}</td>
                          <td><StatusBadge status={order.status} /></td>
                          <td>
                            <Link to={`/orders/${order._id}`} className="sd-table-detail-btn">
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sd-cards-wrap block md:hidden divide-y divide-border/20">
                  {recentOrders.map((order, idx) => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <Link to={`/orders/${order._id}`} className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2 text-foreground">
                          {order.gig?.title || 'Unknown Gig'}
                        </Link>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <img
                            src={order.client?.avatar || `https://ui-avatars.com/api/?name=${order.client?.name || 'C'}&background=6366f1&color=fff`}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover border border-border"
                          />
                          <span>{order.client?.name}</span>
                        </div>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-bold text-foreground">{formatINR(order.amount)}</span>
                        <Link to={`/orders/${order._id}`} className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1">
                          Manage <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>

        </main>
      </div>

      {/* ── Scoped Styles ── */}
      <style>{`
        .sd-root {
          min-height: 100vh;
          background: hsl(222 47% 11%);
          font-family: Georgia, 'Times New Roman', Times, serif;
        }

        /* ── layout ── */
        .sd-layout {
          display: flex;
          min-height: calc(100vh - 64px);
        }

        /* ── SIDEBAR ── */
        .sd-sidebar {
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
        @media (max-width: 768px) { .sd-sidebar { display: none; } }

        .sd-sidebar-inner { display: flex; flex-direction: column; gap: 28px; }

        .sd-profile-block {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: hsl(217 33% 17%);
          border-radius: 14px;
          border: 1px solid rgba(99,102,241,0.12);
        }
        .sd-profile-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          color: white;
          flex-shrink: 0;
        }
        .sd-profile-name { font-weight: 700; font-size: 0.875rem; color: hsl(214 32% 91%); margin: 0; }
        .sd-profile-role { font-size: 0.75rem; color: #a5b4fc; margin: 2px 0 0; }

        .sd-nav { display: flex; flex-direction: column; gap: 4px; }
        .sd-nav-link {
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
        .sd-nav-link:hover {
          background: rgba(99,102,241,0.08);
          color: hsl(214 32% 85%);
        }
        .sd-nav-link.active {
          background: rgba(99,102,241,0.15);
          color: #a5b4fc;
          border: 1px solid rgba(99,102,241,0.2);
        }

        .sd-sidebar-stats {
          display: flex;
          align-items: center;
          padding: 14px;
          background: hsl(217 33% 17%);
          border-radius: 14px;
          border: 1px solid rgba(99,102,241,0.1);
          gap: 4px;
        }
        .sd-sidebar-stat { flex: 1; text-align: center; }
        .sd-sidebar-stat-num { display: block; font-size: 1.25rem; font-weight: 800; line-height: 1; }
        .sd-sidebar-stat-label { display: block; font-size: 10px; color: hsl(215 20% 50%); margin-top: 4px; font-weight: 500; }
        .sd-sidebar-stat-divider { width: 1px; height: 32px; background: rgba(99,102,241,0.15); flex-shrink: 0; }

        /* ── MAIN ── */
        .sd-main {
          flex: 1;
          min-width: 0;
          padding: 32px 28px 64px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        @media (max-width: 640px) { .sd-main { padding: 20px 16px 48px; } }

        /* page header */
        .sd-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .sd-page-title {
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800;
          color: hsl(214 32% 91%);
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }
        .sd-page-sub { font-size: 0.875rem; color: hsl(215 20% 55%); margin: 0; }
        .sd-create-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-radius: 12px;
          padding: 10px 20px;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
        }
        .sd-create-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* ── metric cards ── */
        .sd-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .sd-metric-card {
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
        .sd-metric-card:hover {
          border-color: rgba(99,102,241,0.25);
          box-shadow: 0 12px 32px rgba(0,0,0,0.2);
        }
        .sd-metric-icon-wrap {
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
        .sd-metric-body { flex: 1; min-width: 0; }
        .sd-metric-label { font-size: 0.75rem; color: hsl(215 20% 55%); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px; }
        .sd-metric-value { font-size: 1.65rem; font-weight: 800; color: hsl(214 32% 91%); margin: 0; line-height: 1.1; }
        .sd-metric-sub { font-size: 0.75rem; color: hsl(215 20% 50%); margin: 6px 0 0; }
        .sd-metric-glow {
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

        /* ── quick actions ── */
        .sd-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }
        .sd-action-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 20px;
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 16px;
          text-decoration: none;
          transition: all 0.2s;
          border-left: 3px solid var(--ac, #6366f1);
        }
        .sd-action-card:hover {
          background: hsl(217 33% 17%);
          border-color: var(--ac, #6366f1);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .sd-action-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sd-action-text { flex: 1; min-width: 0; }
        .sd-action-label { display: block; font-size: 0.875rem; font-weight: 700; color: hsl(214 32% 88%); }
        .sd-action-desc  { display: block; font-size: 0.75rem; color: hsl(215 20% 55%); margin-top: 2px; }
        .sd-action-arrow { width: 16px; height: 16px; color: hsl(215 20% 45%); flex-shrink: 0; transition: color 0.2s, transform 0.2s; }
        .sd-action-card:hover .sd-action-arrow { color: var(--ac, #6366f1); transform: translate(2px, -2px); }

        /* ── chart row ── */
        .sd-chart-row {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
        }
        @media (max-width: 1024px) { .sd-chart-row { grid-template-columns: 1fr; } }

        .sd-chart-card, .sd-side-panel {
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 20px;
          padding: 24px;
        }
        .sd-chart-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .sd-chart-toggle {
          display: flex;
          background: hsl(217 33% 11%);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          overflow: hidden;
        }
        .sd-chart-toggle-btn {
          padding: 6px 16px;
          font-size: 12px;
          font-family: inherit;
          font-weight: 600;
          background: transparent;
          border: none;
          color: hsl(215 20% 50%);
          cursor: pointer;
          transition: all 0.2s;
        }
        .sd-chart-toggle-btn.active {
          background: rgba(99,102,241,0.2);
          color: #a5b4fc;
        }
        .sd-chart-empty {
          height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: hsl(215 20% 50%);
          font-size: 0.875rem;
        }

        /* side panel */
        .sd-active-list { display: flex; flex-direction: column; gap: 10px; }
        .sd-active-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: hsl(217 33% 11%);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .sd-active-item:hover {
          background: rgba(99,102,241,0.08);
          border-color: rgba(99,102,241,0.25);
        }
        .sd-active-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6366f1;
          flex-shrink: 0;
          box-shadow: 0 0 6px #6366f1;
        }
        .sd-active-info { flex: 1; min-width: 0; }
        .sd-active-title {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: hsl(214 32% 85%);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sd-active-client { display: block; font-size: 0.72rem; color: hsl(215 20% 50%); margin-top: 2px; }
        .sd-active-price { font-size: 0.8rem; font-weight: 700; color: hsl(214 32% 85%); flex-shrink: 0; }
        .sd-panel-empty {
          height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: hsl(215 20% 50%);
          font-size: 0.875rem;
        }
        .sd-panel-viewall {
          display: block;
          text-align: center;
          font-size: 0.8rem;
          color: #a5b4fc;
          text-decoration: none;
          padding: 8px;
          transition: opacity 0.2s;
          font-weight: 600;
        }
        .sd-panel-viewall:hover { opacity: 0.75; }

        /* ── shared section labels ── */
        .sd-section-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: hsl(214 32% 91%);
          margin: 0 0 4px;
        }
        .sd-section-sub { font-size: 0.8rem; color: hsl(215 20% 55%); margin: 0; }

        /* ── table card ── */
        .sd-table-card {
          background: hsl(217 33% 15%);
          border: 1px solid rgba(99,102,241,0.1);
          border-radius: 20px;
          overflow: hidden;
        }
        .sd-table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 24px 18px;
          border-bottom: 1px solid rgba(99,102,241,0.08);
          flex-wrap: wrap;
          gap: 12px;
        }
        .sd-table-viewall {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #a5b4fc;
          text-decoration: none;
          padding: 7px 14px;
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 999px;
          transition: all 0.2s;
        }
        .sd-table-viewall:hover { background: rgba(99,102,241,0.1); }

        .sd-table-loading { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
        .sd-table-empty {
          padding: 60px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: hsl(215 20% 50%);
        }
        .sd-table-empty-title { font-size: 1rem; font-weight: 700; color: hsl(214 32% 75%); margin: 0; }
        .sd-table-empty-sub { font-size: 0.875rem; margin: 0; max-width: 300px; line-height: 1.5; }

        .sd-table-wrap { overflow-x: auto; }
        .sd-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .sd-table thead tr {
          background: rgba(99,102,241,0.06);
        }
        .sd-table th {
          padding: 12px 20px;
          text-align: left;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: hsl(215 20% 50%);
          font-weight: 700;
          white-space: nowrap;
        }
        .sd-table-row {
          border-top: 1px solid rgba(99,102,241,0.06);
          transition: background 0.2s;
        }
        .sd-table-row:hover { background: rgba(99,102,241,0.04); }
        .sd-table td { padding: 14px 20px; vertical-align: middle; }

        .sd-table-gig-link {
          font-weight: 600;
          color: hsl(214 32% 85%);
          text-decoration: none;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          max-width: 220px;
          transition: color 0.2s;
        }
        .sd-table-gig-link:hover { color: #a5b4fc; }

        .sd-table-client {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          color: hsl(215 20% 65%);
        }
        .sd-table-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(99,102,241,0.3);
          flex-shrink: 0;
        }
        .sd-table-date { color: hsl(215 20% 50%); white-space: nowrap; }
        .sd-table-amount { font-weight: 800; color: hsl(214 32% 91%); white-space: nowrap; }

        .sd-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .sd-table-detail-btn {
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
        .sd-table-detail-btn:hover {
          background: rgba(99,102,241,0.12);
          color: #a5b4fc;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
