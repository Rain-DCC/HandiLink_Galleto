import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  Clock,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const CustomerDashboard: React.FC = () => {
  const {
    currentUser,
    orders,
    products,
    cart,
    openProductDetail,
    setIsCartDrawerOpen,
    setCurrentView
  } = useApp();

  const customerOrders = orders.filter(
    o => o.customerEmail === currentUser.email || o.customerName === currentUser.name
  );

  const totalOrders = customerOrders.length > 0 ? customerOrders.length : orders.length;
  const pendingOrders = (customerOrders.length > 0 ? customerOrders : orders).filter(
    o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed' || o.orderStatus === 'In Production'
  ).length;
  const completedOrders = (customerOrders.length > 0 ? customerOrders : orders).filter(
    o => o.orderStatus === 'Completed'
  ).length;
  const cartItemCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const displayOrders = (customerOrders.length > 0 ? customerOrders : orders).slice(0, 3);
  const recommendedProducts = products.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#3B2418] text-[#F8F3E7] rounded-2xl p-6 sm:p-8 border border-[#C9A227]/40 shadow-md relative overflow-hidden bg-woven-pattern">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#E5C76B]">
              HandiLink Cultural Patron
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F3E7] mt-1">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#F8F3E7]/80 mt-1 max-w-xl">
              Your patron support directly sustains the ancestral backstrap weavers and beadwork artisans of Binugao, Toril, Davao City.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('shop')}
            className="px-5 py-2.5 bg-[#C9A227] text-[#24150F] hover:bg-[#E5C76B] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm shrink-0 self-start md:self-center"
          >
            Explore New Weaves
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setCurrentView('customer_orders')}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-medium">Total Orders</span>
            <Package className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#3B2418] mt-2 tabular-nums">
            {totalOrders}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">All time purchases</p>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('customer_orders')}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-medium">In Production / Pending</span>
            <Clock className="w-4 h-4 text-[#8C6B0F]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#8C6B0F] mt-2 tabular-nums">
            {pendingOrders}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">On active looms</p>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('customer_orders')}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-medium">Completed Deliveries</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-emerald-800 mt-2 tabular-nums">
            {completedOrders}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Heritage items received</p>
        </button>

        <button
          type="button"
          onClick={() => setIsCartDrawerOpen(true)}
          className="text-left bg-[#FAF6ED] hover:bg-white p-5 rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5A3825] font-medium">Cart Items</span>
            <ShoppingBag className="w-4 h-4 text-[#3B2418]" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#3B2418] mt-2 tabular-nums">
            {cartItemCount}
          </div>
          <p className="text-[11px] text-[#5A3825]/70 mt-1">Open cart drawer</p>
        </button>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-[#C9A227]/20 pb-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#3B2418]">Recent Orders</h2>
            <p className="text-xs text-[#5A3825]/80">Track the loom-to-door progress of your commissions</p>
          </div>
          <button
            onClick={() => setCurrentView('customer_orders')}
            className="text-xs text-[#8C6B0F] hover:text-[#3B2418] font-bold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#C9A227]/20 text-[#3B2418] font-serif uppercase tracking-wider text-[11px]">
                <th className="py-2.5">Order No.</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Items</th>
                <th className="py-2.5 text-right">Amount</th>
                <th className="py-2.5">Production Status</th>
                <th className="py-2.5">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A227]/15">
              {displayOrders.map(ord => (
                <tr
                  key={ord.id}
                  onClick={() => setCurrentView('customer_orders')}
                  className="hover:bg-white/70 transition-colors cursor-pointer"
                >
                  <td className="py-3 font-mono font-bold text-[#3B2418]">{ord.orderNumber}</td>
                  <td className="py-3 text-[#5A3825]">{ord.date}</td>
                  <td className="py-3 text-[#3B2418] max-w-xs truncate">
                    {ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-[#3B2418]">
                    ₱{ord.total.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <Badge variant={ord.productionStatus === 'Completed' ? 'green' : 'amber'}>
                      {ord.productionStatus}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={ord.orderStatus === 'Completed' ? 'green' : 'gold'}>
                      {ord.orderStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#3B2418]">
              Recommended for You
            </h2>
            <p className="text-xs text-[#5A3825]/80">
              Curated masterworks matching your appreciation for indigenous design
            </p>
          </div>
          <button
            onClick={() => setCurrentView('shop')}
            className="text-xs text-[#8C6B0F] hover:text-[#3B2418] font-bold flex items-center gap-1"
          >
            <span>Browse All Collection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {recommendedProducts.map(p => (
            <div
              key={p.id}
              onClick={() => openProductDetail(p)}
              className="h-full bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div className="aspect-4/3 overflow-hidden bg-[#3B2418]/5 relative">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="gold">{p.craftType}</Badge>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#3B2418] truncate">{p.name}</h3>
                  <p className="text-xs text-[#5A3825]/80 mt-1 line-clamp-2">{p.description}</p>
                  <p className="text-[11px] text-[#8C6B0F] mt-2 font-medium">By {p.artisan}</p>
                </div>
                <div className="pt-3 border-t border-[#C9A227]/20 flex items-center justify-between mt-3">
                  <span className="font-mono font-bold text-sm text-[#3B2418]">
                    ₱{p.price.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      openProductDetail(p);
                    }}
                    className="px-3 py-1 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    View Piece
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
