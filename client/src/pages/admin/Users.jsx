import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, GraduationCap, Users as UsersIcon, Ban, CheckCircle2, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { getAllUsers, banUser } from '../../api/admin.api';
import { formatDate } from '../../utils/formatDate';
import Navbar from '../../components/Navbar';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';

const RoleBadge = ({ role }) => {
  if (role === 'admin')   return <Badge variant="destructive" className="gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
  if (role === 'student') return <Badge variant="primary" className="gap-1 bg-blue-500/10 text-blue-400 border-blue-500/20"><GraduationCap className="h-3 w-3" />Student</Badge>;
  return <Badge variant="secondary" className="gap-1"><UsersIcon className="h-3 w-3" />Client</Badge>;
};

const AdminUsers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('');
  const [page, setPage]       = useState(1);
  const [pendingId, setPendingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', { role, page }],
    queryFn: () => getAllUsers({ role, page }),
    keepPreviousData: true,
  });

  const users      = data?.data || [];
  const pagination = data?.pagination || {};

  const banMutation = useMutation({
    mutationFn: ({ id, isBanned }) => banUser(id, isBanned),
    onMutate: ({ id }) => setPendingId(id),
    onSettled: () => {
      setPendingId(null);
      queryClient.invalidateQueries(['adminUsers']);
    },
  });

  // Client-side search filter (search is not wired to backend in admin.controller, so filter here)
  const filtered = search
    ? users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors shrink-0 cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-1">User Management</h1>
            <p className="text-muted-foreground text-sm">Search, filter, and manage platform users.</p>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="user-search"
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            id="role-filter"
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Roles</option>
            <option value="client">Client</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* ── Table ── */}
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-96 w-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <UsersIcon className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No users found</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="p-4 font-medium">User</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Role</th>
                      <th className="p-4 font-medium">Joined</th>
                      <th className="p-4 font-medium text-center">Status</th>
                      <th className="p-4 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <AnimatePresence>
                      {filtered.map((u) => (
                        <motion.tr
                          key={u._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-secondary/20 transition-colors"
                        >
                          {/* Avatar + Name */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-secondary overflow-hidden shrink-0">
                                <img
                                  src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`}
                                  alt={u.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <span className="font-medium text-sm">{u.name}</span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="p-4 text-sm text-muted-foreground">{u.email}</td>

                          {/* Role */}
                          <td className="p-4"><RoleBadge role={u.role} /></td>

                          {/* Joined */}
                          <td className="p-4 text-sm text-muted-foreground">{formatDate(u.createdAt)}</td>

                          {/* Ban status */}
                          <td className="p-4 text-center">
                            {u.isBanned ? (
                              <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />Banned</Badge>
                            ) : (
                              <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge>
                            )}
                          </td>

                          {/* Toggle ban action */}
                          <td className="p-4 text-center">
                            {u.role !== 'admin' && (
                              <button
                                id={`ban-toggle-${u._id}`}
                                onClick={() => banMutation.mutate({ id: u._id, isBanned: !u.isBanned })}
                                disabled={pendingId === u._id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                                  u.isBanned
                                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                }`}
                              >
                                {pendingId === u._id ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto" /> : u.isBanned ? 'Unban' : 'Ban'}
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              <div className="block md:hidden divide-y divide-border/50">
                <AnimatePresence>
                  {filtered.map((u) => (
                    <motion.div
                      key={u._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-secondary overflow-hidden shrink-0">
                            <img
                              src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`}
                              alt={u.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <RoleBadge role={u.role} />
                      </div>

                      <div className="flex justify-between items-center text-xs border-t border-border/30 pt-2.5">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Joined</span>
                          <span className="font-medium text-foreground">{formatDate(u.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            {u.isBanned ? (
                              <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />Banned</Badge>
                            ) : (
                              <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge>
                            )}
                          </div>
                          {u.role !== 'admin' && (
                            <button
                              id={`ban-toggle-mobile-${u._id}`}
                              onClick={() => banMutation.mutate({ id: u._id, isBanned: !u.isBanned })}
                              disabled={pendingId === u._id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                                u.isBanned
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                              }`}
                            >
                              {pendingId === u._id ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto" /> : u.isBanned ? 'Unban' : 'Ban'}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.pages} &middot; {pagination.total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-border hover:bg-secondary/50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="p-1.5 rounded-lg border border-border hover:bg-secondary/50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
