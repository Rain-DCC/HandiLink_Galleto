import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Award,
  Layers,
  Package,
  Plus,
  ArrowRight,
  ScanEye,
  Mic,
  Truck,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const CreativeDirectorDashboard: React.FC = () => {
  const {
    proposals,
    resolutions,
    products,
    orders,
    openProductDetail,
    setCurrentView,
  } = useApp();

  const submittedProposals = proposals.filter(p => p.status === 'Submitted' || p.status === 'Under Review');
  const approvedPartnerships = resolutions.length;
  const publishedProducts = products.filter(p => p.status === 'Published').length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#3B2418] text-[#F8F3E7] rounded-2xl p-6 sm:p-8 border border-[#C9A227]/40 shadow-md relative overflow-hidden bg-woven-pattern">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#E5C76B]">
              Curatorial & Cultural Partnerships Hub
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F3E7] mt-1">
              Creative Director Console
            </h1>
            <p className="text-xs sm:text-sm text-[#F8F3E7]/80 mt-1 max-w-xl">
              Spearheading Bagobo-Tagabawa cultural integrity, institutional endorsements with NCIP, exhibition proposals, and artisan catalogue curation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCurrentView('proposals')}
              className="px-4 py-2 bg-[#C9A227] text-[#24150F] hover:bg-[#E5C76B] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Proposal</span>
            </button>
            <button
              onClick={() => setCurrentView('catalogue')}
              className="px-4 py-2 bg-[#5A3825] text-[#F8F3E7] hover:bg-[#C9A227] hover:text-[#3B2418] border border-[#C9A227]/40 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Manage Catalogue</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setCurrentView('proposals')}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Submitted Proposals</span>
            <FileText className="w-4 h-4 text-[#8C6B0F]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#3B2418] mt-2 tabular-nums">
            {submittedProposals.length}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Under review with NCIP & DTI</p>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('resolutions')}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Approved Partnerships</span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-emerald-800 mt-2 tabular-nums">
            {approvedPartnerships}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Signed resolutions</p>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('catalogue')}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Published Catalogue</span>
            <Layers className="w-4 h-4 text-[#3B2418]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#3B2418] mt-2 tabular-nums">
            {publishedProducts}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Verified cultural designs</p>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('customer_orders')}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Recent Commissions</span>
            <Package className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#3B2418] mt-2 tabular-nums">
            {orders.length}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Active customer orders</p>
        </button>
      </div>

      {/* Quick Microservice Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { id: 'resolutions' as const, label: 'Partnership Resolutions', icon: Award },
          { id: 'pattern_vision' as const, label: 'Pattern Vision AI', icon: ScanEye },
          { id: 'cebuano_speech' as const, label: 'Cebuano Speech AI', icon: Mic },
          { id: 'logistics' as const, label: 'Shipping & Logistics', icon: Truck },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className="p-3.5 bg-[#FAF6ED] hover:bg-white border border-[#C9A227]/30 hover:border-[#C9A227] rounded-xl text-left flex items-center gap-2.5 transition-all shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-[#3B2418] text-[#E5C76B] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#3B2418]">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-[#FAF6ED] p-6 rounded-xl border border-[#C9A227]/30 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#C9A227]/20 pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-[#3B2418]">
                Institutional Proposals & Letters of Intent
              </h2>
              <p className="text-xs text-[#5A3825]/80">Governing FPIC approvals and research grants</p>
            </div>
            <button
              onClick={() => setCurrentView('proposals')}
              className="text-xs text-[#8C6B0F] hover:text-[#3B2418] font-bold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {proposals.length === 0 ? (
              <div className="p-6 bg-white rounded-lg border border-[#C9A227]/20 text-center text-xs text-[#5A3825]/70">
                No proposals drafted yet. Click "Create Proposal" to prepare a formal letter of intent.
              </div>
            ) : (
              proposals.map(p => (
                <div
                  key={p.id}
                  onClick={() => setCurrentView('proposals')}
                  className="p-4 rounded-lg bg-white border border-[#C9A227]/25 hover:border-[#C9A227] cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#3B2418]">{p.proposalNumber}</span>
                    <Badge variant={p.status === 'Approved' ? 'green' : p.status === 'Rejected' ? 'crimson' : 'amber'}>
                      {p.status}
                    </Badge>
                  </div>
                  <h3 className="font-serif font-bold text-sm text-[#3B2418]">{p.subject}</h3>
                  <p className="text-xs text-[#5A3825]/80 line-clamp-2">{p.letterContent}</p>
                  <div className="pt-2 border-t border-[#C9A227]/15 flex items-center justify-between text-[11px] text-[#5A3825]/70">
                    <span>To: {p.organization}</span>
                    <span>Submitted: {p.submittedDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FAF6ED] p-6 rounded-xl border border-[#C9A227]/30 shadow-xs space-y-4">
            <div className="border-b border-[#C9A227]/20 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-base text-[#3B2418]">
                  Curated Published Products
                </h2>
                <p className="text-xs text-[#5A3825]/80">Currently displayed in the public catalogue</p>
              </div>
              <button
                onClick={() => setCurrentView('catalogue')}
                className="text-xs text-[#8C6B0F] hover:text-[#3B2418] font-bold"
              >
                Edit
              </button>
            </div>

            <div className="space-y-3">
              {products.length === 0 ? (
                <p className="text-xs text-[#5A3825]/70">No products in catalogue yet.</p>
              ) : (
                products.slice(0, 3).map(prod => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => openProductDetail(prod)}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg bg-white border border-[#C9A227]/20 hover:border-[#C9A227] transition-colors"
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-12 h-12 object-cover rounded border border-[#C9A227]/30 shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <h4 className="font-serif font-bold text-[#3B2418] truncate">{prod.name}</h4>
                      <p className="text-[11px] text-[#5A3825]">Weaver: {prod.artisan}</p>
                      <span className="font-mono font-bold text-[#8C6B0F]">₱{prod.price.toLocaleString()}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setCurrentView('catalogue')}
              className="w-full py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-semibold text-xs tracking-wider uppercase rounded transition-colors text-center"
            >
              Add New Cultural Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
