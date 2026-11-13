import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderItem } from '../../types';
import { HANDILINK_LOGO } from '../../utils/assets';
import {
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const OrderPreparationModule: React.FC = () => {
  const { products, createOrder, setCurrentView, currentUser } = useApp();

  const [customerName, setCustomerName] = useState('Mindanao Fashion Syndicate');
  const [customerEmail, setCustomerEmail] = useState('procurement@mindanaofashion.ph');
  const [customerPhone, setCustomerPhone] = useState('+63 82 234 5678');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [address, setAddress] = useState('G/F SM Lanang Premier, J.P. Laurel Ave, Davao City');
  const [terms, setTerms] = useState('50% DP Upon PO Signing, 50% Upon Delivery');
  const [poNumber, setPoNumber] = useState(`PO-2026-${String(Date.now()).slice(-4)}`);
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('Landbank');

  const firstProd = products[0];
  const secondProd = products[1] || products[0];

  const [items, setItems] = useState<OrderItem[]>([
    {
      productId: firstProd?.id,
      productCode: firstProd?.code || 'INB-2026-01',
      productName: firstProd?.name || 'Master Inabal Abaca Cloth (Binituwon Motif)',
      quantity: 2,
      unit: 'Roll',
      unitPrice: firstProd?.price || 8500,
      amount: (firstProd?.price || 8500) * 2,
      pattern: firstProd?.pattern || 'Binituwon',
    },
    ...(secondProd && secondProd.id !== firstProd?.id
      ? [
          {
            productId: secondProd.id,
            productCode: secondProd.code,
            productName: secondProd.name,
            quantity: 1,
            unit: 'Piece',
            unitPrice: secondProd.price,
            amount: secondProd.price,
            pattern: secondProd.pattern,
          },
        ]
      : []),
  ]);

  const [shippingFee, setShippingFee] = useState(650);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const total = subtotal + shippingFee;

  const handleUpdateItem = (index: number, field: keyof OrderItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        item.amount = Number(item.quantity) * Number(item.unitPrice);
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleSelectCatalogueProduct = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    setItems(prev => {
      const updated = [...prev];
      const qty = updated[index]?.quantity || 1;
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        unitPrice: prod.price,
        amount: prod.price * qty,
        pattern: prod.pattern,
      };
      return updated;
    });
  };

  const handleAddItem = () => {
    const defaultProduct = products[0];
    setItems(prev => [
      ...prev,
      {
        productId: defaultProduct?.id,
        productCode: defaultProduct?.code || 'INB-CUSTOM-01',
        productName: defaultProduct?.name || 'Custom Woven Textile',
        quantity: 1,
        unit: 'Piece',
        unitPrice: defaultProduct?.price || 5000,
        amount: defaultProduct?.price || 5000,
        pattern: defaultProduct?.pattern || 'Binituwon',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmOrder = async () => {
    setErrorMsg(null);
    if (!customerName.trim() || !address.trim() || items.length === 0) {
      setErrorMsg('Customer name, delivery address, and at least one line item are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || currentUser.email || 'procurement@bibatawa.org',
        customerPhone: customerPhone.trim() || '+63 82 234 5678',
        shippingAddress: address.trim(),
        items,
        shippingFee,
        paymentMethod,
        notes: `Terms: ${terms}. PO Number: ${poNumber}`,
        poNumber,
        terms,
        clearUserCart: false,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setCurrentView('customer_orders');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to create purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Data Flow Process 6.0 · Formal Procurement
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            Order Preparation & Purchase Order (PO)
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Generate formal commercial purchase orders and dispatch production batches directly to artisan looms
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-[#C9A227]" />
          <span>Print PO</span>
        </button>
      </div>

      {/* Main Form Sheet Container */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border-2 border-[#C9A227]/30 shadow-lg space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-[#3B2418] pb-6 gap-4">
          <div className="flex items-center gap-4">
            <img src={HANDILINK_LOGO} alt="HandiLink" className="h-14 w-auto" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C6B0F]">
                COMMERCIAL INVOICE & PURCHASE ORDER
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#3B2418] mt-0.5">
                BINUGAO BAGOBO-TAGABAWA WEAVERS ASSOCIATION
              </h2>
              <p className="text-xs text-[#5A3825]">
                Sitio Binugao, Brgy. Binugao, Toril District, Davao City · VAT Reg: 009-842-120
              </p>
            </div>
          </div>

          <div className="bg-[#FAF6ED] p-3 rounded-lg border border-[#C9A227]/30 font-mono text-xs space-y-1">
            <div>
              <span className="text-stone-500">P.O. Number: </span>
              <span className="font-bold text-[#3B2418]">{poNumber}</span>
            </div>
            <div>
              <span className="text-stone-500">Document Date: </span>
              <span className="font-medium text-[#3B2418]">{date}</span>
            </div>
          </div>
        </div>

        {/* PO Metadata Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">Customer / Partner *</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">Partner Email *</label>
            <input
              type="email"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">Partner Phone</label>
            <input
              type="text"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">P.O. Reference No. *</label>
            <input
              type="text"
              value={poNumber}
              onChange={e => setPoNumber(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">Issue Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">Settlement Channel</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as Order['paymentMethod'])}
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
            >
              <option value="Landbank">Landbank Institutional Transfer</option>
              <option value="GCash">GCash Merchant</option>
              <option value="Maya">Maya Business</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block font-semibold text-[#3B2418] mb-1">Payment & Dispatch Terms</label>
            <input
              type="text"
              value={terms}
              onChange={e => setTerms(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block font-semibold text-[#3B2418] mb-1">Delivery Address *</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
            />
          </div>
        </div>

        {/* Dynamic Order Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-[#3B2418] uppercase tracking-wider">
              Order Particulars & Line Items
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-[#C9A227]/30 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAF6ED] text-[#3B2418] font-serif border-b border-[#C9A227]/25 uppercase text-[11px]">
                  <th className="py-2.5 px-3">Catalogue Pick</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Particulars / Specifications</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3 text-right">Unit Price (₱)</th>
                  <th className="py-2.5 px-3 text-right">Amount (₱)</th>
                  <th className="py-2.5 px-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C9A227]/15">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-[#FAF6ED]/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <select
                        value={item.productId || ''}
                        onChange={e => handleSelectCatalogueProduct(index, e.target.value)}
                        className="w-36 px-2 py-1 rounded border border-stone-200 bg-white text-[11px]"
                      >
                        <option value="">Custom Item</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#8C6B0F]">
                      <input
                        type="text"
                        value={item.productCode}
                        onChange={e => handleUpdateItem(index, 'productCode', e.target.value)}
                        className="w-24 px-2 py-1 rounded border border-stone-200 bg-white font-mono text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={e => handleUpdateItem(index, 'productName', e.target.value)}
                        className="w-full min-w-[180px] px-2 py-1 rounded border border-stone-200 bg-white text-xs font-serif font-medium"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => handleUpdateItem(index, 'quantity', Math.max(1, Number(e.target.value)))}
                        className="w-16 px-2 py-1 rounded border border-stone-200 bg-white font-mono text-xs text-center"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={e => handleUpdateItem(index, 'unit', e.target.value)}
                        className="w-20 px-2 py-1 rounded border border-stone-200 bg-white text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={e => handleUpdateItem(index, 'unitPrice', Math.max(0, Number(e.target.value)))}
                        className="w-24 px-2 py-1 rounded border border-stone-200 bg-white font-mono text-xs text-right"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#3B2418]">
                      ₱{item.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation Totals */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-[#C9A227]/25">
          <div className="text-xs text-[#5A3825]/80 space-y-1 sm:max-w-md">
            <span className="font-bold text-[#3B2418] uppercase text-[10px] block">Certification:</span>
            <p className="text-[11px] leading-relaxed">
              We certify that this purchase order strictly adheres to fair-trade artisan margins (82% direct artisan share, 18% heritage trust fund) approved by the BIBATAWA General Assembly.
            </p>
          </div>

          <div className="bg-[#FAF6ED] p-4 rounded-xl border border-[#C9A227]/30 space-y-2 w-full sm:w-72 text-xs">
            <div className="flex justify-between text-[#5A3825]">
              <span>Items Subtotal:</span>
              <span className="font-mono font-medium">₱{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#5A3825] items-center">
              <span>Freight / Transit Fee:</span>
              <input
                type="number"
                min={0}
                value={shippingFee}
                onChange={e => setShippingFee(Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-0.5 rounded border border-stone-300 font-mono text-right text-xs bg-white"
              />
            </div>
            <div className="border-t border-[#C9A227]/30 pt-2 flex justify-between font-serif font-bold text-base text-[#3B2418]">
              <span>Grand Total:</span>
              <span className="font-mono text-[#C9A227]">₱{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Purchase Order created in SQLite and dispatched to artisan production looms!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-[#C9A227]/30">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmOrder}
            className="w-full sm:w-auto px-8 py-3 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded-lg font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#C9A227]" />
            )}
            <span>{isSubmitting ? 'Creating PO & Dispatching...' : 'Confirm Order & Dispatch to Loom'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
