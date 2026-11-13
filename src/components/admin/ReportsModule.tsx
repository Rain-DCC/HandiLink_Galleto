import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { gatewayFetch } from '../../services/apiClient';
import {
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const ReportsModule: React.FC = () => {
  const { orders, products, batches, materials, proposals, payments, paymentSummary } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<
    'sales' | 'orders' | 'production' | 'inventory' | 'products' | 'proposals'
  >('sales');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    setExportError(null);
    setExportNotice(null);
    try {
      if (format === 'csv') {
        const csvContent = await gatewayFetch<string>(
          `/analytics/reports/export?type=${activeReportTab}&format=csv`
        );
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `handilink_${activeReportTab}_report.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        const jsonData = await gatewayFetch<any>(
          `/analytics/reports/export?type=${activeReportTab}&format=json`
        );
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
          type: 'application/json;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `handilink_${activeReportTab}_report.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

      setExportNotice(`Downloaded handilink_${activeReportTab}_report.${format}`);
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err: any) {
      setExportError(err?.message || 'Unable to export report.');
    } finally {
      setIsExporting(false);
    }
  };

  const avgBatchProgress =
    batches.length > 0
      ? (batches.reduce((acc, b) => acc + b.progressPercentage, 0) / batches.length).toFixed(1)
      : '0.0';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Data Flow Process 11.0 · Analytics & Reporting Microservice
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            Reports & Cultural Accountability
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Download authenticated CSV / JSON datasets from SQLite for General Assembly audits, DTI compliance, and NCIP oversight
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={isExporting}
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C9A227]" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#C9A227]" />
            )}
            <span>Export CSV</span>
          </button>
          <button
            disabled={isExporting}
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {exportError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Report Tabs */}
      <div className="bg-[#FAF6ED] p-4 rounded-xl border border-[#C9A227]/30 shadow-xs flex flex-wrap gap-1.5">
        {[
          { id: 'sales', label: 'Sales & Trust Split' },
          { id: 'orders', label: 'Orders Ledger' },
          { id: 'production', label: 'Production Looms' },
          { id: 'inventory', label: 'Material Inventory' },
          { id: 'products', label: 'Product Catalogue' },
          { id: 'proposals', label: 'NCIP Proposals' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeReportTab === tab.id
                ? 'bg-[#3B2418] text-[#E5C76B] shadow-xs'
                : 'bg-white text-[#5A3825] hover:bg-white/80 border border-[#C9A227]/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Report Content Container */}
      <div className="bg-[#FAF6ED] p-6 rounded-xl border border-[#C9A227]/30 shadow-xs space-y-5">
        {activeReportTab === 'sales' && (
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-base text-[#3B2418]">
              Consolidated Sales & Fair-Trade Remittance Ledger
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-[#C9A227]/25 text-xs">
                <span className="text-[#5A3825]">Gross Commercial Volume:</span>
                <p className="font-mono text-xl font-bold text-[#3B2418] mt-1">
                  ₱{(paymentSummary.totalGross || orders.reduce((acc, o) => acc + o.total, 0)).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#C9A227]/25 text-xs">
                <span className="text-[#5A3825]">Artisan Direct Share (82%):</span>
                <p className="font-mono text-xl font-bold text-emerald-800 mt-1">
                  ₱{(paymentSummary.disbursedArtisanShare || Math.round(orders.reduce((acc, o) => acc + o.total, 0) * 0.82)).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#C9A227]/25 text-xs">
                <span className="text-[#5A3825]">Community Trust Fund (18%):</span>
                <p className="font-mono text-xl font-bold text-[#8C6B0F] mt-1">
                  ₱{(paymentSummary.accruedTrustFund || Math.round(orders.reduce((acc, o) => acc + o.total, 0) * 0.18)).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg border border-[#C9A227]/25">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#3B2418] text-[#E5C76B] text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Artisan 82%</th>
                    <th className="py-2.5 px-3 text-right">Trust 18%</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A227]/15">
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-bold text-[#3B2418]">{p.orderNumber}</td>
                      <td className="py-2 px-3 font-mono">{p.referenceCode}</td>
                      <td className="py-2 px-3">{p.paymentMethod}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">₱{p.amount.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-800">₱{p.artisanShare.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-[#8C6B0F]">₱{p.trustFundShare.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <Badge variant={p.status === 'Paid' ? 'green' : 'amber'}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReportTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-base text-[#3B2418]">
              Commercial Orders Report ({orders.length} Total)
            </h2>
            <div className="overflow-x-auto bg-white rounded-lg border border-[#C9A227]/25">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#3B2418] text-[#E5C76B] text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Order Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A227]/15">
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td className="py-2 px-3 font-mono font-bold">{o.orderNumber}</td>
                      <td className="py-2 px-3">{o.date}</td>
                      <td className="py-2 px-3 font-medium">{o.customerName}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">₱{o.total.toLocaleString()}</td>
                      <td className="py-2 px-3">{o.paymentStatus}</td>
                      <td className="py-2 px-3">{o.orderStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReportTab === 'production' && (
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-base text-[#3B2418]">
              Loom Utilization & Yield Report
            </h2>
            <p className="text-xs text-[#5A3825]">
              Total Loom Batches: <span className="font-mono font-bold text-[#3B2418]">{batches.length}</span> · Average completion rate: <span className="font-mono font-bold text-emerald-800">{avgBatchProgress}%</span>
            </p>
            <div className="overflow-x-auto bg-white rounded-lg border border-[#C9A227]/25">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#3B2418] text-[#E5C76B] text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Pattern</th>
                    <th className="py-2.5 px-3">Weaver</th>
                    <th className="py-2.5 px-3 text-right">Progress</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A227]/15">
                  {batches.map(b => (
                    <tr key={b.id}>
                      <td className="py-2 px-3 font-mono font-bold">{b.orderNumber}</td>
                      <td className="py-2 px-3">{b.productName}</td>
                      <td className="py-2 px-3">{b.designPattern}</td>
                      <td className="py-2 px-3">{b.assignedArtisan}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{b.progressPercentage}%</td>
                      <td className="py-2 px-3">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReportTab === 'inventory' && (
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-base text-[#3B2418]">
              Material Stock Reserves & Depletion Audit
            </h2>
            <p className="text-xs text-[#5A3825]">
              Total Material Items: <span className="font-mono font-bold text-[#3B2418]">{materials.length}</span> · Low/Out of Stock: <span className="font-mono font-bold text-amber-800">{materials.filter(m => m.status !== 'Available').length}</span>
            </p>
            <div className="overflow-x-auto bg-white rounded-lg border border-[#C9A227]/25">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#3B2418] text-[#E5C76B] text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Stock</th>
                    <th className="py-2.5 px-3 text-right">Min</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A227]/15">
                  {materials.map(m => (
                    <tr key={m.id}>
                      <td className="py-2 px-3 font-mono font-bold">{m.code}</td>
                      <td className="py-2 px-3 font-medium">{m.name}</td>
                      <td className="py-2 px-3">{m.category}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{m.currentStock} {m.unit}</td>
                      <td className="py-2 px-3 text-right font-mono">{m.minimumStock} {m.unit}</td>
                      <td className="py-2 px-3">{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReportTab === 'products' && (
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-base text-[#3B2418]">
              Catalogue Provenance Report ({products.length} Creations)
            </h2>
            <div className="overflow-x-auto bg-white rounded-lg border border-[#C9A227]/25">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#3B2418] text-[#E5C76B] text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Creation</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Weaver</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A227]/15">
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-bold">{p.code}</td>
                      <td className="py-2 px-3 font-medium">{p.name}</td>
                      <td className="py-2 px-3">{p.category}</td>
                      <td className="py-2 px-3">{p.artisan}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">₱{p.price.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono">{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReportTab === 'proposals' && (
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-base text-[#3B2418]">
              Institutional Proposals & Legal Resolution Tracker ({proposals.length} Total)
            </h2>
            <div className="overflow-x-auto bg-white rounded-lg border border-[#C9A227]/25">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#3B2418] text-[#E5C76B] text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Proposal #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Organization</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A227]/15">
                  {proposals.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-bold">{p.proposalNumber}</td>
                      <td className="py-2 px-3">{p.date}</td>
                      <td className="py-2 px-3">{p.organization}</td>
                      <td className="py-2 px-3 font-medium">{p.subject}</td>
                      <td className="py-2 px-3">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Universal Audit Stamp */}
        <div className="pt-4 border-t border-[#C9A227]/20 flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#5A3825]/80 gap-2">
          <span>Certified true copy by BIBATAWA Board of Directors & Tribal Council</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-[#3B2418] font-bold hover:underline"
          >
            <Printer className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Print Current Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
