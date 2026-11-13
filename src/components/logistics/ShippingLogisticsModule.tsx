import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShipmentInfo } from '../../types';
import { Badge } from '../common/Badge';
import { Truck, Search, MapPin, PackageCheck, Clock, Loader2 } from 'lucide-react';

const STATUS_STEPS: ShipmentInfo['status'][] = [
  'Preparing',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];

export const ShippingLogisticsModule: React.FC = () => {
  const { shipments, currentRole, updateShipmentStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingCourier, setEditingCourier] = useState<Record<string, string>>({});

  const canManage = ['admin', 'artisan_weaver', 'creative_director'].includes(currentRole);

  const filtered = shipments.filter(s => {
    const matchesSearch =
      (s.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.destination || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (shipment: ShipmentInfo, nextStatus: ShipmentInfo['status']) => {
    setUpdatingId(shipment.id);
    try {
      await updateShipmentStatus(shipment.id, {
        status: nextStatus,
        courier: editingCourier[shipment.id] || shipment.courier,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadgeVariant = (status: ShipmentInfo['status']) => {
    switch (status) {
      case 'Delivered':
        return 'green';
      case 'Out for Delivery':
      case 'In Transit':
        return 'gold';
      case 'Picked Up':
        return 'brown';
      default:
        return 'amber';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F] flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>Shipping & Logistics Service</span>
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-1">
            Dispatch & Heritage Parcel Tracking
          </h1>
          <p className="text-xs text-[#5A3825]/80 mt-1">
            Track woven parcels from Binugao Weaving Sanctuary (Toril, Davao) to domestic & international cultural patrons.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-[#FAF6ED] border border-[#C9A227]/30 px-3 py-2 rounded-lg text-xs">
            <span className="text-[#5A3825]">Active Shipments: </span>
            <span className="font-mono font-bold text-[#3B2418] tabular-nums">{shipments.length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#C9A227]/30 shadow-xs flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search order #, tracking #, or destination..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#C9A227]/40 bg-[#FAF6ED] text-[#24150F]"
          />
          <Search className="w-3.5 h-3.5 text-[#5A3825]/60 absolute left-3 top-2.5" />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-[#C9A227]/40 bg-[#FAF6ED] text-[#3B2418] font-medium"
        >
          <option value="All">All Transit Stages</option>
          {STATUS_STEPS.map(st => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Shipment Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#C9A227]/30 p-10 text-center text-xs text-[#5A3825]">
            No shipment records match your current filter.
          </div>
        ) : (
          filtered.map(s => {
            const stepIndex = STATUS_STEPS.indexOf(s.status);
            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-[#C9A227]/30 p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#C9A227]/15 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#3B2418]">{s.orderNumber}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FAF6ED] border border-[#C9A227]/30 text-[#8C6B0F]">
                        {s.trackingNumber}
                      </span>
                      <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#5A3825]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C9A227]" />
                        {s.origin || 'Binugao Hub, Davao'} → {s.destination || 'Destination Address'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#C9A227]" />
                        ETA: {s.estimatedDelivery || 'Scheduled'}
                      </span>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <input
                        type="text"
                        value={editingCourier[s.id] ?? s.courier}
                        onChange={e => setEditingCourier(prev => ({ ...prev, [s.id]: e.target.value }))}
                        placeholder="Courier Partner"
                        className="px-2.5 py-1.5 rounded border border-[#C9A227]/40 bg-[#FAF6ED] text-xs w-36"
                      />
                      <select
                        value={s.status}
                        disabled={updatingId === s.id}
                        onChange={e => handleStatusChange(s, e.target.value as ShipmentInfo['status'])}
                        className="px-2.5 py-1.5 rounded bg-[#3B2418] text-[#E5C76B] font-semibold text-xs border border-[#C9A227]/40"
                      >
                        {STATUS_STEPS.map(st => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {updatingId === s.id && <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />}
                    </div>
                  )}
                </div>

                {/* Progress Stepper */}
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {STATUS_STEPS.map((step, idx) => {
                    const reached = idx <= stepIndex;
                    return (
                      <div key={step} className="space-y-1.5">
                        <div className={`h-1.5 rounded-full ${reached ? 'bg-[#C9A227]' : 'bg-[#3B2418]/10'}`} />
                        <div className="flex items-center gap-1 text-[10px]">
                          {reached && <PackageCheck className="w-3 h-3 text-[#8C6B0F] shrink-0 hidden sm:inline" />}
                          <span className={reached ? 'font-semibold text-[#3B2418]' : 'text-[#5A3825]/50'}>
                            {step}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
