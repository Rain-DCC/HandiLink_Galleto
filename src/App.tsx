import React, { Component, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react';
import { LandingPage } from './components/public/LandingPage';
import { AppView } from './types';

// Lazy-loaded Public views
const LoginPage = lazy(() => import('./components/public/LoginPage').then(m => ({ default: m.LoginPage })));
const CulturalStoriesView = lazy(() =>
  import('./components/public/CulturalStoriesView').then(m => ({ default: m.CulturalStoriesView }))
);
const ArtisansShowcase = lazy(() =>
  import('./components/public/ArtisansShowcase').then(m => ({ default: m.ArtisansShowcase }))
);

// Lazy-loaded Customer views
const CustomerDashboard = lazy(() =>
  import('./components/customer/CustomerDashboard').then(m => ({ default: m.CustomerDashboard }))
);
const ShopCatalogue = lazy(() =>
  import('./components/customer/ShopCatalogue').then(m => ({ default: m.ShopCatalogue }))
);
const ProductDetailView = lazy(() =>
  import('./components/customer/ProductDetailModal').then(m => ({ default: m.ProductDetailView }))
);
const CheckoutFlow = lazy(() =>
  import('./components/customer/CheckoutFlow').then(m => ({ default: m.CheckoutFlow }))
);
const CustomerOrders = lazy(() =>
  import('./components/customer/CustomerOrders').then(m => ({ default: m.CustomerOrders }))
);

// Lazy-loaded Admin & Governance views
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);
const CreativeDirectorDashboard = lazy(() =>
  import('./components/admin/CreativeDirectorDashboard').then(m => ({ default: m.CreativeDirectorDashboard }))
);
const ProposalManagement = lazy(() =>
  import('./components/admin/ProposalManagement').then(m => ({ default: m.ProposalManagement }))
);
const ProposalEvaluation = lazy(() =>
  import('./components/admin/ProposalEvaluation').then(m => ({ default: m.ProposalEvaluation }))
);
const PartnershipResolutionView = lazy(() =>
  import('./components/admin/PartnershipResolutionView').then(m => ({ default: m.PartnershipResolutionView }))
);
const CatalogueManagement = lazy(() =>
  import('./components/admin/CatalogueManagement').then(m => ({ default: m.CatalogueManagement }))
);
const OrderPreparationModule = lazy(() =>
  import('./components/admin/OrderPreparationModule').then(m => ({ default: m.OrderPreparationModule }))
);
const SalesPaymentModule = lazy(() =>
  import('./components/admin/SalesPaymentModule').then(m => ({ default: m.SalesPaymentModule }))
);
const UserManagement = lazy(() =>
  import('./components/admin/UserManagement').then(m => ({ default: m.UserManagement }))
);
const ReportsModule = lazy(() =>
  import('./components/admin/ReportsModule').then(m => ({ default: m.ReportsModule }))
);
const SettingsModule = lazy(() =>
  import('./components/admin/SettingsModule').then(m => ({ default: m.SettingsModule }))
);
const AuditLogsView = lazy(() =>
  import('./components/admin/AuditLogsView').then(m => ({ default: m.AuditLogsView }))
);

// Lazy-loaded Artisan, Designer, AI & Logistics views
const ArtisanProductionDashboard = lazy(() =>
  import('./components/artisan/ArtisanProductionDashboard').then(m => ({ default: m.ArtisanProductionDashboard }))
);
const InventoryModule = lazy(() =>
  import('./components/artisan/InventoryModule').then(m => ({ default: m.InventoryModule }))
);
const PatternDesignModule = lazy(() =>
  import('./components/designer/PatternDesignModule').then(m => ({ default: m.PatternDesignModule }))
);
const ShippingLogisticsModule = lazy(() =>
  import('./components/logistics/ShippingLogisticsModule').then(m => ({ default: m.ShippingLogisticsModule }))
);
const PatternVisionPanel = lazy(() =>
  import('./components/ai/PatternVisionPanel').then(m => ({ default: m.PatternVisionPanel }))
);
const CebuanoSpeechPanel = lazy(() =>
  import('./components/ai/CebuanoSpeechPanel').then(m => ({ default: m.CebuanoSpeechPanel }))
);

class ViewErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected view error.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto my-16 p-8 bg-[#FAF6ED] rounded-2xl border border-[#C9A227]/40 text-center space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#3B2418]">View Recovery</h2>
          <p className="text-xs text-[#5A3825]">{this.state.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="px-4 py-2 rounded-lg bg-[#3B2418] text-[#F8F3E7] text-xs font-semibold hover:bg-[#5A3825]"
          >
            Reload Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ViewLoader: React.FC = () => (
  <div className="min-h-[40vh] flex flex-col items-center justify-center text-[#3B2418] gap-2.5 p-8">
    <Loader2 className="w-6 h-6 animate-spin text-[#C9A227]" />
    <span className="text-xs font-medium text-[#5A3825]">Loading workspace module...</span>
  </div>
);

const PUBLIC_VIEWS: AppView[] = [
  'landing',
  'login',
  'register',
  'shop',
  'product_detail',
  'cultural_stories',
  'artisans',
];

const MainLayout: React.FC = () => {
  const { currentView, currentRole, isLoadingAuth, toasts, dismissToast } = useApp();

  const isPublicStandalone =
    currentView === 'landing' || currentView === 'login' || currentView === 'register';

  const renderActiveView = () => {
    if (currentRole === 'guest' && !PUBLIC_VIEWS.includes(currentView)) {
      return <LoginPage initialMode="login" />;
    }

    if ((currentView === 'users' || currentView === 'audit_logs') && currentRole !== 'admin') {
      return (
        <div className="max-w-xl mx-auto my-16 p-8 bg-[#FAF6ED] rounded-xl border border-[#C9A227]/40 text-center space-y-2">
          <h2 className="font-serif text-xl font-bold text-[#3B2418]">Administrator Access Required</h2>
          <p className="text-xs text-[#5A3825]">
            This governance module is restricted to BIBATAWA Systems & Association Administrators.
          </p>
        </div>
      );
    }

    switch (currentView) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <LoginPage initialMode="login" />;
      case 'register':
        return <LoginPage initialMode="register" />;
      case 'shop':
        return <ShopCatalogue />;
      case 'product_detail':
        return <ProductDetailView />;
      case 'checkout':
        return <CheckoutFlow />;
      case 'cultural_stories':
        return <CulturalStoriesView />;
      case 'artisans':
        return <ArtisansShowcase />;
      case 'customer_dashboard':
        return <CustomerDashboard />;
      case 'customer_orders':
        return <CustomerOrders />;
      case 'admin_dashboard':
        return <AdminDashboard />;
      case 'creative_dashboard':
        return <CreativeDirectorDashboard />;
      case 'proposals':
        return <ProposalManagement />;
      case 'proposal_evaluation':
        return <ProposalEvaluation />;
      case 'resolutions':
        return <PartnershipResolutionView />;
      case 'catalogue':
        return <CatalogueManagement />;
      case 'patterns':
        return <PatternDesignModule />;
      case 'order_preparation':
        return <OrderPreparationModule />;
      case 'artisan_production':
        return <ArtisanProductionDashboard />;
      case 'inventory':
        return <InventoryModule />;
      case 'sales':
        return <SalesPaymentModule />;
      case 'logistics':
        return <ShippingLogisticsModule />;
      case 'pattern_vision':
        return <PatternVisionPanel />;
      case 'cebuano_speech':
        return <CebuanoSpeechPanel />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'users':
        return <UserManagement />;
      case 'reports':
        return <ReportsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <LandingPage />;
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F3E7] text-[#3B2418] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A227]" />
        <p className="font-serif text-sm font-semibold">Initializing HandiLink Gateway...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F3E7] text-[#24150F]">
      <Navbar />

      {isPublicStandalone ? (
        <main className="flex-1 min-w-0">
          <ViewErrorBoundary>
            <Suspense fallback={<ViewLoader />}>{renderActiveView()}</Suspense>
          </ViewErrorBoundary>
        </main>
      ) : (
        <div className="flex-1 flex min-w-0 w-full items-stretch">
          <Sidebar />
          <main className="flex-1 min-w-0 bg-[#F8F3E7]">
            <ViewErrorBoundary>
              <Suspense fallback={<ViewLoader />}>{renderActiveView()}</Suspense>
            </ViewErrorBoundary>
          </main>
        </div>
      )}

      <CartDrawer />

      {/* Global Toast Stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`p-3.5 rounded-xl border shadow-lg text-xs flex items-start gap-2.5 ${
                toast.type === 'success'
                  ? 'bg-emerald-950 text-emerald-50 border-emerald-700'
                  : toast.type === 'error'
                  ? 'bg-rose-950 text-rose-50 border-rose-700'
                  : 'bg-[#3B2418] text-[#F8F3E7] border-[#C9A227]/50'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-relaxed">{toast.text}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="opacity-70 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
