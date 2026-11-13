import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import {
  Search,
  CheckCircle2,
  Clock,
  Printer,
  TrendingUp,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const SalesPaymentModule: React.FC = () => {
  const { orders, payments, paymentSummary, updatePaymentStatus } = useApp();

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalSalesAmount =
    paymentSummary.totalGross > 0
      ? paymentSummary.totalGross
      : orders.reduce((acc, o) => acc + o.total, 0);
  const artisanShareTotal =
    paymentSummary.disbursedArtisanShare > 0
      ? paymentSummary.disbursedArtisanShare
      : Math.round(totalSalesAmount * 0.82);
  const trustFundTotal =
    paymentSummary.accruedTrustFund > 0
      ? paymentSummary.accruedTrustFund
      : Math.round(totalSalesAmount * 0.18);
  const pendingPayments = orders.filter(o => o.paymentStatus !== 'Paid').length;
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid').length;

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.paymentMethod.toLowerCase().includes(search.toLowerCase());
    const matchesPayment = paymentFilter === 'All' || o.paymentStatus === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const handleSetPaymentStatus = async (orderId: string, status: Order['paymentStatus']) => {
    setIsUpdating(true);
    try {
      await updatePaymentStatus(orderId, status);
      setSelectedOrder(prev => (prev ? { ...prev, paymentStatus: status } : null));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Data Flow Process 9.0 · Payment & Trust Microservice
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            Sales & Fair-Trade Settlements
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Real-time reconciliation of GCash, Maya, Landbank settlements with automated 82% Artisan / 18% Trust Fund split
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-[#C9A227]" />
          <span>Print Financial Statement</span>
        </button>
      </div>

      {/* KPI Cards (Interactive Payment Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setPaymentFilter('All')}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            paymentFilter === 'All'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Total Gross Volume</span>
            <TrendingUp className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#3B2418] mt-2 tabular-nums">
            ₱{totalSalesAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">{orders.length} ledger transactions · Show all</p>
        </button>

        <button
          type="button"
          onClick={() => setPaymentFilter(prev => (prev === 'Paid' ? 'All' : 'Paid'))}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            paymentFilter === 'Paid'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Artisan Direct Share (82%)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-emerald-800 mt-2 tabular-nums">
            ₱{artisanShareTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">{paidOrders} cleared orders · Filter Paid</p>
        </button>

        <button
          type="button"
          onClick={() => setPaymentFilter(prev => (prev === 'Processing' ? 'All' : 'Processing'))}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            paymentFilter === 'Processing'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Heritage Trust Fund (18%)</span>
            <ShieldCheck className="w-4 h-4 text-[#8C6B0F]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#8C6B0F] mt-2 tabular-nums">
            ₱{trustFundTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Community dye & loom · Filter Processing</p>
        </button>

        <button
          type="button"
          onClick={() => setPaymentFilter(prev => (prev === 'Pending' ? 'All' : 'Pending'))}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            paymentFilter === 'Pending'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Pending Verification</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-amber-800 mt-2 tabular-nums">
            {pendingPayments} Invoices
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">
            ₱{paymentSummary.pendingReceivables.toLocaleString()} · Filter Pending
          </p>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-[#FAF6ED] p-4 rounded-xl border border-[#C9A227]/30 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search order #, customer, method..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F] placeholder-[#5A3825]/60 focus:border-[#C9A227]"
          />
          <Search className="w-4 h-4 text-[#5A3825]/60 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <span className="text-xs text-[#5A3825] font-medium">Payment Status:</span>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded border border-[#C9A227]/40 bg-white text-[#3B2418] font-medium"
          >
            <option value="All">All Invoices</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#3B2418] text-[#E5C76B] font-serif uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order / Ref</th>
                <th className="py-3 px-4">Customer / Legal Entity</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Gross (₱)</th>
                <th className="py-3 px-4 text-right">Artisan 82%</th>
                <th className="py-3 px-4 text-right">Trust 18%</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A227]/15">
              {filteredOrders.map(ord => {
                const paymentRec = payments.find(p => p.orderId === ord.id);
                const artisanCut = paymentRec?.artisanShare ?? Math.round(ord.total * 0.82);
                const trustCut = paymentRec?.trustFundShare ?? Math.round(ord.total * 0.18);
                return (
                  <tr key={ord.id} className="hover:bg-white/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-[#3B2418]">{ord.orderNumber}</div>
                      {paymentRec?.referenceCode && (
                        <div className="font-mono text-[10px] text-[#8C6B0F]">{paymentRec.referenceCode}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#3B2418]">{ord.customerName}</div>
                      <div className="text-[10px] text-[#5A3825]/75">{ord.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#5A3825] whitespace-nowrap">{ord.date}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#3B2418]">
                      ₱{ord.total.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-800 font-semibold">
                      ₱{artisanCut.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#8C6B0F] font-semibold">
                      ₱{trustCut.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-[#5A3825] whitespace-nowrap">
                      <span className="font-medium text-[#3B2418]">{ord.paymentMethod}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          ord.paymentStatus === 'Paid'
                            ? 'green'
                            : ord.paymentStatus === 'Refunded'
                            ? 'crimson'
                            : 'amber'
                        }
                      >
                        {ord.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded text-[11px] font-semibold transition-colors shadow-2xs"
                      >
                        Audit Slip
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Remittance Verification: ${selectedOrder.orderNumber}`}
          subtitle={`Channel: ${selectedOrder.paymentMethod} · Date: ${selectedOrder.date}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-[#24150F]">
            <div className="bg-white p-5 rounded-xl border border-[#C9A227]/30 space-y-3">
              <div className="flex justify-between border-b border-[#C9A227]/20 pb-2">
                <span className="text-[#5A3825]">Customer / Payer:</span>
                <span className="font-semibold text-[#3B2418]">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A3825]">Items Total (Gross):</span>
                <span className="font-mono font-bold text-[#3B2418]">₱{selectedOrder.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A3825]">Artisan Direct Share (82%):</span>
                <span className="font-mono text-emerald-800 font-bold">
                  ₱{Math.round(selectedOrder.total * 0.82).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A3825]">Community Heritage Trust Fund (18%):</span>
                <span className="font-mono text-[#8C6B0F] font-bold">
                  ₱{Math.round(selectedOrder.total * 0.18).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#C9A227]/20 pt-2">
                <span className="text-[#5A3825]">Payment Verification:</span>
                <span className="font-bold text-[#3B2418]">{selectedOrder.paymentStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                disabled={isUpdating || selectedOrder.paymentStatus === 'Paid'}
                onClick={() => handleSetPaymentStatus(selectedOrder.id, 'Paid')}
                className="py-2.5 px-3 bg-emerald-800 text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-emerald-900 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Verify Paid</span>
              </button>
              <button
                disabled={isUpdating || selectedOrder.paymentStatus === 'Processing'}
                onClick={() => handleSetPaymentStatus(selectedOrder.id, 'Processing')}
                className="py-2.5 px-3 bg-amber-700 text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-amber-800 disabled:opacity-50"
              >
                Mark Processing
              </button>
              <button
                disabled={isUpdating || selectedOrder.paymentStatus === 'Refunded'}
                onClick={() => handleSetPaymentStatus(selectedOrder.id, 'Refunded')}
                className="py-2.5 px-3 bg-rose-700 text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-rose-800 disabled:opacity-50"
              >
                Mark Refunded
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-[#3B2418] text-[#E5C76B] rounded font-semibold text-xs uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
