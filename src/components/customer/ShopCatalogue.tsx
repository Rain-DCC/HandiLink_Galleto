import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Eye,
  Heart,
  Check
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';

export const ShopCatalogue: React.FC = () => {
  const {
    products,
    openProductDetail,
    addToCart,
    favorites,
    toggleFavorite
  } = useApp();

  const [search, setSearch] = useState(() => {
    const saved = sessionStorage.getItem('handilink_shop_search');
    if (saved) {
      sessionStorage.removeItem('handilink_shop_search');
      return saved;
    }
    return '';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCraftType, setSelectedCraftType] = useState<string>('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(() => {
    const favFlag = sessionStorage.getItem('handilink_shop_favorites');
    if (favFlag) {
      sessionStorage.removeItem('handilink_shop_favorites');
      return true;
    }
    return false;
  });
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    const onFavEvent = () => {
      sessionStorage.removeItem('handilink_shop_favorites');
      setShowFavoritesOnly(true);
    };
    window.addEventListener('handilink:shop-favorites', onFavEvent);
    return () => window.removeEventListener('handilink:shop-favorites', onFavEvent);
  }, []);

  const categories = ['All', 'Textiles', 'Apparel', 'Accessories', 'Home Decor'];
  const craftTypes = ['All', 'Backstrap Loom Inabal', 'Beadwork & Brass', 'Hand Embroidery'];
  const priceRanges = ['All', 'Under ₱4,000', '₱4,000 - ₱8,000', 'Above ₱8,000'];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (showFavoritesOnly && !favorites.includes(p.id)) return false;

      // Search
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.artisan.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase());

      // Category
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;

      // Craft type
      const matchesCraft = selectedCraftType === 'All' || p.craftType === selectedCraftType;

      // Price range
      let matchesPrice = true;
      if (selectedPriceRange === 'Under ₱4,000') matchesPrice = p.price < 4000;
      else if (selectedPriceRange === '₱4,000 - ₱8,000') matchesPrice = p.price >= 4000 && p.price <= 8000;
      else if (selectedPriceRange === 'Above ₱8,000') matchesPrice = p.price > 8000;

      // Availability
      let matchesAvail = true;
      if (selectedAvailability === 'In Stock') matchesAvail = p.stock > 0;
      else if (selectedAvailability === 'Made to Order') matchesAvail = p.stock === 0;

      return matchesSearch && matchesCat && matchesCraft && matchesPrice && matchesAvail;
    }).sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      return 0;
    });
  }, [products, search, selectedCategory, selectedCraftType, selectedPriceRange, selectedAvailability, showFavoritesOnly, favorites, sortBy]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#3B2418] text-[#F8F3E7] rounded-2xl p-8 sm:p-10 border border-[#C9A227]/40 shadow-lg relative overflow-hidden bg-woven-pattern">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs uppercase font-bold tracking-widest text-[#E5C76B]">
            Authentic Bagobo-Tagabawa Catalogue
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F3E7] mt-1">
            The Living Inabal Collection
          </h1>
          <p className="text-xs sm:text-sm text-[#F8F3E7]/80 mt-2 leading-relaxed">
            Every piece is slow-crafted by the master weavers and artisans of BIBATAWA in Binugao, Toril, Davao City using natural abaca, traditional plant extracts, and ancestral beadwork.
          </p>
        </div>
      </div>

      {/* Top Filter and Search Bar */}
      <div className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 p-4 shadow-sm flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by craft, artisan, motif..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F] placeholder-[#5A3825]/60 focus:outline-hidden focus:border-[#C9A227]"
          />
          <Search className="w-4 h-4 text-[#5A3825]/60 absolute left-3 top-2.5" />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-[#C9A227]/40 text-xs text-[#3B2418] font-medium"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Filters</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
              showFavoritesOnly
                ? 'bg-[#3B2418] text-[#E5C76B] border-[#3B2418]'
                : 'bg-white text-[#3B2418] border-[#C9A227]/40 hover:bg-[#F8F3E7]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current text-rose-400' : 'text-rose-600'}`} />
            <span>Favorites ({favorites.length})</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#5A3825] font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded border border-[#C9A227]/40 bg-white text-[#3B2418] font-medium focus:outline-hidden"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid with Sidebar Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <div className={`lg:block ${showFiltersMobile ? 'block' : 'hidden'} lg:sticky lg:top-28 space-y-6 bg-[#FAF6ED] p-5 rounded-xl border border-[#C9A227]/30 h-fit`}>
          <div>
            <h3 className="font-serif font-bold text-sm text-[#3B2418] uppercase tracking-wider mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                    selectedCategory === cat
                      ? 'bg-[#3B2418] text-[#E5C76B] font-bold shadow-xs'
                      : 'text-[#5A3825] hover:bg-white'
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <Check className="w-3 h-3 text-[#E5C76B]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#C9A227]/20 pt-4">
            <h3 className="font-serif font-bold text-sm text-[#3B2418] uppercase tracking-wider mb-3">
              Craft Technique
            </h3>
            <div className="space-y-1">
              {craftTypes.map(craft => (
                <button
                  key={craft}
                  onClick={() => setSelectedCraftType(craft)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                    selectedCraftType === craft
                      ? 'bg-[#3B2418] text-[#E5C76B] font-bold shadow-xs'
                      : 'text-[#5A3825] hover:bg-white'
                  }`}
                >
                  <span className="truncate">{craft}</span>
                  {selectedCraftType === craft && <Check className="w-3 h-3 text-[#E5C76B]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#C9A227]/20 pt-4">
            <h3 className="font-serif font-bold text-sm text-[#3B2418] uppercase tracking-wider mb-3">
              Price Range
            </h3>
            <div className="space-y-1">
              {priceRanges.map(pr => (
                <button
                  key={pr}
                  onClick={() => setSelectedPriceRange(pr)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                    selectedPriceRange === pr
                      ? 'bg-[#3B2418] text-[#E5C76B] font-bold shadow-xs'
                      : 'text-[#5A3825] hover:bg-white'
                  }`}
                >
                  <span>{pr}</span>
                  {selectedPriceRange === pr && <Check className="w-3 h-3 text-[#E5C76B]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#C9A227]/20 pt-4">
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedCraftType('All');
                setSelectedPriceRange('All');
                setSelectedAvailability('All');
                setShowFavoritesOnly(false);
                setSearch('');
              }}
              className="w-full py-1.5 text-xs text-[#5A3825] hover:text-[#3B2418] border border-[#C9A227]/40 rounded bg-white hover:bg-[#F8F3E7] font-medium transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Right Product Grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4 text-xs text-[#5A3825]">
            <span>Showing <span className="font-bold text-[#3B2418]">{filteredProducts.length}</span> authentic indigenous creations</span>
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState
              title="No cultural products found"
              description="No pieces matched your current filter criteria. Try adjusting your category or price parameters."
              actionText="Reset Filters"
              onAction={() => {
                setSelectedCategory('All');
                setSelectedCraftType('All');
                setSelectedPriceRange('All');
                setSelectedAvailability('All');
                setShowFavoritesOnly(false);
                setSearch('');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
              {filteredProducts.map(product => {
                const isFav = favorites.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className="h-full bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 hover:border-[#C9A227] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-4/3 overflow-hidden bg-[#3B2418]/5">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                          isFav
                            ? 'bg-rose-50 text-rose-600 shadow'
                            : 'bg-white/80 text-[#3B2418] hover:text-rose-600'
                        }`}
                        aria-label="Save to favorites"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      <div className="absolute bottom-3 left-3">
                        <Badge variant="gold" size="sm">
                          {product.craftType}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-[#5A3825]/80 mb-1">
                          <span className="font-mono text-[#8C6B0F]">{product.code}</span>
                          <span className="text-emerald-800 font-medium">
                            {product.stock > 0 ? `${product.stock} available` : 'Made to Order'}
                          </span>
                        </div>
                        <h3
                          onClick={() => openProductDetail(product)}
                          className="font-serif font-bold text-base text-[#3B2418] hover:text-[#C9A227] transition-colors cursor-pointer line-clamp-1"
                        >
                          {product.name}
                        </h3>
                        <p className="text-xs text-[#5A3825]/90 line-clamp-2 mt-1">
                          {product.description}
                        </p>
                        <div className="mt-3 text-[11px] text-[#5A3825]">
                          <span>Weaver: </span>
                          <span className="font-semibold text-[#3B2418]">{product.artisan}</span>
                          <span className="text-[10px] text-[#5A3825]/70 block">{product.community}</span>
                        </div>
                      </div>

                      {/* Bottom Pricing & CTA */}
                      <div className="pt-3 border-t border-[#C9A227]/20 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-base font-bold text-[#3B2418]">
                            ₱{product.price.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openProductDetail(product)}
                            className="p-2 border border-[#C9A227]/40 rounded hover:bg-white text-[#3B2418] transition-colors"
                            title="View Full Story & Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => addToCart(product, 1)}
                            className="px-3 py-1.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-[#C9A227]" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
