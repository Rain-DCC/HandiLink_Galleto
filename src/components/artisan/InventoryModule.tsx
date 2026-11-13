import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductionMaterial } from '../../types';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  PackageCheck,
  Loader2,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const InventoryModule: React.FC = () => {
  const { materials, addMaterial, adjustMaterialStock } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Low Stock' | 'Out of Stock' | 'Available'>('All');
  const [selectedMaterial, setSelectedMaterial] = useState<ProductionMaterial | null>(null);
  const [actionType, setActionType] = useState<'in' | 'out' | 'adjust'>('in');
  const [amountInput, setAmountInput] = useState<number>(10);
  const [stockNotes, setStockNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Material Form State
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('Kilograms');
  const [newStock, setNewStock] = useState(25);
  const [newMinStock, setNewMinStock] = useState(10);
  const [newCategory, setNewCategory] = useState<ProductionMaterial['category']>('Natural Fiber');
  const [newUnitCost, setNewUnitCost] = useState(450);

  const totalMaterials = materials.length;
  const lowStock = materials.filter(m => m.status === 'Low Stock').length;
  const outOfStock = materials.filter(m => m.status === 'Out of Stock').length;
  const totalUnits = materials.reduce((acc, m) => acc + m.currentStock, 0);

  const filteredMaterials = materials.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || m.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleOpenAction = (mat: ProductionMaterial, type: 'in' | 'out' | 'adjust') => {
    setSelectedMaterial(mat);
    setActionType(type);
    setAmountInput(type === 'adjust' ? mat.currentStock : 10);
    setStockNotes('');
    setIsModalOpen(true);
  };

  const handleExecuteStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    setIsSubmitting(true);
    try {
      await adjustMaterialStock(
        selectedMaterial.id,
        actionType,
        amountInput,
        stockNotes.trim() || `Logged via Inventory Module (${actionType})`
      );
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addMaterial({
        code: newCode.trim() || `MAT-${Date.now().toString().slice(-4)}`,
        name: newName.trim(),
        unit: newUnit.trim(),
        currentStock: newStock,
        minimumStock: newMinStock,
        category: newCategory,
        unitCost: newUnitCost,
      });
      setIsAddModalOpen(false);
      setNewCode('');
      setNewName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Data Flow Process 8.0 · Raw Material Governance
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            Production Material Inventory
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Monitor raw abaca fibers, organic forest dye extracts, brass elements, and loom hardware
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#C9A227] text-[#24150F] hover:bg-[#E5C76B] font-bold text-xs tracking-wider uppercase rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Material</span>
          </button>
          <button
            onClick={() => {
              if (materials.length > 0) handleOpenAction(materials[0], 'in');
            }}
            className="px-4 py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-semibold text-xs tracking-wider uppercase rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C9A227]" />
            <span>Quick Stock In</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Interactive Stock Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setStatusFilter('All')}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            statusFilter === 'All'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Total Materials</span>
            <Boxes className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#3B2418] mt-2 tabular-nums">
            {totalMaterials} Items
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Show all materials</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(prev => (prev === 'Low Stock' ? 'All' : 'Low Stock'))}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            statusFilter === 'Low Stock'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Low Stock Threshold</span>
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-amber-800 mt-2 tabular-nums">
            {lowStock} Materials
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Requires harvest · Click to filter</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(prev => (prev === 'Out of Stock' ? 'All' : 'Out of Stock'))}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            statusFilter === 'Out of Stock'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-700" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-rose-800 mt-2 tabular-nums">
            {outOfStock} Items
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Needs urgent restock · Click to filter</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(prev => (prev === 'Available' ? 'All' : 'Available'))}
          className={`text-left p-5 rounded-xl border shadow-xs transition-all ${
            statusFilter === 'Available'
              ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/35 shadow-md'
              : 'bg-[#FAF6ED] border-[#C9A227]/30 hover:bg-white hover:border-[#C9A227]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-semibold">Healthy Stock Volume</span>
            <PackageCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-emerald-800 mt-2 tabular-nums">
            {totalUnits.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Filter available stock</p>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-[#FAF6ED] p-4 rounded-xl border border-[#C9A227]/30 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search material or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F] placeholder-[#5A3825]/60 focus:border-[#C9A227]"
          />
          <Search className="w-4 h-4 text-[#5A3825]/60 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
          {statusFilter !== 'All' && (
            <button
              type="button"
              onClick={() => setStatusFilter('All')}
              className="px-2.5 py-1 rounded bg-[#3B2418] text-[#E5C76B] font-semibold text-[11px]"
            >
              Status: {statusFilter} ×
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5A3825] font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded border border-[#C9A227]/40 bg-white text-[#3B2418] font-medium"
            >
              <option value="All">All Categories</option>
              <option value="Natural Fiber">Natural Fiber</option>
              <option value="Organic Dye">Organic Dye</option>
              <option value="Seed Beads">Seed Beads</option>
              <option value="Brass Elements">Brass Elements</option>
              <option value="Loom Hardware">Loom Hardware</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#3B2418] text-[#E5C76B] font-serif uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Material / SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit of Measure</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4 text-right">Min. Threshold</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Logged</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A227]/15">
              {filteredMaterials.map(mat => (
                <tr key={mat.id} className="hover:bg-white/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-serif font-bold text-sm text-[#3B2418]">{mat.name}</div>
                    <span className="font-mono text-[10px] text-[#8C6B0F]">{mat.code}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#5A3825]">{mat.category}</td>
                  <td className="py-3.5 px-4 text-[#5A3825]">{mat.unit}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#3B2418] tabular-nums">
                    {mat.currentStock.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#5A3825] tabular-nums">
                    {mat.minimumStock.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge variant={mat.status === 'Available' ? 'green' : mat.status === 'Low Stock' ? 'amber' : 'crimson'}>
                      {mat.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-[#5A3825] whitespace-nowrap">{mat.lastUpdated}</td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap space-x-1.5">
                    <button
                      onClick={() => handleOpenAction(mat, 'in')}
                      className="px-2 py-1 bg-emerald-800 text-white rounded text-[11px] font-semibold hover:bg-emerald-900 transition-colors"
                      title="Stock In"
                    >
                      + In
                    </button>
                    <button
                      onClick={() => handleOpenAction(mat, 'out')}
                      className="px-2 py-1 bg-[#5A3825] text-[#F8F3E7] rounded text-[11px] font-semibold hover:bg-[#3B2418] transition-colors"
                      title="Stock Out (Consumed)"
                    >
                      - Out
                    </button>
                    <button
                      onClick={() => handleOpenAction(mat, 'adjust')}
                      className="px-2 py-1 border border-[#C9A227] text-[#3B2418] rounded text-[11px] font-semibold hover:bg-white transition-colors"
                      title="Audit Adjustment"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock In / Out Modal */}
      {selectedMaterial && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Inventory Log: ${selectedMaterial.name}`}
          subtitle={`Current Level: ${selectedMaterial.currentStock} ${selectedMaterial.unit}`}
          maxWidth="md"
        >
          <form onSubmit={handleExecuteStock} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#3B2418] uppercase tracking-wider mb-1">
                Operation Type:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'in', label: 'Stock In (+)' },
                  { id: 'out', label: 'Stock Out (-)' },
                  { id: 'adjust', label: 'Direct Set (=)' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActionType(t.id as any)}
                    className={`py-2 rounded font-medium text-xs transition-colors ${
                      actionType === t.id
                        ? 'bg-[#3B2418] text-[#E5C76B] font-bold'
                        : 'bg-white border border-[#C9A227]/30 text-[#5A3825]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#3B2418] uppercase tracking-wider mb-1">
                Quantity in {selectedMaterial.unit} *
              </label>
              <input
                type="number"
                min={0}
                required
                value={amountInput}
                onChange={e => setAmountInput(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#3B2418] uppercase tracking-wider mb-1">
                Audit / Harvest Notes
              </label>
              <input
                type="text"
                value={stockNotes}
                onChange={e => setStockNotes(e.target.value)}
                placeholder="e.g. Harvested from Sitio Binugao mountain patch"
                className="w-full px-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#C9A227]/25">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-stone-300 rounded text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] disabled:opacity-60 rounded font-semibold uppercase tracking-wider flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Log</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add New Material Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Raw Material"
        subtitle="Add fiber, natural dye extract, beads, or loom hardware to SQLite inventory"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateMaterial} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Material SKU Code *</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                placeholder="e.g. MAT-DYE-07"
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Category *</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              >
                <option value="Natural Fiber">Natural Fiber</option>
                <option value="Organic Dye">Organic Dye</option>
                <option value="Seed Beads">Seed Beads</option>
                <option value="Brass Elements">Brass Elements</option>
                <option value="Loom Hardware">Loom Hardware</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#3B2418] mb-1">Material Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Candlenut Charcoal Organic Dye Pigment"
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Unit of Measure *</label>
              <input
                type="text"
                required
                value={newUnit}
                onChange={e => setNewUnit(e.target.value)}
                placeholder="Kilograms / Liters / Pieces"
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Unit Cost (₱) *</label>
              <input
                type="number"
                min={1}
                required
                value={newUnitCost}
                onChange={e => setNewUnitCost(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Initial Stock *</label>
              <input
                type="number"
                min={0}
                required
                value={newStock}
                onChange={e => setNewStock(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Minimum Threshold *</label>
              <input
                type="number"
                min={1}
                required
                value={newMinStock}
                onChange={e => setNewMinStock(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#C9A227]/25">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-stone-300 rounded text-stone-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold uppercase tracking-wider flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Register Material</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
