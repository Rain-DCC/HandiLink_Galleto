import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { gatewayFetch } from '../../services/apiClient';
import { PatternDesign } from '../../types';
import {
  CheckCircle2,
  ArrowRight,
  Info,
  Save,
  Loader2,
  Bookmark,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface SavedSelection {
  id: string;
  designer_name: string;
  pattern_name: string;
  product_code: string;
  product_name: string;
  quantity: number;
  notes: string;
  created_at: string;
}

export const PatternDesignModule: React.FC = () => {
  const { patterns, products, setCurrentView, savePatternSelection, currentRole } = useApp();

  const [selectedPattern, setSelectedPattern] = useState<PatternDesign | null>(patterns[0] || null);
  const [selectedProductCode, setSelectedProductCode] = useState(products[0]?.code || '');
  const [designNotes, setDesignNotes] = useState(
    'Incorporate Binituwon ikat repeats into modern tailored blazer lapels and cuffs.'
  );
  const [targetQuantity, setTargetQuantity] = useState(12);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSelections, setSavedSelections] = useState<SavedSelection[]>([]);

  useEffect(() => {
    if (!selectedPattern && patterns.length > 0) setSelectedPattern(patterns[0]);
    if (!selectedProductCode && products.length > 0) setSelectedProductCode(products[0].code);
  }, [patterns, products, selectedPattern, selectedProductCode]);

  const loadSelections = async () => {
    if (currentRole === 'guest') return;
    try {
      const res = await gatewayFetch<{ selections: SavedSelection[] }>('/catalogue/pattern-selections');
      setSavedSelections(res.selections || []);
    } catch {
      // Ignore if unauthorized
    }
  };

  useEffect(() => {
    loadSelections();
  }, [currentRole]);

  const matchedProduct = products.find(p => p.code === selectedProductCode) || products[0];

  const handleSaveSelection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPattern || !matchedProduct) return;
    setIsSaving(true);
    try {
      await savePatternSelection({
        patternId: selectedPattern.id,
        patternName: selectedPattern.name,
        productCode: matchedProduct.code,
        productName: matchedProduct.name,
        quantity: targetQuantity,
        notes: designNotes,
      });
      setSavedSuccess(true);
      await loadSelections();
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedPattern) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center text-xs text-[#5A3825]">
        Loading ancestral Bagobo-Tagabawa pattern archive...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Data Flow Process 5.0 · Collaborative Design Studio
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            Pattern Design Module
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            For fashion designers & creative partners: Explore ancestral Bagobo-Tagabawa motifs and customize bespoke apparel applications
          </p>
        </div>

        <button
          onClick={() => setCurrentView('order_preparation')}
          className="px-4 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <span>Prepare Purchase Order (PO)</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#C9A227]" />
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Pattern Archive */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-[#3B2418]">Ancestral Pattern Archive</h2>
            <span className="text-xs text-[#5A3825]">{patterns.length} Traditional Motifs Documented</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
            {patterns.map(pat => {
              const isSelected = selectedPattern.id === pat.id;
              return (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPattern(pat)}
                  className={`h-full bg-[#FAF6ED] rounded-xl border transition-all overflow-hidden flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[#C9A227] ring-2 ring-[#C9A227]/30 shadow-md'
                      : 'border-[#C9A227]/30 hover:border-[#C9A227]'
                  }`}
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-[#3B2418]/5">
                    <img src={pat.imageUrl} alt={pat.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="gold" size="sm">
                        {pat.complexity}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-mono font-semibold text-[#8C6B0F] uppercase">
                        {pat.code} · {pat.culturalOrigin}
                      </span>
                      <h3 className="font-serif font-bold text-base text-[#3B2418] mt-0.5">{pat.name}</h3>
                      <p className="text-xs text-[#5A3825]/90 mt-1 line-clamp-2">{pat.description}</p>
                      <p className="text-[11px] text-[#3B2418] italic mt-2">Symbolism: "{pat.symbolism}"</p>
                    </div>

                    <div className="pt-3 border-t border-[#C9A227]/20 flex items-center justify-between">
                      <span className="text-[11px] text-[#5A3825]/75 truncate max-w-[140px]">
                        {pat.associatedProduct}
                      </span>
                      <button
                        onClick={() => setSelectedPattern(pat)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                          isSelected
                            ? 'bg-[#C9A227] text-[#24150F]'
                            : 'bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825]'
                        }`}
                      >
                        {isSelected ? 'Active Motif' : 'Select Pattern'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Design Studio & Saved Selections */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6 h-fit">
          <div className="bg-[#FAF6ED] p-6 sm:p-8 rounded-xl border border-[#C9A227]/30 shadow-md space-y-6">
            <div className="border-b border-[#C9A227]/20 pb-3">
              <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
                Design Specification Console
              </span>
              <h2 className="font-serif font-bold text-lg text-[#3B2418] mt-0.5">
                Bespoke Design Customization
              </h2>
              <p className="text-xs text-[#5A3825]/80 mt-1">
                Pair selected Bagobo motifs with tailored product templates for sample prototyping.
              </p>
            </div>

            <form onSubmit={handleSaveSelection} className="space-y-4 text-xs">
              <div className="p-3 bg-white rounded-lg border border-[#C9A227]/30 flex items-center gap-3">
                <img
                  src={selectedPattern.imageUrl}
                  alt={selectedPattern.name}
                  className="w-14 h-14 object-cover rounded border border-[#C9A227]/20 shrink-0"
                />
                <div>
                  <span className="text-[10px] font-mono text-[#8C6B0F] uppercase">
                    Selected Motif: {selectedPattern.code}
                  </span>
                  <h4 className="font-serif font-bold text-sm text-[#3B2418]">{selectedPattern.name}</h4>
                  <p className="text-[11px] text-[#5A3825]">{selectedPattern.symbolism}</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#3B2418] uppercase tracking-wider mb-1">
                  Target Product Line *
                </label>
                <select
                  value={selectedProductCode}
                  onChange={e => setSelectedProductCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white text-[#3B2418] font-medium"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.code}>
                      {p.name} ({p.category}) — ₱{p.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#3B2418] uppercase tracking-wider mb-1">
                  Target Production Quantity (Units) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={targetQuantity}
                  onChange={e => setTargetQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#3B2418] uppercase tracking-wider mb-1">
                  Design & Cut Placement Notes *
                </label>
                <textarea
                  rows={4}
                  required
                  value={designNotes}
                  onChange={e => setDesignNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white leading-relaxed"
                />
              </div>

              <div className="p-3 bg-[#3B2418]/5 rounded border border-[#C9A227]/25 flex items-start gap-2 text-[11px] text-[#5A3825]">
                <Info className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <span>
                  All selected motifs are recorded in the HandiLink Cultural Ledger to guarantee proper attribution to the Binugao Bagobo-Tagabawa weavers.
                </span>
              </div>

              {savedSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Design specification saved to SQLite & ready for Purchase Order!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] disabled:opacity-60 font-semibold text-xs tracking-wider uppercase rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#C9A227]" />}
                <span>Save Design Selection</span>
              </button>
            </form>
          </div>

          {savedSelections.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-[#C9A227]/30 shadow-xs space-y-3">
              <h3 className="font-serif font-bold text-sm text-[#3B2418] flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#C9A227]" />
                <span>Saved Designer Specifications</span>
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedSelections.map(sel => (
                  <div key={sel.id} className="p-3 rounded-lg bg-[#FAF6ED] border border-[#C9A227]/20 text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-[#3B2418]">
                      <span>{sel.pattern_name}</span>
                      <span className="font-mono text-[#8C6B0F]">{sel.quantity} units</span>
                    </div>
                    <p className="text-[11px] text-[#5A3825]">{sel.product_name}</p>
                    <p className="text-[11px] text-[#5A3825]/80 italic">{sel.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
