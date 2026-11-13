import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User,
  UserRole,
  AppView,
  Product,
  CartItem,
  Order,
  Proposal,
  PartnershipResolution,
  PatternDesign,
  ProductionMaterial,
  ProductionBatch,
  AppNotification,
  PaymentRecord,
  ShipmentInfo,
  AuditLogEntry,
} from '../types';
import { gatewayFetch, getStoredToken, setStoredToken } from '../services/apiClient';

export type { AppView };

const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest Visitor',
  email: '',
  phone: '',
  role: 'guest',
  roleTitle: 'Public Visitor',
  community: 'Binugao Digital Portal',
  address: '',
  status: 'Active',
  verified: false,
  lastLogin: '',
};

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface AppContextType {
  currentUser: User;
  currentRole: UserRole;
  isLoadingAuth: boolean;
  isLoadingData: boolean;
  toasts: ToastMessage[];
  pushToast: (type: ToastMessage['type'], text: string) => void;
  dismissToast: (id: string) => void;

  // Auth Actions
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerAccount: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    community?: string;
    role: 'customer' | 'fashion_designer' | 'artisan_weaver';
  }) => Promise<void>;
  completeGoogleAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateOwnProfile: (payload: { name: string; phone: string; address: string; community: string }) => Promise<void>;
  refreshAllData: () => Promise<void>;

  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // Catalogue & Patterns
  products: Product[];
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  openProductDetail: (p: Product) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  patterns: PatternDesign[];
  savePatternSelection: (payload: {
    patternId: string;
    patternName: string;
    productCode: string;
    productName: string;
    quantity: number;
    notes: string;
  }) => Promise<void>;

  // Cart & Favorites
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedPattern?: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  favorites: string[];
  toggleFavorite: (productId: string) => Promise<void>;

  // Orders & Production
  orders: Order[];
  createOrder: (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    items: Order['items'];
    shippingFee: number;
    paymentMethod: Order['paymentMethod'];
    notes?: string;
    poNumber?: string;
    terms?: string;
    clearUserCart?: boolean;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['orderStatus']) => Promise<void>;
  batches: ProductionBatch[];
  updateBatchProgress: (batchId: string, progress: number, notes?: string) => Promise<void>;
  markBatchCompleted: (batchId: string) => Promise<void>;

  // Proposals & Resolutions
  proposals: Proposal[];
  addProposal: (proposal: {
    personInvolved: string;
    organization: string;
    address: string;
    subject: string;
    letterContent: string;
    targetCommunity: string;
    signature: string;
    status?: 'Draft' | 'Submitted';
  }) => Promise<Proposal>;
  evaluateProposal: (
    proposalId: string,
    decision: 'Approved' | 'Revision Requested' | 'Rejected',
    remarks: string
  ) => Promise<void>;
  selectedProposal: Proposal | null;
  setSelectedProposal: (p: Proposal | null) => void;
  resolutions: PartnershipResolution[];
  generateResolutionFromProposal: (proposal: Proposal) => Promise<PartnershipResolution>;
  selectedResolution: PartnershipResolution | null;
  setSelectedResolution: (r: PartnershipResolution | null) => void;

  // Inventory
  materials: ProductionMaterial[];
  addMaterial: (material: Omit<ProductionMaterial, 'id' | 'status' | 'lastUpdated'>) => Promise<void>;
  adjustMaterialStock: (materialId: string, actionType: 'in' | 'out' | 'adjust', amount: number, notes?: string) => Promise<void>;

  // Payments & Trust
  payments: PaymentRecord[];
  paymentSummary: {
    totalGross: number;
    disbursedArtisanShare: number;
    accruedTrustFund: number;
    pendingReceivables: number;
  };
  updatePaymentStatus: (orderId: string, status: Order['paymentStatus']) => Promise<void>;

  // Logistics
  shipments: ShipmentInfo[];
  updateShipmentStatus: (
    shipmentId: string,
    payload: { status: ShipmentInfo['status']; courier?: string; estimatedDelivery?: string }
  ) => Promise<void>;

  // Notifications, Users & Audit Logs
  notifications: AppNotification[];
  markNotificationRead: (id: string) => Promise<void>;
  users: User[];
  addUser: (user: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    role: Exclude<UserRole, 'guest'>;
    community: string;
  }) => Promise<void>;
  verifyUserAccount: (userId: string, verified: boolean, status?: User['status']) => Promise<void>;
  auditLogs: AuditLogEntry[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function defaultViewForRole(role: UserRole): AppView {
  switch (role) {
    case 'customer':
      return 'customer_dashboard';
    case 'admin':
      return 'admin_dashboard';
    case 'creative_director':
      return 'creative_dashboard';
    case 'ncip_secretary':
      return 'proposal_evaluation';
    case 'fashion_designer':
      return 'patterns';
    case 'artisan_weaver':
      return 'artisan_production';
    default:
      return 'landing';
  }
}

function isValidUser(candidate: unknown): candidate is User {
  return Boolean(
    candidate &&
      typeof candidate === 'object' &&
      'role' in candidate &&
      typeof (candidate as User).role === 'string' &&
      (candidate as User).role.length > 0
  );
}

function assertValidUser(candidate: unknown): User {
  if (!isValidUser(candidate)) {
    throw new Error('Received an invalid user session payload from the server.');
  }
  return candidate;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [patterns, setPatterns] = useState<PatternDesign[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [resolutions, setResolutions] = useState<PartnershipResolution[]>([]);
  const [selectedResolution, setSelectedResolution] = useState<PartnershipResolution | null>(null);
  const [materials, setMaterials] = useState<ProductionMaterial[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentSummary, setPaymentSummary] = useState({
    totalGross: 0,
    disbursedArtisanShare: 0,
    accruedTrustFund: 0,
    pendingReceivables: 0,
  });
  const [shipments, setShipments] = useState<ShipmentInfo[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const safeCurrentUser: User = isValidUser(currentUser) ? currentUser : GUEST_USER;
  const currentRole: UserRole = safeCurrentUser.role;

  const pushToast = useCallback((type: ToastMessage['type'], text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const loadPublicCatalogue = useCallback(async () => {
    try {
      const [prodRes, patRes] = await Promise.all([
        gatewayFetch<{ products: Product[] }>('/catalogue/products'),
        gatewayFetch<{ patterns: PatternDesign[] }>('/catalogue/patterns'),
      ]);
      setProducts(prodRes.products || []);
      setPatterns(patRes.patterns || []);
      setSelectedProduct(prev => prev || prodRes.products?.[0] || null);
    } catch (err: any) {
      pushToast('error', err?.message || 'Unable to load public catalogue.');
    }
  }, [pushToast]);

  const loadRoleData = useCallback(
    async (role: UserRole) => {
      await loadPublicCatalogue();
      if (role === 'guest') return;

      setIsLoadingData(true);
      try {
        const tasks: Promise<void>[] = [
          gatewayFetch<{ cart: CartItem[] }>('/workflow/cart').then(r => setCart(r.cart || [])).catch(() => {}),
          gatewayFetch<{ favorites: string[] }>('/workflow/favorites').then(r => setFavorites(r.favorites || [])).catch(() => {}),
          gatewayFetch<{ orders: Order[] }>('/workflow/orders').then(r => setOrders(r.orders || [])).catch(() => {}),
          gatewayFetch<{ shipments: ShipmentInfo[] }>('/logistics/shipments').then(r => setShipments(r.shipments || [])).catch(() => {}),
          gatewayFetch<{ notifications: AppNotification[] }>('/analytics/notifications').then(r => setNotifications(r.notifications || [])).catch(() => {}),
        ];

        if (['admin', 'creative_director', 'ncip_secretary', 'artisan_weaver', 'fashion_designer'].includes(role)) {
          tasks.push(
            gatewayFetch<{ proposals: Proposal[] }>('/proposals')
              .then(r => {
                setProposals(r.proposals || []);
                if (r.proposals?.[0]) setSelectedProposal(prev => prev || r.proposals[0]);
              })
              .catch(() => {}),
            gatewayFetch<{ resolutions: PartnershipResolution[] }>('/resolutions')
              .then(r => {
                setResolutions(r.resolutions || []);
                if (r.resolutions?.[0]) setSelectedResolution(prev => prev || r.resolutions[0]);
              })
              .catch(() => {})
          );
        }

        if (['admin', 'creative_director', 'artisan_weaver', 'fashion_designer'].includes(role)) {
          tasks.push(
            gatewayFetch<{ batches: ProductionBatch[] }>('/workflow/production')
              .then(r => setBatches(r.batches || []))
              .catch(() => {})
          );
        }

        if (['admin', 'creative_director', 'artisan_weaver'].includes(role)) {
          tasks.push(
            gatewayFetch<{ materials: ProductionMaterial[] }>('/catalogue/inventory')
              .then(r => setMaterials(r.materials || []))
              .catch(() => {}),
            gatewayFetch<{ payments: PaymentRecord[]; summary: any }>('/payments')
              .then(r => {
                setPayments(r.payments || []);
                if (r.summary) setPaymentSummary(r.summary);
              })
              .catch(() => {})
          );
        }

        if (role === 'admin') {
          tasks.push(
            gatewayFetch<{ users: User[] }>('/analytics/users').then(r => setUsers(r.users || [])).catch(() => {}),
            gatewayFetch<{ logs: AuditLogEntry[] }>('/analytics/audit-logs').then(r => setAuditLogs(r.logs || [])).catch(() => {})
          );
        }

        await Promise.all(tasks);
      } finally {
        setIsLoadingData(false);
      }
    },
    [loadPublicCatalogue]
  );

  // Hydrate auth session on boot
  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = getStoredToken();
      if (!token) {
        await loadPublicCatalogue();
        if (mounted) setIsLoadingAuth(false);
        return;
      }

      try {
        const res = await gatewayFetch<{ user: User }>('/auth/me');
        if (mounted && isValidUser(res?.user)) {
          setCurrentUser(res.user);
          await loadRoleData(res.user.role);
        } else if (mounted) {
          setStoredToken(null);
          setCurrentUser(GUEST_USER);
          await loadPublicCatalogue();
        }
      } catch {
        setStoredToken(null);
        if (mounted) {
          setCurrentUser(GUEST_USER);
          await loadPublicCatalogue();
        }
      } finally {
        if (mounted) setIsLoadingAuth(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadPublicCatalogue, loadRoleData]);

  const refreshAllData = async () => {
    await loadRoleData(currentRole);
  };

  const loginWithEmail = async (email: string, password: string) => {
    const res = await gatewayFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const validUser = assertValidUser(res?.user);
    if (!res?.token) {
      throw new Error('Authentication token missing from login response.');
    }
    setStoredToken(res.token);
    setCurrentUser(validUser);
    await loadRoleData(validUser.role);
    setCurrentView(defaultViewForRole(validUser.role));
    pushToast('success', `Welcome back, ${validUser.name}`);
  };

  const registerAccount = async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    community?: string;
    role: 'customer' | 'fashion_designer' | 'artisan_weaver';
  }) => {
    const res = await gatewayFetch<{ token: string; user: User; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const validUser = assertValidUser(res?.user);
    if (!res?.token) {
      throw new Error('Authentication token missing from registration response.');
    }
    setStoredToken(res.token);
    setCurrentUser(validUser);
    await loadRoleData(validUser.role);
    setCurrentView(defaultViewForRole(validUser.role));
    pushToast('success', res.message || 'Account created successfully.');
  };

  const completeGoogleAuth = async (token: string, user: User) => {
    const validUser = assertValidUser(user);
    if (!token) {
      throw new Error('Authentication token missing from Google sign-in response.');
    }
    setStoredToken(token);
    setCurrentUser(validUser);
    await loadRoleData(validUser.role);
    setCurrentView(defaultViewForRole(validUser.role));
    pushToast('success', `Signed in with Google as ${validUser.name}`);
  };

  const logout = async () => {
    try {
      await gatewayFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore if session already expired
    }
    setStoredToken(null);
    setCurrentUser(GUEST_USER);
    setCart([]);
    setFavorites([]);
    setOrders([]);
    setProposals([]);
    setResolutions([]);
    setBatches([]);
    setMaterials([]);
    setPayments([]);
    setShipments([]);
    setNotifications([]);
    setUsers([]);
    setAuditLogs([]);
    setCurrentView('landing');
    pushToast('info', 'You have signed out cleanly.');
  };

  const updateOwnProfile = async (payload: { name: string; phone: string; address: string; community: string }) => {
    const res = await gatewayFetch<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const validUser = assertValidUser(res?.user);
    setCurrentUser(validUser);
    pushToast('success', 'Profile updated in database.');
  };

  const openProductDetail = (p: Product) => {
    setSelectedProduct(p);
    setCurrentView('product_detail');
  };

  const addProduct = async (prodData: Omit<Product, 'id'>) => {
    const res = await gatewayFetch<{ product: Product }>('/catalogue/products', {
      method: 'POST',
      body: JSON.stringify(prodData),
    });
    setProducts(prev => [res.product, ...prev]);
    pushToast('success', `Published "${res.product.name}" to catalogue.`);
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const res = await gatewayFetch<{ product: Product }>(`/catalogue/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    setProducts(prev => prev.map(p => (p.id === id ? res.product : p)));
    pushToast('success', `Updated "${res.product.name}".`);
  };

  const deleteProduct = async (id: string) => {
    await gatewayFetch(`/catalogue/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(p => p.id !== id));
    pushToast('info', 'Product removed from catalogue.');
  };

  const savePatternSelection = async (payload: {
    patternId: string;
    patternName: string;
    productCode: string;
    productName: string;
    quantity: number;
    notes: string;
  }) => {
    await gatewayFetch('/catalogue/pattern-selections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    pushToast('success', 'Bespoke pattern specification saved to database.');
  };

  const addToCart = async (product: Product, quantity = 1, selectedPattern?: string) => {
    if (currentRole === 'guest') {
      // Allow local preview cart for guest, or prompt login at checkout
      setCart(prev => {
        const existing = prev.find(i => i.product.id === product.id);
        if (existing) {
          return prev.map(i => (i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i));
        }
        return [...prev, { product, quantity, selectedPattern }];
      });
      setIsCartDrawerOpen(true);
      return;
    }

    await gatewayFetch('/workflow/cart', {
      method: 'POST',
      body: JSON.stringify({ productId: product.id, quantity, selectedPattern: selectedPattern || product.pattern }),
    });
    const res = await gatewayFetch<{ cart: CartItem[] }>('/workflow/cart');
    setCart(res.cart || []);
    setIsCartDrawerOpen(true);
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (currentRole === 'guest') {
      if (quantity <= 0) {
        setCart(prev => prev.filter(i => i.product.id !== productId));
      } else {
        setCart(prev => prev.map(i => (i.product.id === productId ? { ...i, quantity } : i)));
      }
      return;
    }
    await gatewayFetch(`/workflow/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    const res = await gatewayFetch<{ cart: CartItem[] }>('/workflow/cart');
    setCart(res.cart || []);
  };

  const removeFromCart = async (productId: string) => {
    if (currentRole === 'guest') {
      setCart(prev => prev.filter(i => i.product.id !== productId));
      return;
    }
    await gatewayFetch(`/workflow/cart/${productId}`, { method: 'DELETE' });
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const clearCart = async () => {
    if (currentRole !== 'guest') {
      await gatewayFetch('/workflow/cart', { method: 'DELETE' });
    }
    setCart([]);
  };

  const toggleFavorite = async (productId: string) => {
    if (currentRole === 'guest') {
      pushToast('info', 'Sign in to save favorites to your patron profile.');
      return;
    }
    const res = await gatewayFetch<{ favorited: boolean }>('/workflow/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
    setFavorites(prev => (res.favorited ? [...prev, productId] : prev.filter(id => id !== productId)));
  };

  const createOrder: AppContextType['createOrder'] = async orderData => {
    if (currentRole === 'guest') {
      setCurrentView('login');
      throw new Error('Please sign in or register an account to place an order.');
    }
    const res = await gatewayFetch<{ order: Order }>('/workflow/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    await refreshAllData();
    pushToast('success', `Order ${res.order.orderNumber} created and queued for weaving.`);
    return res.order;
  };

  const updateOrderStatus = async (orderId: string, orderStatus: Order['orderStatus']) => {
    const res = await gatewayFetch<{ order: Order }>(`/workflow/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ orderStatus }),
    });
    setOrders(prev => prev.map(o => (o.id === orderId ? res.order : o)));
    pushToast('success', `Order ${res.order.orderNumber} updated to ${orderStatus}.`);
  };

  const updateBatchProgress = async (batchId: string, progress: number, notes?: string) => {
    const res = await gatewayFetch<{ batch: ProductionBatch }>(`/workflow/production/${batchId}`, {
      method: 'PATCH',
      body: JSON.stringify({ progressPercentage: progress, notes }),
    });
    setBatches(prev => prev.map(b => (b.id === batchId ? res.batch : b)));
    pushToast('success', `Production batch updated to ${res.batch.progressPercentage}%.`);
  };

  const markBatchCompleted = async (batchId: string) => {
    const res = await gatewayFetch<{ batch: ProductionBatch }>(`/workflow/production/${batchId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        progressPercentage: 100,
        status: 'Completed',
        notes: 'Batch officially verified by Master Artisan inspection.',
      }),
    });
    setBatches(prev => prev.map(b => (b.id === batchId ? res.batch : b)));
    await refreshAllData();
    pushToast('success', 'Production batch marked completed.');
  };

  const addProposal: AppContextType['addProposal'] = async propData => {
    const res = await gatewayFetch<{ proposal: Proposal }>('/proposals', {
      method: 'POST',
      body: JSON.stringify(propData),
    });
    setProposals(prev => [res.proposal, ...prev]);
    setSelectedProposal(res.proposal);
    pushToast('success', `Proposal ${res.proposal.proposalNumber} submitted.`);
    return res.proposal;
  };

  const evaluateProposal: AppContextType['evaluateProposal'] = async (proposalId, decision, remarks) => {
    const res = await gatewayFetch<{ proposal: Proposal; resolution?: PartnershipResolution }>(
      `/proposals/${proposalId}/evaluate`,
      {
        method: 'POST',
        body: JSON.stringify({ decision, remarks }),
      }
    );
    setProposals(prev => prev.map(p => (p.id === proposalId ? res.proposal : p)));
    if (selectedProposal?.id === proposalId) setSelectedProposal(res.proposal);
    if (res.resolution) {
      setResolutions(prev => [res.resolution!, ...prev]);
      setSelectedResolution(res.resolution);
    }
    pushToast('success', `Evaluation recorded: ${decision}.`);
  };

  const generateResolutionFromProposal = async (proposal: Proposal) => {
    const res = await gatewayFetch<{ resolution: PartnershipResolution }>('/resolutions', {
      method: 'POST',
      body: JSON.stringify({ proposalId: proposal.id }),
    });
    setResolutions(prev => [res.resolution, ...prev]);
    setSelectedResolution(res.resolution);
    pushToast('success', `Generated resolution ${res.resolution.resolutionNumber}.`);
    return res.resolution;
  };

  const addMaterial = async (material: Omit<ProductionMaterial, 'id' | 'status' | 'lastUpdated'>) => {
    const res = await gatewayFetch<{ material: ProductionMaterial }>('/catalogue/inventory', {
      method: 'POST',
      body: JSON.stringify(material),
    });
    setMaterials(prev => [...prev, res.material]);
    pushToast('success', `Added ${res.material.name} to inventory.`);
  };

  const adjustMaterialStock = async (
    materialId: string,
    actionType: 'in' | 'out' | 'adjust',
    amount: number,
    notes?: string
  ) => {
    const res = await gatewayFetch<{ material: ProductionMaterial }>(`/catalogue/inventory/${materialId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ actionType, amount, notes }),
    });
    setMaterials(prev => prev.map(m => (m.id === materialId ? res.material : m)));
    pushToast('success', `Updated stock for ${res.material.name}.`);
  };

  const updatePaymentStatus = async (orderId: string, status: Order['paymentStatus']) => {
    await gatewayFetch(`/payments/${orderId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    await refreshAllData();
    pushToast('success', `Payment status updated to ${status}.`);
  };

  const updateShipmentStatus: AppContextType['updateShipmentStatus'] = async (shipmentId, payload) => {
    const res = await gatewayFetch<{ shipment: ShipmentInfo }>(`/logistics/shipments/${shipmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    setShipments(prev => prev.map(s => (s.id === shipmentId ? res.shipment : s)));
    await refreshAllData();
    pushToast('success', `Shipment ${res.shipment.trackingNumber} updated to ${res.shipment.status}.`);
  };

  const markNotificationRead = async (id: string) => {
    await gatewayFetch(`/analytics/notifications/${id}/read`, { method: 'POST' });
    setNotifications(prev =>
      id === 'all' ? prev.map(n => ({ ...n, read: true })) : prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const addUser: AppContextType['addUser'] = async userData => {
    const res = await gatewayFetch<{ user: User }>('/analytics/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setUsers(prev => [res.user, ...prev]);
    pushToast('success', `Enrolled ${res.user.name}.`);
  };

  const verifyUserAccount: AppContextType['verifyUserAccount'] = async (userId, verified, status) => {
    const res = await gatewayFetch<{ user: User }>(`/analytics/users/${userId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ verified, status }),
    });
    setUsers(prev => prev.map(u => (u.id === userId ? res.user : u)));
    pushToast('success', `${res.user.name} verification status updated.`);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser: safeCurrentUser,
        currentRole,
        isLoadingAuth,
        isLoadingData,
        toasts,
        pushToast,
        dismissToast,
        loginWithEmail,
        registerAccount,
        completeGoogleAuth,
        logout,
        updateOwnProfile,
        refreshAllData,
        currentView,
        setCurrentView,
        products,
        selectedProduct,
        setSelectedProduct,
        openProductDetail,
        addProduct,
        updateProduct,
        deleteProduct,
        patterns,
        savePatternSelection,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        favorites,
        toggleFavorite,
        orders,
        createOrder,
        updateOrderStatus,
        batches,
        updateBatchProgress,
        markBatchCompleted,
        proposals,
        addProposal,
        evaluateProposal,
        selectedProposal,
        setSelectedProposal,
        resolutions,
        generateResolutionFromProposal,
        selectedResolution,
        setSelectedResolution,
        materials,
        addMaterial,
        adjustMaterialStock,
        payments,
        paymentSummary,
        updatePaymentStatus,
        shipments,
        updateShipmentStatus,
        notifications,
        markNotificationRead,
        users,
        addUser,
        verifyUserAccount,
        auditLogs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
