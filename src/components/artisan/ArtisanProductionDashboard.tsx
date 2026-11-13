import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductionBatch } from '../../types';
import {
  Package,
  Clock,
  CheckCircle2,
  Play,
  Check,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const ArtisanProductionDashboard: React.FC = () => {
  const {
    batches,
    updateBatchProgress,
    markBatchCompleted,
    setCurrentView
  } = useApp();

  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [modalProgress, setModalProgress] = useState<number>(0);
  const [modalNotes, setModalNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'In Production' | 'Completed' | 'DueSoon'>('All');

  const pendingBatches = batches.filter(b => b.status === 'Pending').length;
  const inProductionBatches = batches.filter(b => b.status === 'In Production').length;
  const completedBatches = batches.filter(b => b.status === 'Completed').length;
  const upcomingDeadlines = batches.filter(b => b.status === 'In Production' || b.status === 'Delayed').length;

  const filteredBatches = batches.filter(b => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'DueSoon') return b.status === 'In Production' || b.status === 'Delayed';
    return b.status === statusFilter;
  });

  const handleOpenDetail = (batch: ProductionBatch) => {
    setSelectedBatch(batch);
    setModalProgress(batch.progressPercentage);
    setModalNotes(batch.notes);
  };

  const handleApplyProgress = async (progressVal: number) => {
    if (!selectedBatch) return;
    setIsSaving(true);
    try {
      setModalProgress(progressVal);
      await updateBatchProgress(selectedBatch.id, progressVal, modalNotes);
      setSelectedBatch(prev => (prev ? { ...prev, progressPercentage: progressVal, notes: modalNotes } : null));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteBatch = async () => {
    if (!selectedBatch) return;
    setIsSaving(true);
    try {
      await markBatchCompleted(selectedBatch.id);
      setSelectedBatch(null);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: ProductionBatch['status']) => {
    switch (status) {
      case 'Completed': return <Badge variant="green">Completed</Badge>;
      case 'In Production': return <Badge variant="gold">In Production</Badge>;
      case 'Delayed': return <Badge variant="crimson">Delayed</Badge>;
      default: return <Badge variant="amber">Pending</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Data Flow Process 7.0 · Weaving Floor Operations
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            Artisan Production Tracker
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Dedicated loom allocation & progress management for Binugao Bagobo-Tagabawa weavers
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button
            onClick={() => setCurrentView('cebuano_speech')}
            className="px-3.5 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs transition-colors"
          >
            Cebuano Voice Log
          </button>
          <button
            onClick={() => setCurrentView('inventory')}
            className="px-4 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Material Inventory</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C9A227]" />
          </button>
        </div>
      </div>

      {/* Dashboard KPI Cards (Interactive Queue Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setStatusFilter(prev => (prev === 'Pending' ? 'All' : 'Pending'))}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            statusFilter === 'Pending'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Pending Loom Orders</span>
            <Clock className="w-4 h-4 text-[#8C6B0F]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#3B2418] mt-2 tabular-nums">
            {pendingBatches}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Fiber warping queued · Click to filter</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(prev => (prev === 'In Production' ? 'All' : 'In Production'))}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            statusFilter === 'In Production'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Active In Production</span>
            <Package className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#8C6B0F] mt-2 tabular-nums">
            {inProductionBatches}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Currently on backstrap looms · Click to filter</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(prev => (prev === 'Completed' ? 'All' : 'Completed'))}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            statusFilter === 'Completed'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Completed Batches</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-emerald-800 mt-2 tabular-nums">
            {completedBatches}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Cleared for dispatch · Click to filter</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(prev => (prev === 'DueSoon' ? 'All' : 'DueSoon'))}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            statusFilter === 'DueSoon'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Target Deadlines</span>
            <Calendar className="w-4 h-4 text-[#3B2418]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#3B2418] mt-2 tabular-nums">
            {upcomingDeadlines}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Active & delayed batches · Click to filter</p>
        </button>
      </div>

      {/* Production Batches Table */}
      <div className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 shadow-xs overflow-hidden space-y-2">
        <div className="p-4 border-b border-[#C9A227]/20 flex flex-wrap items-center justify-between gap-2 bg-white/50">
          <h2 className="font-serif font-bold text-base text-[#3B2418]">
            Active Weaving & Assembly Queue ({filteredBatches.length})
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#5A3825]">
            {statusFilter !== 'All' && (
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className="px-2.5 py-1 rounded bg-[#3B2418] text-[#E5C76B] font-semibold text-[11px]"
              >
                Filter: {statusFilter === 'DueSoon' ? 'Target Deadlines' : statusFilter} ×
              </button>
            )}
            <span>Binugao Weaving Sanctuary</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#3B2418] text-[#E5C76B] font-serif uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order / Product</th>
                <th className="py-3 px-4">Design / Motif</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">Target Completion</th>
                <th className="py-3 px-4">Weft Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A227]/15">
              {filteredBatches.map(batch => (
                <tr key={batch.id} className="hover:bg-white/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-serif font-bold text-[#3B2418]">{batch.productName}</div>
                    <div className="text-[10px] text-[#8C6B0F] font-mono mt-0.5">
                      {batch.orderNumber} · {batch.communityCluster}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#5A3825]">
                    <span className="font-medium text-[#3B2418]">{batch.designPattern}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#3B2418]">
                    {batch.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-[#5A3825]">{batch.startDate}</td>
                  <td className="py-3.5 px-4 text-[#5A3825]">{batch.targetCompletion}</td>
                  <td className="py-3.5 px-4 w-44">
                    <div className="flex items-center gap-2">
                      <div className="w-full h-2 rounded-full bg-white border border-[#C9A227]/30 overflow-hidden">
                        <div
                          style={{ width: `${batch.progressPercentage}%` }}
                          className={`h-full transition-all duration-500 ${
                            batch.progressPercentage === 100 ? 'bg-emerald-700' : 'bg-[#C9A227]'
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#3B2418] w-10 text-right">
                        {batch.progressPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(batch.status)}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleOpenDetail(batch)}
                      className="px-3 py-1 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Detail & Progress Update Modal */}
      {selectedBatch && (
        <Modal
          isOpen={!!selectedBatch}
          onClose={() => setSelectedBatch(null)}
          title={`Loom Progress: ${selectedBatch.productName}`}
          subtitle={`Batch Order: ${selectedBatch.orderNumber} · Cluster: ${selectedBatch.communityCluster}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-[#24150F]">
            {/* Overview Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-[#C9A227]/25 text-xs">
              <div>
                <span className="text-stone-500 text-[10px] uppercase font-semibold">Assigned Weaver:</span>
                <p className="font-serif font-bold text-[#3B2418] mt-0.5">{selectedBatch.assignedArtisan}</p>
              </div>
              <div>
                <span className="text-stone-500 text-[10px] uppercase font-semibold">Target Units:</span>
                <p className="font-mono font-bold text-[#3B2418] mt-0.5">{selectedBatch.quantity} Pieces</p>
              </div>
              <div>
                <span className="text-stone-500 text-[10px] uppercase font-semibold">Start Date:</span>
                <p className="font-mono text-[#5A3825] mt-0.5">{selectedBatch.startDate}</p>
              </div>
              <div>
                <span className="text-stone-500 text-[10px] uppercase font-semibold">Target Due:</span>
                <p className="font-mono font-bold text-[#8C6B0F] mt-0.5">{selectedBatch.targetCompletion}</p>
              </div>
            </div>

            {/* Step Progress Bar Selector */}
            <div className="space-y-3 bg-[#FAF6ED] p-4 rounded-xl border border-[#C9A227]/30">
              <div className="flex justify-between items-center">
                <label className="font-serif font-bold text-sm text-[#3B2418] uppercase tracking-wider">
                  Update Stage Completion:
                </label>
                <span className="font-mono font-bold text-base text-[#8C6B0F]">
                  {modalProgress}% Completed
                </span>
              </div>

              {/* Progress Bar Visual */}
              <div className="w-full h-3 rounded-full bg-white border border-[#C9A227]/40 overflow-hidden">
                <div
                  style={{ width: `${modalProgress}%` }}
                  className={`h-full transition-all duration-300 ${
                    modalProgress === 100 ? 'bg-emerald-700' : 'bg-[#C9A227]'
                  }`}
                />
              </div>

              {/* 5-Step Segment Buttons (0%, 25%, 50%, 75%, 100%) */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {[0, 25, 50, 75, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleApplyProgress(val)}
                    className={`py-2 rounded font-mono text-xs font-bold transition-all ${
                      modalProgress === val
                        ? 'bg-[#3B2418] text-[#E5C76B] ring-2 ring-[#C9A227]'
                        : 'bg-white border border-[#C9A227]/30 text-[#5A3825] hover:bg-[#F8F3E7]'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-[#5A3825]/80 flex justify-between pt-1">
                <span>0%: Warping setup</span>
                <span>50%: Center motif ikat</span>
                <span>100%: Inspection ready</span>
              </div>
            </div>

            {/* Artisan Notes */}
            <div>
              <label className="block font-semibold text-[#3B2418] uppercase tracking-wider mb-1">
                Weaving Log & Quality Inspection Notes:
              </label>
              <textarea
                rows={3}
                value={modalNotes}
                onChange={e => setModalNotes(e.target.value)}
                placeholder="Log natural dye absorption, weft tension, or seed beading details..."
                className="w-full px-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-[#C9A227]/25">
              <button
                type="button"
                onClick={() => handleApplyProgress(25)}
                className="w-full sm:w-auto px-4 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Start Production</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    await handleApplyProgress(modalProgress);
                    setSelectedBatch(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-[#FAF6ED] border border-stone-300 rounded font-medium text-xs text-stone-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Progress'}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleCompleteBatch}
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50 rounded font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Mark as Completed</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
