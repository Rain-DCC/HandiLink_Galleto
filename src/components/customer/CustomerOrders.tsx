import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import {
  Search,
  Printer,
  Truck,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const CustomerOrders: React.FC = () => {
  const { orders, currentRole, updateOrderStatus } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const canManageOrders = ['admin', 'creative_director', 'artisan_weaver'].includes(currentRole);

  const handleStatusUpdate = async (orderId: string, nextStatus: Order['orderStatus']) => {
    setIsUpdatingStatus(true);
    try {
      await updateOrderStatus(orderId, nextStatus);
      setSelectedOrder(prev => (prev && prev.id === orderId ? { ...prev, orderStatus: nextStatus } : prev));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Show orders (already RBAC-scoped by backend OrderWorkflowService)
  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOrderStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'Completed': return <Badge variant="green">{status}</Badge>;
      case 'In Production': return <Badge variant="gold">{status}</Badge>;
      case 'Ready': return <Badge variant="green">{status}</Badge>;
      case 'Confirmed': return <Badge variant="brown">{status}</Badge>;
      case 'Cancelled': return <Badge variant="crimson">{status}</Badge>;
      default: return <Badge variant="amber">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'Paid': return <Badge variant="green">Paid</Badge>;
      case 'Processing': return <Badge variant="amber">Processing</Badge>;
      case 'Refunded': return <Badge variant="crimson">Refunded</Badge>;
      default: return <Badge variant="amber">Pending</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418]">
            Order Management & Tracking
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80 mt-1">
            Real-time status of Bagobo-Tagabawa weaving commissions, payment settlements, and dispatch
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#FAF6ED] p-4 rounded-xl border border-[#C9A227]/30 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by order #, patron, item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F] placeholder-[#5A3825]/60 focus:border-[#C9A227]"
          />
          <Search className="w-4 h-4 text-[#5A3825]/60 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#5A3825] font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded border border-[#C9A227]/40 bg-white text-[#3B2418] font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Production">In Production</option>
            <option value="Ready">Ready</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#3B2418] text-[#E5C76B] font-serif uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Particulars</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Production</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A227]/15">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#5A3825]/70">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-white/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#3B2418]">
                      {ord.orderNumber}
                      {ord.shipment && (
                        <div className="text-[10px] font-normal text-[#8C6B0F] mt-0.5">
                          {ord.shipment.trackingNumber} ({ord.shipment.status})
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#5A3825] whitespace-nowrap">{ord.date}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#3B2418]">{ord.customerName}</div>
                      <div className="text-[10px] text-[#5A3825]/70 truncate max-w-[150px]">{ord.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="truncate text-[#3B2418]">
                        {ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                      </div>
                      {ord.assignedArtisan && (
                        <div className="text-[10px] text-[#8C6B0F] mt-0.5">
                          Artisan: {ord.assignedArtisan}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#3B2418] tabular-nums">
                      ₱{ord.total.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPaymentStatusBadge(ord.paymentStatus)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={ord.productionStatus === 'Completed' ? 'green' : 'gold'}>
                        {ord.productionStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getOrderStatusBadge(ord.orderStatus)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded text-[11px] font-semibold transition-colors shadow-2xs"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Particulars: ${selectedOrder.orderNumber}`}
          subtitle={`Commission Date: ${selectedOrder.date} · Payment Mode: ${selectedOrder.paymentMethod}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-[#24150F]">
            {/* Customer & Address Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-[#C9A227]/25">
              <div>
                <span className="text-[#5A3825]/70 block font-semibold text-[10px] uppercase">
                  Patron / Customer
                </span>
                <p className="font-serif font-bold text-sm text-[#3B2418] mt-0.5">{selectedOrder.customerName}</p>
                <p className="text-[#5A3825] mt-0.5">{selectedOrder.customerEmail}</p>
                <p className="text-[#5A3825]">{selectedOrder.customerPhone}</p>
              </div>
              <div>
                <span className="text-[#5A3825]/70 block font-semibold text-[10px] uppercase">
                  Delivery Destination
                </span>
                <p className="text-[#3B2418] mt-0.5 leading-relaxed">{selectedOrder.shippingAddress}</p>
                {selectedOrder.targetCompletionDate && (
                  <p className="text-[11px] text-[#8C6B0F] mt-1 font-medium">
                    Target Completion: {selectedOrder.targetCompletionDate}
                  </p>
                )}
              </div>
            </div>

            {selectedOrder.shipment && (
              <div className="bg-[#FAF6ED] p-3.5 rounded-lg border border-[#C9A227]/30 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#8C6B0F]" />
                  <div>
                    <span className="font-bold text-[#3B2418]">{selectedOrder.shipment.courier}</span>
                    <span className="mx-1.5 text-[#5A3825]">·</span>
                    <span className="font-mono text-[#8C6B0F]">{selectedOrder.shipment.trackingNumber}</span>
                  </div>
                </div>
                <Badge variant={selectedOrder.shipment.status === 'Delivered' ? 'green' : 'gold'}>
                  {selectedOrder.shipment.status}
                </Badge>
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <h4 className="font-serif font-bold text-sm text-[#3B2418] mb-2 uppercase tracking-wider">
                Weaving & Craft Specifications
              </h4>
              <table className="w-full text-left text-xs bg-white rounded-lg border border-[#C9A227]/25 overflow-hidden">
                <thead>
                  <tr className="bg-[#FAF6ED] text-[#3B2418] font-serif border-b border-[#C9A227]/20">
                    <th className="py-2 px-3">Item Particulars</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A227]/10">
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#3B2418]">{item.productName}</div>
                        <div className="text-[10px] text-[#5A3825]">
                          Code: {item.productCode} {item.pattern && `· Motif: ${item.pattern}`}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{item.quantity} {item.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₱{item.unitPrice.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#3B2418]">
                        ₱{item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes & Calculations */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
              <div className="sm:max-w-xs text-[#5A3825]">
                {selectedOrder.notes && (
                  <div className="p-3 bg-[#FAF6ED] rounded border border-[#C9A227]/20">
                    <span className="font-semibold text-[10px] uppercase block text-[#3B2418]">Special Instructions:</span>
                    <p className="mt-0.5 text-[11px]">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-right w-full sm:w-64 bg-white p-3 rounded border border-[#C9A227]/20">
                <div className="flex justify-between text-[#5A3825]">
                  <span>Subtotal:</span>
                  <span className="font-mono">₱{selectedOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#5A3825]">
                  <span>Insured Shipping:</span>
                  <span className="font-mono">₱{selectedOrder.shippingFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-[#C9A227]/20 pt-1.5 flex justify-between font-serif font-bold text-sm text-[#3B2418]">
                  <span>Total Amount:</span>
                  <span className="font-mono text-[#C9A227]">₱{selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Staff Status Control & Print */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-[#C9A227]/30">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs flex items-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4 text-[#C9A227]" />
                  <span>Print Official Invoice</span>
                </button>

                {canManageOrders && (
                  <select
                    value={selectedOrder.orderStatus}
                    disabled={isUpdatingStatus}
                    onChange={e => handleStatusUpdate(selectedOrder.id, e.target.value as Order['orderStatus'])}
                    className="px-3 py-2 rounded bg-[#FAF6ED] border border-[#C9A227]/50 text-xs font-semibold text-[#3B2418]"
                  >
                    {['Pending', 'Confirmed', 'In Production', 'Ready', 'Completed', 'Cancelled'].map(st => (
                      <option key={st} value={st}>
                        Order: {st}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs tracking-wider uppercase transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
