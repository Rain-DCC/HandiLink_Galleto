import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag,
  Heart,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Check,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const ProductDetailView: React.FC = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    products,
    addToCart,
    favorites,
    toggleFavorite,
    setCurrentView
  } = useApp();

  const product = selectedProduct || products[0];
  const [quantity, setQuantity] = useState(1);
  const [selectedPattern, setSelectedPattern] = useState(product?.pattern || '');
  const [addedSuccess, setAddedSuccess] = useState(false);

  React.useEffect(() => {
    if (product?.pattern) {
      setSelectedPattern(product.pattern);
    }
  }, [product?.id, product?.pattern]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center text-xs text-[#5A3825]">
        Loading artisan creation details...
      </div>
    );
  }

  const isFavorite = favorites.includes(product.id);
  const relatedProducts = products
    .filter(p => p.id !== product.id && (p.category === product.category || p.craftType === product.craftType))
    .slice(0, 3);

  const handleAddToCart = async () => {
    await addToCart(product, quantity, selectedPattern);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2200);
  };

  const handleBuyNow = async () => {
    await addToCart(product, quantity, selectedPattern);
    setCurrentView('checkout');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[#5A3825]/80 mb-6">
        <button onClick={() => setCurrentView('landing')} className="hover:text-[#3B2418]">Home</button>
        <ChevronRight className="w-3 h-3 text-[#C9A227]" />
        <button onClick={() => setCurrentView('shop')} className="hover:text-[#3B2418]">Collection</button>
        <ChevronRight className="w-3 h-3 text-[#C9A227]" />
        <span className="text-[#3B2418] font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-[#FAF6ED] rounded-2xl border border-[#C9A227]/30 p-6 sm:p-10 shadow-lg">
        {/* Left: Large Product Image Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-[#C9A227]/40 shadow-md bg-[#3B2418]/5 group">
            <img
              src={product.imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="gold" size="md">
                {product.craftType}
              </Badge>
            </div>
            <button
              onClick={() => toggleFavorite(product.id)}
              className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all shadow ${
                isFavorite
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-white/80 text-[#3B2418] hover:text-rose-600'
              }`}
              aria-label="Add to favorites"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Cultural Certification Stamp */}
          <div className="bg-white/80 p-4 rounded-xl border border-[#C9A227]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A227]/20 flex items-center justify-center text-[#8C6B0F] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-[#3B2418]">Bagobo-Tagabawa Ancestral Verification</p>
              <p className="text-[#5A3825]/80 text-[11px]">
                Handcrafted under the auspices of the BIBATAWA Elders Council, Binugao, Davao City.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-[#5A3825] mb-1">
              <span className="font-mono text-[11px] font-semibold text-[#8C6B0F] uppercase tracking-wider">
                Product Code: {product.code}
              </span>
              <span className="font-medium text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded text-[11px]">
                {product.stock > 0 ? `${product.stock} in Stock` : 'Made to Order'}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-mono text-3xl font-bold text-[#3B2418]">
                ₱{product.price.toLocaleString()}
              </span>
              <span className="text-xs text-[#5A3825]/70">
                Inclusive of direct artisan fair compensation
              </span>
            </div>

            {/* Artisan & Community attribution */}
            <div className="mt-4 p-3.5 rounded-lg bg-white/90 border border-[#C9A227]/25 flex items-center justify-between text-xs">
              <div>
                <span className="text-[#5A3825]/70 text-[11px] block">Master Weaver / Artisan</span>
                <span className="font-serif font-bold text-sm text-[#3B2418]">{product.artisan}</span>
              </div>
              <div className="text-right">
                <span className="text-[#5A3825]/70 text-[11px] block">Ancestral Community</span>
                <span className="font-medium text-[#3B2418]">{product.community}</span>
              </div>
            </div>

            {/* Short Description */}
            <p className="mt-4 text-xs sm:text-sm text-[#5A3825] leading-relaxed">
              {product.description}
            </p>

            {/* Motif Selection */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-[#3B2418] uppercase tracking-wider mb-1.5">
                Indigenous Motif / Pattern:
              </label>
              <div className="flex flex-wrap gap-2">
                {[product.pattern, 'Binituwon (Stars)', 'Binubaya (Crocodile)'].map(pat => (
                  <button
                    key={pat}
                    onClick={() => setSelectedPattern(pat)}
                    className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                      selectedPattern === pat
                        ? 'border-[#C9A227] bg-[#C9A227]/20 text-[#3B2418] font-bold ring-1 ring-[#C9A227]'
                        : 'border-[#C9A227]/30 bg-white text-[#5A3825] hover:bg-[#FAF6ED]'
                    }`}
                  >
                    {pat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-5 flex items-center gap-4">
              <span className="text-xs font-semibold text-[#3B2418] uppercase tracking-wider">
                Quantity:
              </span>
              <div className="flex items-center border border-[#C9A227]/50 rounded-lg bg-white overflow-hidden shadow-xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 hover:bg-[#F8F3E7] text-[#3B2418] font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-mono font-bold text-[#3B2418]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 hover:bg-[#F8F3E7] text-[#3B2418] font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#C9A227]/25 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                className="py-3 px-4 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-semibold text-xs tracking-wider uppercase rounded-lg flex items-center justify-center gap-2 transition-all shadow-md group"
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-[#E5C76B]" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#C9A227]" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                className="py-3 px-4 bg-[#C9A227] text-[#24150F] hover:bg-[#E5C76B] font-bold text-xs tracking-wider uppercase rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>Buy Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deep Cultural Storytelling & Technical Tabs */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Story Behind the Craft */}
        <div className="bg-[#FAF6ED] p-6 rounded-xl border border-[#C9A227]/30 shadow-sm md:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-[#8C6B0F]">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-serif font-bold text-base text-[#3B2418]">
              Story Behind the Craft
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#5A3825] leading-relaxed">
            {product.culturalStory}
          </p>
          <div className="pt-3 border-t border-[#C9A227]/20 flex items-center gap-2 text-[11px] text-[#5A3825]/80">
            <Info className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Bagobo-Tagabawa weaving is recognized under Philippine National Cultural Heritage laws.</span>
          </div>
        </div>

        {/* Materials & Provenance */}
        <div className="bg-[#FAF6ED] p-6 rounded-xl border border-[#C9A227]/30 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-[#8C6B0F]">
            <Layers className="w-4 h-4" />
            <h3 className="font-serif font-bold text-base text-[#3B2418]">
              Materials & Fiber
            </h3>
          </div>
          <ul className="text-xs text-[#5A3825] space-y-2">
            {product.materials.map((m, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-14">
        <h3 className="font-serif text-xl font-bold text-[#3B2418] mb-6">
          Related Cultural Creations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedProducts.map(p => (
            <div
              key={p.id}
              onClick={() => {
                setSelectedProduct(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/25 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="aspect-4/3 overflow-hidden bg-[#3B2418]/5">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <span className="text-[10px] text-[#8C6B0F] font-semibold uppercase">{p.category}</span>
                <h4 className="font-serif font-bold text-sm text-[#3B2418] truncate mt-0.5">{p.name}</h4>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#3B2418]">₱{p.price.toLocaleString()}</span>
                  <span className="text-[11px] text-[#5A3825]/70">{p.artisan}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
