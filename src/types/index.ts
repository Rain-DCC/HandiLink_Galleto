export type UserRole =
  | 'guest'
  | 'customer'
  | 'admin'
  | 'creative_director'
  | 'ncip_secretary'
  | 'fashion_designer'
  | 'artisan_weaver';

export type AppView =
  | 'landing'
  | 'login'
  | 'register'
  | 'customer_dashboard'
  | 'shop'
  | 'product_detail'
  | 'cart'
  | 'checkout'
  | 'customer_orders'
  | 'admin_dashboard'
  | 'creative_dashboard'
  | 'proposals'
  | 'proposal_evaluation'
  | 'resolutions'
  | 'catalogue'
  | 'patterns'
  | 'order_preparation'
  | 'artisan_production'
  | 'inventory'
  | 'sales'
  | 'logistics'
  | 'pattern_vision'
  | 'cebuano_speech'
  | 'audit_logs'
  | 'users'
  | 'reports'
  | 'settings'
  | 'cultural_stories'
  | 'artisans';

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  roleTitle: string;
  community: string;
  address: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  verified?: boolean;
  authProvider?: string;
  lastLogin: string;
  avatarUrl?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: 'Textiles' | 'Apparel' | 'Accessories' | 'Home Decor';
  price: number;
  stock: number;
  artisan: string;
  community: string;
  description: string;
  culturalStory: string;
  materials: string[];
  pattern: string;
  craftType: 'Backstrap Loom Inabal' | 'Beadwork & Brass' | 'Hand Embroidery' | 'Natural Dyeing';
  status: 'Published' | 'Draft' | 'Archived';
  imageUrl: string;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedPattern?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'In Production' | 'Ready' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Processing' | 'Refunded';

export interface OrderItem {
  id?: string;
  productId?: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  pattern?: string;
}

export interface ShipmentInfo {
  id: string;
  orderId?: string;
  orderNumber?: string;
  trackingNumber: string;
  courier: string;
  origin?: string;
  destination?: string;
  status: 'Preparing' | 'Picked Up' | 'In Transit' | 'Out for Delivery' | 'Delivered';
  estimatedDelivery: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'GCash' | 'Maya' | 'Landbank' | 'Cash on Delivery';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  productionStatus: 'Not Started' | 'In Progress' | 'Inspection' | 'Completed';
  targetCompletionDate: string;
  assignedArtisan?: string;
  notes?: string;
  poNumber?: string;
  terms?: string;
  shipment?: ShipmentInfo | null;
}

export type ProposalStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Revision Requested' | 'Rejected';

export interface Proposal {
  id: string;
  proposalNumber: string;
  date: string;
  personInvolved: string;
  organization: string;
  address: string;
  subject: string;
  letterContent: string;
  status: ProposalStatus;
  submittedBy: string;
  submittedDate: string;
  targetCommunity: string;
  signature: string;
  supportingDocuments: string[];
  evaluationRemarks?: string;
  evaluatedBy?: string;
  evaluationDate?: string;
}

export interface PartnershipResolution {
  id: string;
  resolutionNumber: string;
  proposalNumber: string;
  resolutionDate: string;
  partiesInvolved: string[];
  resolutionContent: string;
  approvalStatus: 'Approved' | 'Pending Final Signatures' | 'Archived';
  signedByNCIP: boolean;
  signedByBIBATAWA: boolean;
  signedByPartner: boolean;
}

export interface PatternDesign {
  id: string;
  code: string;
  name: string;
  culturalOrigin: string;
  description: string;
  associatedProduct: string;
  imageUrl: string;
  symbolism: string;
  complexity: 'High' | 'Medium' | 'Master Weaver';
  fpicVerified?: boolean;
}

export interface ProductionMaterial {
  id: string;
  code: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
  category: 'Natural Fiber' | 'Organic Dye' | 'Seed Beads' | 'Brass Elements' | 'Loom Hardware';
  unitCost: number;
}

export interface ProductionBatch {
  id: string;
  orderNumber: string;
  productName: string;
  productCode: string;
  designPattern: string;
  quantity: number;
  startDate: string;
  targetCompletion: string;
  status: 'Pending' | 'In Production' | 'Completed' | 'Delayed';
  progressPercentage: number;
  assignedArtisan: string;
  communityCluster: string;
  notes: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  referenceCode: string;
  amount: number;
  artisanShare: number;
  trustFundShare: number;
  paymentMethod: string;
  status: PaymentStatus;
  verifiedBy: string;
  verifiedAt: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  service_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
}
