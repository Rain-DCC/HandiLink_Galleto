import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { HANDILINK_LOGO } from '../../utils/assets';
import {
  ShoppingBag,
  Bell,
  Menu,
  X,
  Search,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currentRole,
    currentView,
    setCurrentView,
    logout,
    cart,
    setIsCartDrawerOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    notifications,
    markNotificationRead,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const roleBadges: Record<UserRole, string> = {
    customer: 'Cultural Patron',
    admin: 'Administrator',
    creative_director: 'Creative Director',
    ncip_secretary: 'NCIP Secretary',
    fashion_designer: 'Fashion Designer',
    artisan_weaver: 'Master Artisan',
    guest: 'Public Visitor',
  };

  const navigateToDashboard = () => {
    if (currentRole === 'customer') setCurrentView('customer_dashboard');
    else if (currentRole === 'admin') setCurrentView('admin_dashboard');
    else if (currentRole === 'creative_director') setCurrentView('creative_dashboard');
    else if (currentRole === 'ncip_secretary') setCurrentView('proposal_evaluation');
    else if (currentRole === 'fashion_designer') setCurrentView('patterns');
    else if (currentRole === 'artisan_weaver') setCurrentView('artisan_production');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      sessionStorage.setItem('handilink_shop_search', searchQuery.trim());
    }
    setCurrentView('shop');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6ED]/95 backdrop-blur-md border-b border-[#C9A227]/25 shadow-xs">
      {/* Top Banner (h-7 = 28px) */}
      <div className="h-7 bg-[#3B2418] text-[#E5C76B] px-4 text-xs flex items-center justify-between gap-3 border-b border-[#C9A227]/30">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
          <span className="font-serif tracking-wide hidden sm:inline truncate">
            Binugao Bagobo-Tagabawa Women Weavers Association (BIBATAWA)
          </span>
          <span className="text-[#F8F3E7]/60 hidden md:inline shrink-0">|</span>
          <span className="text-[#F8F3E7]/80 truncate">
            Official Ancestral Domain Digital Platform · Davao City
          </span>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-[#5A3825] text-[#E5C76B] border border-[#C9A227]/35 font-medium whitespace-nowrap">
            {roleBadges[currentRole]}
          </span>
          {currentRole !== 'guest' && (
            <button
              onClick={logout}
              className="text-[#F8F3E7]/80 hover:text-[#E5C76B] flex items-center gap-1 font-medium transition-colors whitespace-nowrap"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Bar (h-16 = 64px -> total header = 92px) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Official Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
          {currentRole !== 'guest' && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#3B2418] md:hidden rounded-lg hover:bg-[#3B2418]/5 shrink-0"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={() => setCurrentView('landing')}
            className="group text-left flex items-center gap-2.5 sm:gap-3 focus:outline-hidden"
          >
            <img
              src={HANDILINK_LOGO}
              alt="HandiLink Logo"
              className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 border border-[#C9A227]/40 shadow-xs shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-base sm:text-xl tracking-tight text-[#3B2418]">
                  HANDILINK
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#C9A227]/20 text-[#8C6B0F] border border-[#C9A227]/30 hidden sm:inline">
                  BIBATAWA
                </span>
              </div>
              <p className="text-[11px] text-[#5A3825]/90 tracking-wide hidden sm:block truncate">
                Preserving Heritage · Empowering Artisans
              </p>
            </div>
          </button>
        </div>

        {/* Center Navigation & Search */}
        <div className="hidden lg:flex items-center gap-5 min-w-0">
          <nav className="flex items-center gap-4 xl:gap-5 text-sm font-medium text-[#5A3825] whitespace-nowrap">
            <button
              onClick={() => setCurrentView('landing')}
              className={`hover:text-[#3B2418] transition-colors pb-1 ${
                currentView === 'landing' ? 'text-[#3B2418] border-b-2 border-[#C9A227] font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView('shop')}
              className={`hover:text-[#3B2418] transition-colors pb-1 ${
                currentView === 'shop' ? 'text-[#3B2418] border-b-2 border-[#C9A227] font-semibold' : ''
              }`}
            >
              Collection
            </button>
            <button
              onClick={() => setCurrentView('cultural_stories')}
              className={`hover:text-[#3B2418] transition-colors pb-1 ${
                currentView === 'cultural_stories' ? 'text-[#3B2418] border-b-2 border-[#C9A227] font-semibold' : ''
              }`}
            >
              Cultural Stories
            </button>
            <button
              onClick={() => setCurrentView('artisans')}
              className={`hover:text-[#3B2418] transition-colors pb-1 ${
                currentView === 'artisans' ? 'text-[#3B2418] border-b-2 border-[#C9A227] font-semibold' : ''
              }`}
            >
              Our Artisans
            </button>
          </nav>

          <form onSubmit={handleSearchSubmit} className="relative w-44 xl:w-60 shrink-0">
            <input
              type="text"
              placeholder="Search Inabal, tanggo, crafts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-[#F8F3E7] border border-[#C9A227]/40 text-[#24150F] placeholder-[#5A3825]/50 focus:outline-hidden focus:border-[#C9A227]"
            />
            <Search className="w-3.5 h-3.5 text-[#5A3825]/60 absolute left-2.5 top-2" />
          </form>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentRole !== 'guest' && (
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-[#3B2418] hover:text-[#C9A227] hover:bg-[#3B2418]/5 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#C9A227] text-[#3B2418] font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-[#FAF6ED]">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FAF6ED] rounded-xl shadow-2xl border border-[#C9A227]/40 py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#C9A227]/20 flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-[#3B2418]">Notifications</span>
                    <button
                      onClick={() => markNotificationRead('all')}
                      className="text-[11px] text-[#8C6B0F] hover:underline font-semibold"
                    >
                      Mark all read ({unreadNotifs})
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#C9A227]/10">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-xs text-center text-[#5A3825]/70">No notifications yet.</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 text-xs cursor-pointer hover:bg-[#C9A227]/10 transition-colors ${
                            !n.read ? 'bg-[#C9A227]/15 font-medium' : 'text-[#5A3825]/90'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[#3B2418] flex items-center gap-1.5">
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />}
                              {n.title}
                            </span>
                            <span className="text-[10px] text-[#5A3825]/60">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-[#5A3825] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative p-2 text-[#3B2418] hover:text-[#C9A227] hover:bg-[#3B2418]/5 rounded-lg transition-colors"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartTotalItems > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#3B2418] text-[#E5C76B] font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-[#FAF6ED]">
                {cartTotalItems}
              </span>
            )}
          </button>

          {currentRole === 'guest' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('login')}
                className="px-3 py-1.5 border border-[#3B2418]/30 text-[#3B2418] hover:bg-[#3B2418]/5 font-semibold text-xs rounded transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => setCurrentView('register')}
                className="px-3.5 py-1.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-semibold text-xs rounded transition-colors shadow-xs"
              >
                Register
              </button>
            </div>
          ) : (
            <button
              onClick={navigateToDashboard}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded transition-colors text-xs font-semibold shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#C9A227]" />
              <span className="truncate max-w-[120px]">{currentUser.name.split(' ')[0]} Portal</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
