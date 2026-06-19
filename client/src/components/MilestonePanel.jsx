import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, Clock, RotateCcw, Plus,
  Upload, ChevronDown, ChevronUp, ExternalLink, Loader2,
  DollarSign, Percent, Wallet,
} from 'lucide-react';
import {
  getMilestonesByOrder,
  createMilestone,
  submitMilestone,
  approveMilestone,
  requestRevision,
} from '../api/milestone.api';
import { formatINR } from '../utils/formatCurrency';
import Badge from './ui/Badge';
import Spinner from './ui/Spinner';

// ─── Status helpers ────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:            { label: 'Pending',            icon: Clock,           color: 'text-yellow-400',  bg: 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' },
  submitted:          { label: 'Submitted',          icon: Upload,          color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/20 text-blue-400' },
  revision_requested: { label: 'Revision Requested', icon: RotateCcw,       color: 'text-orange-400',  bg: 'bg-orange-400/10 border-orange-400/20 text-orange-400' },
  approved:           { label: 'Approved',           icon: CheckCircle2,    color: 'text-green-400',   bg: 'bg-green-400/10 border-green-400/20 text-green-400' },
};

const StatusBadge = ({ status }) => {
  const { label, icon: Icon, bg } = STATUS_META[status] || { label: status, icon: Clock, bg: '' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// ─── Add Milestone Form (student) ─────────────────────────────────────────────
const AddMilestoneForm = ({ orderId, onSuccess }) => {
  const [form, setForm] = useState({ title: '', description: '', amount: '' });
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createMilestone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', orderId] });
      setForm({ title: '', description: '', amount: '' });
      setOpen(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    mutate({ orderId, title: form.title, description: form.description, amount: Number(form.amount) });
  };

  return (
    <div className="mt-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors border border-primary/30 hover:border-primary/60 rounded-xl px-4 py-2.5 w-full justify-center bg-primary/5 hover:bg-primary/10"
        >
          <Plus className="w-4 h-4" /> Add Milestone
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-secondary/30 border border-border/50 rounded-2xl p-5 space-y-4">
          <h4 className="font-semibold text-sm text-foreground">New Milestone</h4>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Title *</label>
            <input
              className="w-full bg-background/60 border border-border/70 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. UI Wireframes"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Description</label>
            <textarea
              className="w-full bg-background/60 border border-border/70 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              rows={2}
              placeholder="What will you deliver in this milestone?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Amount (₹) *</label>
            <input
              type="number"
              min="1"
              className="w-full bg-background/60 border border-border/70 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="500"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              required
            />
            {form.amount > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                After 8% platform fee, you'll receive <span className="text-green-400 font-semibold">{formatINR(form.amount * 0.92)}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm py-2 rounded-xl border border-border/50 hover:bg-secondary/50 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 text-sm py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Milestone'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ─── Submit Deliverable Form (student) ───────────────────────────────────────
const SubmitDeliverableForm = ({ milestoneId, orderId, onClose }) => {
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const fileRef = useRef();
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, fd }) => submitMilestone(id, fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', orderId] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    if (note) fd.append('deliverableNote', note);
    if (file) fd.append('deliverable', file);
    mutate({ id: milestoneId, fd });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
      <h5 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Submit Deliverable</h5>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Deliverable File (optional)</label>
        <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
        <button type="button" onClick={() => fileRef.current.click()} className="flex items-center gap-2 text-xs border border-border/60 rounded-lg px-3 py-2 hover:bg-secondary/40 transition-colors w-full">
          <Upload className="w-3.5 h-3.5 text-muted-foreground" />
          {file ? <span className="text-foreground truncate">{file.name}</span> : <span className="text-muted-foreground">Choose file (image, PDF, ZIP…)</span>}
        </button>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Note to Client</label>
        <textarea className="w-full bg-background/60 border border-border/70 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" rows={2} placeholder="Describe what you've delivered…" value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 text-xs py-1.5 rounded-lg border border-border/50 hover:bg-secondary/40 transition-colors">Cancel</button>
        <button type="submit" disabled={isPending} className="flex-1 text-xs py-1.5 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60">
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Submit Work'}
        </button>
      </div>
    </form>
  );
};

// ─── Revision Note Form (client) ──────────────────────────────────────────────
const RevisionForm = ({ milestoneId, orderId, onClose }) => {
  const [note, setNote] = useState('');
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, n }) => requestRevision(id, n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', orderId] });
      onClose();
    },
  });

  return (
    <form onSubmit={e => { e.preventDefault(); if (note.trim()) mutate({ id: milestoneId, n: note }); }} className="mt-3 bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 space-y-3">
      <h5 className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Request Revision</h5>
      <textarea
        className="w-full bg-background/60 border border-border/70 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/40 resize-none"
        rows={3}
        placeholder="Describe what needs to be changed…"
        value={note}
        onChange={e => setNote(e.target.value)}
        required
      />
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 text-xs py-1.5 rounded-lg border border-border/50 hover:bg-secondary/40 transition-colors">Cancel</button>
        <button type="submit" disabled={isPending || !note.trim()} className="flex-1 text-xs py-1.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60">
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Send Request'}
        </button>
      </div>
    </form>
  );
};

// ─── Single Milestone Card ────────────────────────────────────────────────────
const MilestoneCard = ({ milestone, orderId, role }) => {
  const [expanded, setExpanded] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const qc = useQueryClient();

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: () => approveMilestone(milestone._id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones', orderId] }),
  });

  const meta = STATUS_META[milestone.status] || STATUS_META.pending;
  const Icon = meta.icon;
  const canSubmit = role === 'student' && ['pending', 'revision_requested'].includes(milestone.status);
  const canApprove = role === 'client' && milestone.status === 'submitted';
  const canRevise = role === 'client' && milestone.status === 'submitted';

  const platformFee = +(milestone.amount * 0.08).toFixed(2);
  const studentCredit = +(milestone.amount - platformFee).toFixed(2);

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 ${milestone.status === 'approved' ? 'border-green-400/30 bg-green-400/5' : 'border-border/50 bg-card/50'}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={() => setExpanded(e => !e)}>
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${meta.bg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{milestone.title}</p>
          {milestone.description && <p className="text-xs text-muted-foreground truncate">{milestone.description}</p>}
        </div>
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-foreground">{formatINR(milestone.amount)}</p>
            <p className="text-xs text-muted-foreground">→ {formatINR(studentCredit)} net</p>
          </div>
          <StatusBadge status={milestone.status} />
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border/30 px-4 pb-4 pt-3 space-y-3">
          {/* Commission breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { icon: DollarSign, label: 'Milestone', value: formatINR(milestone.amount), color: 'text-foreground' },
              { icon: Percent, label: 'Platform (8%)', value: `-${formatINR(platformFee)}`, color: 'text-red-400' },
              { icon: Wallet, label: 'Student Earns', value: formatINR(studentCredit), color: 'text-green-400' },
            ].map(({ icon: I, label, value, color }) => (
              <div key={label} className="bg-background/50 rounded-xl p-3 text-center">
                <I className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                <p className={`text-sm font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Deliverable link */}
          {milestone.deliverableUrl && (
            <a href={milestone.deliverableUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 rounded-xl px-3 py-2 border border-blue-500/20">
              <ExternalLink className="w-3.5 h-3.5" /> View Deliverable
            </a>
          )}

          {/* Deliverable note */}
          {milestone.deliverableNote && (
            <div className="text-xs text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2">
              <span className="text-foreground font-medium">Student note: </span>{milestone.deliverableNote}
            </div>
          )}

          {/* Revision note */}
          {milestone.revisionNote && (
            <div className="text-xs bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2">
              <span className="text-orange-400 font-medium">Revision requested: </span>
              <span className="text-muted-foreground">{milestone.revisionNote}</span>
            </div>
          )}

          {/* Approved at */}
          {milestone.approvedAt && (
            <p className="text-xs text-green-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approved on {new Date(milestone.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Student: submit work */}
            {canSubmit && !showSubmit && (
              <button onClick={() => setShowSubmit(true)} className="flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                <Upload className="w-4 h-4" /> Submit Work
              </button>
            )}
            {showSubmit && <SubmitDeliverableForm milestoneId={milestone._id} orderId={orderId} onClose={() => setShowSubmit(false)} />}

            {/* Client: approve */}
            {canApprove && !showRevision && (
              <button onClick={() => approve()} disabled={approving} className="flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-60">
                {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {approving ? 'Processing…' : 'Approve & Release Payment'}
              </button>
            )}

            {/* Client: request revision */}
            {canRevise && !showRevision && (
              <button onClick={() => setShowRevision(true)} className="flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 transition-colors">
                <RotateCcw className="w-4 h-4" /> Request Revision
              </button>
            )}
            {showRevision && <RevisionForm milestoneId={milestone._id} orderId={orderId} onClose={() => setShowRevision(false)} />}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main MilestonePanel ──────────────────────────────────────────────────────
const MilestonePanel = ({ orderId, role, orderStatus }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['milestones', orderId],
    queryFn: () => getMilestonesByOrder(orderId),
    enabled: !!orderId,
  });

  const milestones = data?.data || [];
  const summary = data?.summary || {};
  const canAddMilestone = role === 'student' && ['in_escrow', 'in_progress'].includes(orderStatus);

  if (isLoading) return <div className="py-8 flex justify-center"><Spinner size={32} /></div>;
  if (isError) return <p className="text-sm text-destructive text-center py-4">Failed to load milestones.</p>;

  return (
    <div>
      {/* Summary bar */}
      {milestones.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total', value: summary.total, color: 'text-foreground' },
            { label: 'Approved', value: summary.approved, color: 'text-green-400' },
            { label: 'Submitted', value: summary.submitted, color: 'text-blue-400' },
            { label: 'Pending', value: summary.pending + (summary.revision_requested || 0), color: 'text-yellow-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-background/50 rounded-xl p-3 text-center border border-border/30">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Milestone cards */}
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-sm">No milestones yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {role === 'student' ? 'Add milestones to break your work into payable chunks.' : "The student hasn't added any milestones yet."}
            </p>
          </div>
        ) : (
          milestones.map(m => (
            <MilestoneCard key={m._id} milestone={m} orderId={orderId} role={role} />
          ))
        )}
      </div>

      {/* Add milestone (student only) */}
      {canAddMilestone && <AddMilestoneForm orderId={orderId} />}
    </div>
  );
};

export default MilestonePanel;
