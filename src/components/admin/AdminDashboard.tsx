import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { gatewayFetch } from '../../services/apiClient';
import {
  Users,
  FileText,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  ShieldAlert,
  Truck,
  ScanEye,
  Mic,
  UserCheck,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface AnalyticsOverview {
  kpis: {
    totalUsers: number;
    pendingArtisans: number;
    totalProducts: number;
    pendingProposals: number;
    activeOrders: number;
    activeBatches: number;
    totalSales: number;
    lowStockCount: number;
    artisanShareTotal: number;
    trustFundTotal: number;
  };
  salesByMethod: Array<{ method: string; count: number; total: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
}

export const AdminDashboard: React.FC = () => {
  const {
    products,
    orders,
    proposals,
    materials,
    batches,
    users,
    paymentSummary,
    shipments,
    setCurrentView,
  } = useApp();

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    let mounted = true;
    gatewayFetch<AnalyticsOverview>('/analytics/overview')
      .then(data => {
        if (mounted) setOverview(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [orders.length, proposals.length, materials.length, users.length]);

  const kpis = overview?.kpis;
  const totalUsers = kpis?.totalUsers ?? users.length;
  const pendingArtisans =
    kpis?.pendingArtisans ?? users.filter(u => u.role === 'artisan_weaver' && !u.verified).length;
  const totalProducts = kpis?.totalProducts ?? products.length;
  const pendingProposals =
    kpis?.pendingProposals ??
    proposals.filter(p => p.status === 'Submitted' || p.status === 'Under Review').length;
  const activeOrders =
    kpis?.activeOrders ??
    orders.filter(o => o.orderStatus !== 'Completed' && o.orderStatus !== 'Cancelled').length;
  const productionBatchesCount =
    kpis?.activeBatches ??
    batches.filter(b => b.status === 'Pending' || b.status === 'In Production').length;
  const totalSales = kpis?.totalSales ?? orders.reduce((acc, o) => acc + o.total, 0);
  const lowStockCount =
    kpis?.lowStockCount ??
    materials.filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock').length;

  const artisanShareTotal =
    paymentSummary.disbursedArtisanShare > 0
      ? paymentSummary.disbursedArtisanShare
      : kpis?.artisanShareTotal ?? Math.round(totalSales * 0.82);
  const trustFundTotal =
    paymentSummary.accruedTrustFund > 0
      ? paymentSummary.accruedTrustFund
      : kpis?.trustFundTotal ?? Math.round(totalSales * 0.18);

  const salesByMethod = overview?.salesByMethod?.length
    ? overview.salesByMethod
    : Object.values(
        orders.reduce<Record<string, { method: string; count: number; total: number }>>((acc, o) => {
          const m = o.paymentMethod || 'GCash';
          if (!acc[m]) acc[m] = { method: m, count: 0, total: 0 };
          acc[m].count += 1;
          acc[m].total += o.total;
          return acc;
        }, {})
      );

  const maxMethodTotal = Math.max(1, ...salesByMethod.map(s => s.total));

  const craftTypes = [
    'Backstrap Loom Inabal',
    'Beadwork & Brass',
    'Hand Embroidery',
    'Natural Dyeing',
  ] as const;

  const productionByCraft = craftTypes.map(craft => {
    const matchingProducts = products.filter(p => p.craftType === craft);
    const matchingBatches = batches.filter(b =>
      matchingProducts.some(p => p.code === b.productCode)
    );
    const avgProgress =
      matchingBatches.length > 0
        ? Math.round(
            matchingBatches.reduce((sum, b) => sum + b.progressPercentage, 0) /
              matchingBatches.length
          )
        : matchingProducts.length > 0
        ? 45
        : 0;
    return {
      craft,
      productsCount: matchingProducts.length,
      batchesCount: matchingBatches.length,
      capacity: avgProgress,
    };
  });

  const pendingDeliveries = shipments.filter(s => s.status !== 'Delivered').length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Executive Governance Console · API Gateway Live
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            BIBATAWA Administrative Center
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Binugao Ancestral Domain, Toril, Davao City · SQLite-backed operational intelligence
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentView('users')}
            className="px-3.5 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Verify Artisans ({pendingArtisans})</span>
          </button>
          <button
            onClick={() => setCurrentView('reports')}
            className="px-3.5 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs transition-colors"
          >
            Generate Audit Reports
          </button>
          <button
            onClick={() => setCurrentView('proposals')}
            className="px-4 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs tracking-wider uppercase transition-colors shadow-xs"
          >
            Proposals ({pendingProposals})
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setCurrentView('sales')}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A3825]">Total Association Sales</span>
            <div className="w-8 h-8 rounded-lg bg-[#C9A227]/20 group-hover:bg-[#3B2418] flex items-center justify-center text-[#8C6B0F] group-hover:text-[#E5C76B] transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#3B2418] mt-2 tabular-nums">
            ₱{totalSales.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
            <span>Artisan Share: ₱{artisanShareTotal.toLocaleString()}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('customer_orders')}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A3825]">Active Commercial Orders</span>
            <div className="w-8 h-8 rounded-lg bg-[#3B2418]/10 group-hover:bg-[#3B2418] flex items-center justify-center text-[#3B2418] group-hover:text-[#E5C76B] transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#3B2418] mt-2 tabular-nums">
            {activeOrders}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">
            {pendingDeliveries} shipment(s) in logistics pipeline
          </p>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('proposals')}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A3825]">Pending Proposals</span>
            <div className="w-8 h-8 rounded-lg bg-[#8C6B0F]/15 group-hover:bg-[#3B2418] flex items-center justify-center text-[#8C6B0F] group-hover:text-[#E5C76B] transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#8C6B0F] mt-2 tabular-nums">
            {pendingProposals}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">
            {proposals.length} total proposals on record
          </p>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('inventory')}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A3825]">Material Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 group-hover:bg-rose-700 flex items-center justify-center text-rose-700 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-rose-800 mt-2 tabular-nums">
            {lowStockCount} Items
          </div>
          <p className="text-[11px] text-rose-700/80 mt-1">
            {lowStockCount > 0 ? 'Requires weaver supply replenishment' : 'All raw fibers healthy'}
          </p>
        </button>
      </div>

      {/* Secondary Quick Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-white p-4 rounded-xl border border-[#C9A227]/25 text-xs">
        <button
          type="button"
          onClick={() => setCurrentView('users')}
          className="text-left p-2 rounded-lg hover:bg-[#FAF6ED] transition-colors"
        >
          <span className="text-[#5A3825]/70 block font-medium">Registered Accounts</span>
          <span className="font-mono font-bold text-base text-[#3B2418]">
            {totalUsers} Users · {pendingArtisans} Pending
          </span>
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('catalogue')}
          className="text-left p-2 rounded-lg hover:bg-[#FAF6ED] transition-colors"
        >
          <span className="text-[#5A3825]/70 block font-medium">Catalogued Creations</span>
          <span className="font-mono font-bold text-base text-[#3B2418]">{totalProducts} Creations</span>
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('artisan_production')}
          className="text-left p-2 rounded-lg hover:bg-[#FAF6ED] transition-colors"
        >
          <span className="text-[#5A3825]/70 block font-medium">Loom Batches Active</span>
          <span className="font-mono font-bold text-base text-[#8C6B0F]">
            {productionBatchesCount} Active Batches
          </span>
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('sales')}
          className="text-left p-2 rounded-lg hover:bg-[#FAF6ED] transition-colors"
        >
          <span className="text-[#5A3825]/70 block font-medium">Heritage Trust Fund (18%)</span>
          <span className="font-mono font-bold text-base text-emerald-800">
            ₱{trustFundTotal.toLocaleString()}
          </span>
        </button>
      </div>

      {/* Microservice Quick Launch Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { id: 'audit_logs' as const, label: 'Security Audit Logs', icon: ShieldAlert },
          { id: 'users' as const, label: 'User & Artisan Registry', icon: Users },
          { id: 'logistics' as const, label: 'Shipping & Logistics', icon: Truck },
          { id: 'pattern_vision' as const, label: 'Pattern Vision AI', icon: ScanEye },
          { id: 'cebuano_speech' as const, label: 'Cebuano Speech AI', icon: Mic },
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
              <span className="text-xs font-bold text-[#3B2418] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Chart: Sales by Settlement Channel */}
        <div className="lg:col-span-7 bg-[#FAF6ED] p-6 rounded-xl border border-[#C9A227]/30 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#C9A227]/20 pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-[#3B2418]">
                Settlement Channel Breakdown
              </h2>
              <p className="text-xs text-[#5A3825]/80">
                Real-time gross commercial volume across verified payment channels
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#8C6B0F]">
              Total ₱{totalSales.toLocaleString()}
            </span>
          </div>

          <div className="pt-4 pb-2">
            {salesByMethod.length === 0 ? (
              <p className="text-xs text-[#5A3825]/70 py-12 text-center">
                No commercial orders recorded yet.
              </p>
            ) : (
              <div className="h-52 flex items-end justify-around gap-3 sm:gap-4 px-2 border-b border-[#C9A227]/30">
                {salesByMethod.map(item => {
                  const pct = Math.max(14, Math.round((item.total / maxMethodTotal) * 100));
                  return (
                    <button
                      key={item.method}
                      type="button"
                      onClick={() => setCurrentView('sales')}
                      className="h-full flex-1 flex flex-col items-center justify-end gap-1.5 group focus:outline-hidden"
                      title={`${item.method}: ${item.count} orders (₱${item.total.toLocaleString()})`}
                    >
                      <span className="text-[11px] font-mono font-bold text-[#3B2418] shrink-0">
                        ₱{item.total.toLocaleString()}
                      </span>
                      <div className="flex-1 w-full flex items-end justify-center min-h-0">
                        <div
                          style={{ height: `${pct}%` }}
                          className="w-full max-w-[56px] rounded-t-md bg-gradient-to-t from-[#3B2418] to-[#C9A227] group-hover:brightness-110 transition-all shadow-xs"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#5A3825] group-hover:text-[#3B2418] text-center shrink-0 pb-1">
                        {item.method} ({item.count})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5A3825]/75 pt-1">
            <span>• Direct Fair-Trade Margin: 82% (₱{artisanShareTotal.toLocaleString()})</span>
            <span>• Heritage Trust Surcharge: 18% (₱{trustFundTotal.toLocaleString()})</span>
          </div>
        </div>

        {/* Right Chart: Production Capacity & Loom Allocation */}
        <div className="lg:col-span-5 bg-[#FAF6ED] p-6 rounded-xl border border-[#C9A227]/30 shadow-xs flex flex-col justify-between space-y-4">
          <div className="border-b border-[#C9A227]/20 pb-3">
            <h2 className="font-serif font-bold text-base text-[#3B2418]">
              Artisan Production Overview
            </h2>
            <p className="text-xs text-[#5A3825]/80">
              Live progress by indigenous craft cluster from Production DB
            </p>
          </div>

          <div className="space-y-3 pt-1 flex-1">
            {productionByCraft.map(item => (
              <button
                key={item.craft}
                type="button"
                onClick={() => setCurrentView('artisan_production')}
                className="w-full text-left space-y-1 p-2 -mx-2 rounded-lg hover:bg-white/80 transition-colors"
              >
                <div className="flex justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#3B2418]">{item.craft}</span>
                  <span className="font-mono text-[#8C6B0F] shrink-0">
                    {item.batchesCount} batch(es) · {item.capacity}% avg
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white border border-[#C9A227]/30 overflow-hidden">
                  <div
                    style={{ width: `${item.capacity}%` }}
                    className="h-full bg-[#C9A227] rounded-full transition-all duration-700"
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#C9A227]/20">
            <button
              onClick={() => setCurrentView('artisan_production')}
              className="w-full py-2 bg-white hover:bg-[#F8F3E7] border border-[#C9A227]/40 text-[#3B2418] font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Manage Loom Batches</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C9A227]" />
            </button>
          </div>
        </div>
      </div>

      {/* Priority Operational Lists Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#FAF6ED] p-6 rounded-xl border border-[#C9A227]/30 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#C9A227]/20 pb-3">
            <h3 className="font-serif font-bold text-base text-[#3B2418]">
              Institutional Proposals
            </h3>
            <button
              onClick={() => setCurrentView('proposals')}
              className="text-xs text-[#8C6B0F] hover:text-[#3B2418] font-bold"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {proposals.length === 0 ? (
              <p className="text-xs text-[#5A3825]/70">No proposals submitted yet.</p>
            ) : (
              proposals.slice(0, 4).map(p => (
                <div
                  key={p.id}
                  onClick={() => setCurrentView('proposals')}
                  className="p-3.5 rounded-lg bg-white border border-[#C9A227]/20 hover:border-[#C9A227] cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#3B2418]">{p.proposalNumber}</span>
                    <Badge variant={p.status === 'Approved' ? 'green' : p.status === 'Rejected' ? 'crimson' : 'amber'}>
                      {p.status}
                    </Badge>
                  </div>
                  <h4 className="font-serif font-semibold text-[#3B2418]">{p.subject}</h4>
                  <p className="text-[11px] text-[#5A3825]/75 mt-0.5 truncate">{p.organization}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#FAF6ED] p-6 rounded-xl border border-[#C9A227]/30 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#C9A227]/20 pb-3">
            <h3 className="font-serif font-bold text-base text-[#3B2418]">
              Material Inventory Health
            </h3>
            <button
              onClick={() => setCurrentView('inventory')}
              className="text-xs text-[#8C6B0F] hover:text-[#3B2418] font-bold"
            >
              Manage Inventory
            </button>
          </div>

          <div className="space-y-3">
            {materials.length === 0 ? (
              <p className="text-xs text-[#5A3825]/70">No materials logged in inventory.</p>
            ) : (
              materials.slice(0, 5).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCurrentView('inventory')}
                  className="w-full text-left p-3 rounded-lg bg-white border border-[#C9A227]/20 hover:border-[#C9A227] flex items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#3B2418] truncate">{m.name}</div>
                    <div className="text-[10px] text-[#5A3825]/70">
                      Category: {m.category} · Min: {m.minimumStock} {m.unit}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-[#3B2418]">
                      {m.currentStock} {m.unit}
                    </span>
                    <div>
                      <Badge variant={m.status === 'Available' ? 'green' : m.status === 'Low Stock' ? 'amber' : 'crimson'}>
                        {m.status}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
