import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppView, UserRole } from '../../types';
import { HANDILINK_LOGO } from '../../utils/assets';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Award,
  Layers,
  Palette,
  ClipboardList,
  Package,
  Boxes,
  CreditCard,
  BarChart3,
  Users as UsersIcon,
  Settings,
  ShoppingBag,
  BookOpen,
  Heart,
  LogOut,
  Shield,
  Home,
  Truck,
  ScanSearch,
  Mic,
  ShieldAlert,
} from 'lucide-react';

interface NavItem {
  id: AppView | 'open_cart' | 'shop_favorites';
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    currentRole,
    logout,
    currentView,
    setCurrentView,
    cart,
    setIsCartDrawerOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    favorites,
  } = useApp();

  const getRoleNavItems = (role: UserRole): NavItem[] => {
    switch (role) {
      case 'customer':
        return [
          { id: 'customer_dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'shop', label: 'Shop Collection', icon: ShoppingBag },
          { id: 'cultural_stories', label: 'Cultural Stories', icon: BookOpen },
          { id: 'customer_orders', label: 'My Orders', icon: Package },
          { id: 'logistics', label: 'Parcel Tracking', icon: Truck },
          { id: 'open_cart', label: 'My Cart', icon: ClipboardList, badge: cart.length > 0 ? `${cart.length}` : undefined },
          { id: 'shop_favorites', label: 'Favorites', icon: Heart, badge: favorites.length > 0 ? `${favorites.length}` : undefined },
          { id: 'settings', label: 'My Profile', icon: Settings },
        ];

      case 'creative_director':
        return [
          { id: 'creative_dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'proposals', label: 'Proposals & LOI', icon: FileText },
          { id: 'resolutions', label: 'Partnership Resolutions', icon: Award },
          { id: 'catalogue', label: 'Product Publishing', icon: Layers },
          { id: 'patterns', label: 'Pattern Archive', icon: Palette },
          { id: 'pattern_vision', label: 'Pattern Verification AI', icon: ScanSearch },
          { id: 'cebuano_speech', label: 'Cebuano Speech AI', icon: Mic },
          { id: 'customer_orders', label: 'Orders', icon: Package },
          { id: 'logistics', label: 'Shipping & Logistics', icon: Truck },
          { id: 'reports', label: 'Cultural Reports', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];

      case 'ncip_secretary':
        return [
          { id: 'proposal_evaluation', label: 'Proposal Evaluation', icon: CheckSquare, badge: 'Active' },
          { id: 'resolutions', label: 'Partnership Resolutions', icon: Award },
          { id: 'proposals', label: 'Proposals Archive', icon: FileText },
          { id: 'pattern_vision', label: 'Pattern IP Guard', icon: ScanSearch },
          { id: 'cultural_stories', label: 'Cultural Protocols', icon: BookOpen },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];

      case 'fashion_designer':
        return [
          { id: 'patterns', label: 'Pattern Catalogue', icon: Palette },
          { id: 'order_preparation', label: 'Order Preparation (PO)', icon: ClipboardList },
          { id: 'pattern_vision', label: 'Pattern Verification AI', icon: ScanSearch },
          { id: 'shop', label: 'Collection View', icon: ShoppingBag },
          { id: 'customer_orders', label: 'Order Progress', icon: Package },
          { id: 'logistics', label: 'Shipment Tracking', icon: Truck },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];

      case 'artisan_weaver':
        return [
          { id: 'artisan_production', label: 'Production Tracker', icon: Package, badge: 'Loom' },
          { id: 'inventory', label: 'Material Inventory', icon: Boxes },
          { id: 'cebuano_speech', label: 'Cebuano Voice Log', icon: Mic },
          { id: 'pattern_vision', label: 'Weave Verification', icon: ScanSearch },
          { id: 'customer_orders', label: 'Assigned Orders', icon: ClipboardList },
          { id: 'logistics', label: 'Dispatch & Logistics', icon: Truck },
          { id: 'patterns', label: 'Ancestral Motifs', icon: Palette },
          { id: 'settings', label: 'Artisan Profile', icon: Settings },
        ];

      case 'admin':
      default:
        return [
          { id: 'admin_dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'proposals', label: 'Proposals', icon: FileText },
          { id: 'proposal_evaluation', label: 'Proposal Evaluation', icon: CheckSquare },
          { id: 'resolutions', label: 'Partnerships', icon: Award },
          { id: 'catalogue', label: 'Product Catalogue', icon: Layers },
          { id: 'patterns', label: 'Patterns & Motifs', icon: Palette },
          { id: 'pattern_vision', label: 'Pattern Vision AI', icon: ScanSearch },
          { id: 'cebuano_speech', label: 'Cebuano Speech AI', icon: Mic },
          { id: 'customer_orders', label: 'Orders', icon: Package },
          { id: 'order_preparation', label: 'Order Preparation', icon: ClipboardList },
          { id: 'artisan_production', label: 'Production Tracker', icon: Package },
          { id: 'inventory', label: 'Material Inventory', icon: Boxes },
          { id: 'logistics', label: 'Shipping & Logistics', icon: Truck },
          { id: 'sales', label: 'Sales & Trust Fund', icon: CreditCard },
          { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'users', label: 'User Verification', icon: UsersIcon },
          { id: 'audit_logs', label: 'System Audit Logs', icon: ShieldAlert },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
    }
  };

  const navItems = getRoleNavItems(currentRole);

  const handleNavClick = (id: AppView | 'open_cart' | 'shop_favorites') => {
    if (id === 'open_cart') {
      setIsCartDrawerOpen(true);
    } else if (id === 'shop_favorites') {
      sessionStorage.setItem('handilink_shop_favorites', '1');
      window.dispatchEvent(new CustomEvent('handilink:shop-favorites'));
      setCurrentView('shop');
    } else {
      setCurrentView(id);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-[92px] left-0 z-40 h-full md:h-[calc(100vh-92px)] w-[260px] shrink-0 bg-[#3B2418] text-[#F8F3E7] flex flex-col border-r border-[#C9A227]/30 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* User & Logo Card */}
        <div className="p-4 border-b border-[#5A3825] bg-[#3B2418]/90 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={HANDILINK_LOGO}
              alt="HandiLink"
              className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 border border-[#C9A227]/50 shrink-0"
            />
            <div className="overflow-hidden">
              <h4 className="font-serif font-semibold text-sm text-[#F8F3E7] truncate">
                {currentUser.name}
              </h4>
              <p className="text-[11px] text-[#E5C76B] font-medium truncate">
                {currentUser.roleTitle}
              </p>
              <p className="text-[10px] text-[#F8F3E7]/60 truncate">
                {currentUser.community}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-[#E5C76B]/70 flex items-center justify-between">
            <span>Workspace</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#5A3825] rounded text-[#E5C76B]">
              {currentRole.replace('_', ' ')}
            </span>
          </div>

          <button
            onClick={() => {
              setCurrentView('landing');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg text-[#F8F3E7]/80 hover:bg-[#5A3825] hover:text-[#E5C76B] transition-colors"
          >
            <Home className="w-4 h-4 text-[#C9A227]" />
            <span>Public Portal</span>
          </button>

          <div className="my-2 border-t border-[#5A3825]/50" />

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id + item.label}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#C9A227] text-[#24150F] font-bold shadow-sm'
                    : 'text-[#F8F3E7]/90 hover:bg-[#5A3825] hover:text-[#E5C76B]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3B2418]' : 'text-[#C9A227]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-[#3B2418] text-[#E5C76B]' : 'bg-[#C9A227]/20 text-[#E5C76B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#5A3825] bg-[#2E1B12] text-[11px] text-[#F8F3E7]/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[#E5C76B] font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>BIBATAWA IPRA Certified</span>
            </div>
            <button
              onClick={logout}
              className="text-[#E5C76B]/80 hover:text-[#E5C76B] p-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-[#F8F3E7]/50 mt-1">
            Binugao Ancestral Domain, Toril, Davao
          </p>
        </div>
      </aside>
    </>
  );
};
