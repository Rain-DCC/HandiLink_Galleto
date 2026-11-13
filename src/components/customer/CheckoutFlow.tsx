import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Truck,
  User as UserIcon,
  ShoppingBag,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export const CheckoutFlow: React.FC = () => {
  const { cart, createOrder, setCurrentView, currentUser, currentRole } = useApp();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form states hydrated from authenticated user
  const [customerName, setCustomerName] = useState(
    currentRole !== 'guest' ? currentUser.name : ''
  );
  const [customerEmail, setCustomerEmail] = useState(
    currentRole !== 'guest' ? currentUser.email : ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    currentRole !== 'guest' ? currentUser.phone : ''
  );

  const [addressLine, setAddressLine] = useState(
    currentRole !== 'guest' && currentUser.address ? currentUser.address : 'Unit 14B, Pryce Tower, Bajada'
  );
  const [city, setCity] = useState('Davao City');
  const [province, setProvince] = useState('Davao del Sur');
  const [postalCode, setPostalCode] = useState('8000');
  const [specialInstructions, setSpecialInstructions] = useState(
    'Please handle with care. Traditional Inabal textile delicate parcel.'
  );

  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Maya' | 'Landbank' | 'Cash on Delivery'>('GCash');
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 10000 ? 0 : 350;
  const total = subtotal + shippingFee;

  const handleCompleteOrder = async () => {
    setErrorMsg('');
    if (currentRole === 'guest') {
      setErrorMsg('Please sign in or register an account to place your order.');
      setCurrentView('login');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullAddress = `${addressLine}, ${city}, ${province} ${postalCode}`;
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        productCode: item.product.code,
        productName: item.product.name,
        quantity: item.quantity,
        unit: item.product.category === 'Textiles' ? 'Roll' : 'Piece',
        unitPrice: item.product.price,
        amount: item.product.price * item.quantity,
        pattern: item.selectedPattern || item.product.pattern,
      }));

      const order = await createOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: fullAddress,
        items: orderItems,
        shippingFee,
        paymentMethod,
        notes: specialInstructions,
        clearUserCart: true,
      });

      setCreatedOrderNumber(order.orderNumber);
      setStep(5);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to place order. Please review your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Customer' },
    { num: 2, label: 'Shipping' },
    { num: 3, label: 'Details' },
    { num: 4, label: 'Payment' },
    { num: 5, label: 'Confirmation' }
  ];

  if (cart.length === 0 && step !== 5) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#3B2418] mb-2">No Items to Checkout</h2>
        <p className="text-sm text-[#5A3825]/80 mb-6">
          Your artisan cart is empty. Please select authentic Bagobo-Tagabawa crafts from the collection.
        </p>
        <button
          onClick={() => setCurrentView('shop')}
          className="px-6 py-2.5 bg-[#3B2418] text-[#E5C76B] rounded font-medium text-xs tracking-wider uppercase"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Title & Subtitle */}
      <div className="mb-8 text-center">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418]">
          Ethical Artisan Checkout
        </h1>
        <p className="text-xs sm:text-sm text-[#5A3825]/80 mt-1">
          Direct community benefit guarantee · Handwoven with ancestral Bagobo-Tagabawa integrity
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#C9A227]/25 -z-0" />
          {stepsList.map(s => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? 'bg-[#3B2418] text-[#E5C76B]'
                      : isCurrent
                      ? 'bg-[#C9A227] text-[#3B2418] ring-4 ring-[#C9A227]/20 shadow-md'
                      : 'bg-white text-[#5A3825]/50 border border-[#C9A227]/30'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-medium ${
                    isCurrent ? 'text-[#3B2418] font-bold' : 'text-[#5A3825]/70'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 shadow-md p-6 sm:p-8">
        {/* STEP 1: Customer Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-[#C9A227]/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#3B2418] flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#C9A227]" />
                Step 1: Customer Information
              </h3>
              <p className="text-xs text-[#5A3825]/80 mt-0.5">
                Provide your contact details for official invoice and dispatch notifications.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#3B2418] mb-1">
                  Full Name / Legal Entity *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-[#C9A227]/40 bg-white text-[#24150F] focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                  placeholder="Enter full name or institution"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3B2418] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-[#C9A227]/40 bg-white text-[#24150F] focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                  placeholder="name@organization.ph"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#3B2418] mb-1">
                  Mobile / Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-[#C9A227]/40 bg-white text-[#24150F] focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#C9A227]/20">
              <button
                onClick={() => setCurrentView('shop')}
                className="text-xs text-[#5A3825] hover:text-[#3B2418] flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Collection
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!customerName || !customerEmail || !customerPhone}
                className="px-6 py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <span>Continue to Shipping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Shipping Address */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b border-[#C9A227]/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#3B2418] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#C9A227]" />
                Step 2: Shipping Destination
              </h3>
              <p className="text-xs text-[#5A3825]/80 mt-0.5">
                We safely package handwoven cultural textiles with moisture barriers and certificates of authenticity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#3B2418] mb-1">
                  Street Address / Building / Unit No. *
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={e => setAddressLine(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-[#C9A227]/40 bg-white text-[#24150F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3B2418] mb-1">City / Municipality *</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-[#C9A227]/40 bg-white text-[#24150F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3B2418] mb-1">Province *</label>
                <input
                  type="text"
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-[#C9A227]/40 bg-white text-[#24150F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3B2418] mb-1">Postal Code *</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-[#C9A227]/40 bg-white text-[#24150F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3B2418] mb-1">Delivery Notes / Landmarks</label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-[#C9A227]/40 bg-white text-[#24150F]"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#C9A227]/20">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-[#5A3825] hover:text-[#3B2418] flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Customer Info
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!addressLine || !city || !province}
                className="px-6 py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <span>Review Order Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Order Details Review */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-[#C9A227]/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#3B2418] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C9A227]" />
                Step 3: Review Order Particulars
              </h3>
              <p className="text-xs text-[#5A3825]/80 mt-0.5">
                Confirm your selected Bagobo-Tagabawa creations before proceeding to payment.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#C9A227]/30 text-[#3B2418] font-serif uppercase tracking-wider">
                    <th className="py-2.5">Product</th>
                    <th className="py-2.5">Artisan / Motif</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Price</th>
                    <th className="py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A227]/15">
                  {cart.map(item => (
                    <tr key={item.product.id}>
                      <td className="py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded border border-[#C9A227]/30 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-serif font-semibold text-[#3B2418] truncate">{item.product.name}</div>
                            <div className="text-[10px] text-[#5A3825]/70">{item.product.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-[#5A3825]">
                        <div>{item.product.artisan}</div>
                        <div className="text-[10px] text-[#8C6B0F]">{item.selectedPattern || item.product.pattern}</div>
                      </td>
                      <td className="py-3 text-center font-mono font-medium">{item.quantity}</td>
                      <td className="py-3 text-right font-mono">₱{item.product.price.toLocaleString()}</td>
                      <td className="py-3 text-right font-mono font-bold text-[#3B2418]">
                        ₱{(item.product.price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Box */}
            <div className="bg-white p-4 rounded-lg border border-[#C9A227]/30 space-y-2 max-w-sm ml-auto text-xs">
              <div className="flex justify-between text-[#5A3825]">
                <span>Items Subtotal:</span>
                <span className="font-mono">₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#5A3825]">
                <span>Shipping & Insured Transit:</span>
                <span className="font-mono">{shippingFee === 0 ? 'FREE' : `₱${shippingFee.toLocaleString()}`}</span>
              </div>
              <div className="border-t border-[#C9A227]/20 pt-2 flex justify-between font-serif font-bold text-sm text-[#3B2418]">
                <span>Final Payable:</span>
                <span className="font-mono text-[#C9A227]">₱{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#C9A227]/20">
              <button
                onClick={() => setStep(2)}
                className="text-xs text-[#5A3825] hover:text-[#3B2418] flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Shipping
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-all"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Payment Method */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="border-b border-[#C9A227]/20 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#3B2418] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#C9A227]" />
                Step 4: Select Payment Method
              </h3>
              <p className="text-xs text-[#5A3825]/80 mt-0.5">
                All proceeds are remitted directly to the BIBATAWA Community Development Trust & Artisan Fund.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'GCash',
                  title: 'GCash Instant QR / Transfer',
                  subtitle: 'Direct BIBATAWA Treasury Merchant',
                  badge: 'Popular'
                },
                {
                  id: 'Maya',
                  title: 'Maya Digital Wallet',
                  subtitle: 'Fast QR & Wallet Settlement'
                },
                {
                  id: 'Landbank',
                  title: 'Landbank of the Philippines',
                  subtitle: 'Official Agrarian / IP Account Deposit'
                },
                {
                  id: 'Cash on Delivery',
                  title: 'Cash on Delivery / Pickup',
                  subtitle: 'Pay at Davao Weaving Center or Upon Courier Arrival'
                }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id as any)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === opt.id
                      ? 'border-[#C9A227] bg-[#C9A227]/10 ring-2 ring-[#C9A227]/30'
                      : 'border-[#C9A227]/30 bg-white hover:border-[#C9A227]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif font-semibold text-sm text-[#3B2418]">{opt.title}</span>
                    {opt.badge && (
                      <span className="text-[10px] bg-[#C9A227] text-[#3B2418] font-bold px-2 py-0.5 rounded">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5A3825]/75">{opt.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Payment security assurance */}
            <div className="p-4 bg-[#3B2418]/5 rounded-lg border border-[#C9A227]/30 flex items-start gap-3 text-xs text-[#5A3825]">
              <ShieldCheck className="w-5 h-5 text-[#C9A227] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#3B2418]">Protected Cultural Transaction (82/18 Guarantee):</span>
                <p className="mt-0.5">
                  82% goes directly to the crafting BIBATAWA artisan and 18% sustains the ancestral domain weaving & youth apprenticeship fund.
                </p>
              </div>
            </div>

            {currentRole === 'guest' && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-center justify-between gap-3">
                <span>Sign in or register a patron account to finalize this order and track weaving progress.</span>
                <button
                  type="button"
                  onClick={() => setCurrentView('login')}
                  className="px-3 py-1.5 bg-[#3B2418] text-[#E5C76B] rounded font-semibold shrink-0"
                >
                  Sign In / Register
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-[#C9A227]/20">
              <button
                onClick={() => setStep(3)}
                className="text-xs text-[#5A3825] hover:text-[#3B2418] flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Review
              </button>
              <button
                onClick={handleCompleteOrder}
                disabled={isSubmitting}
                className="px-8 py-3 bg-[#C9A227] text-[#24150F] hover:bg-[#E5C76B] disabled:opacity-60 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-md transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recording Order...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize & Place Order (₱{total.toLocaleString()})</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Order Confirmation */}
        {step === 5 && (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#C9A227]/20 border-2 border-[#C9A227] flex items-center justify-center text-[#3B2418] mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10 text-[#C9A227]" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
                Order Successfully Placed
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-1">
                Madayaw! Salamat sa Pagsuporta.
              </h2>
              <p className="text-sm text-[#5A3825] max-w-lg mx-auto mt-2">
                Thank you for honoring the Bagobo-Tagabawa weaving tradition. Your order has been dispatched to the Binugao weaving center.
              </p>
            </div>

            {/* Confirmation Details Card */}
            <div className="bg-white p-6 rounded-xl border border-[#C9A227]/30 max-w-md mx-auto text-left space-y-3 text-xs">
              <div className="flex justify-between border-b border-[#C9A227]/20 pb-2">
                <span className="text-[#5A3825]">Order Reference:</span>
                <span className="font-mono font-bold text-[#3B2418]">{createdOrderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A3825]">Customer:</span>
                <span className="font-medium text-[#3B2418]">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A3825]">Payment Mode:</span>
                <span className="font-medium text-[#3B2418]">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A3825]">Payment Status:</span>
                <span className="font-bold text-emerald-800">Paid / Verified</span>
              </div>
              <div className="flex justify-between border-t border-[#C9A227]/20 pt-2 font-serif font-bold text-sm">
                <span className="text-[#3B2418]">Total Remitted:</span>
                <span className="font-mono text-[#C9A227]">₱{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setCurrentView('customer_orders')}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-xs tracking-wider uppercase transition-colors"
              >
                Track My Orders
              </button>
              <button
                onClick={() => setCurrentView('shop')}
                className="w-full sm:w-auto px-6 py-2.5 border border-[#C9A227] text-[#3B2418] hover:bg-[#C9A227]/10 rounded font-semibold text-xs tracking-wider uppercase transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
