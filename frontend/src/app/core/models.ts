/** Tipos que reflejan los DTO de la API Spring Boot. */

export type Role = 'CUSTOMER' | 'MANAGER' | 'ADMIN';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: 'Bearer';
  username: string;
  role: Role;
  expiresAt: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  active: boolean;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
}

export interface ProductRequest {
  name: string;
  category: string;
  price: number;
  stock: number;
}

export interface Sale {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  customerName: string | null;
  soldAt: string;
}

export interface SaleRequest {
  productId: number;
  quantity: number;
  customerName?: string | null;
}

export interface SaleSummary {
  productName: string;
  units: number;
  revenue: number;
}

export interface DailySales {
  date: string;
  tickets: number;
  units: number;
  revenue: number;
}

export interface Receipt {
  receiptNumber: string;
  issueDate: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Purchase {
  id: number;
  createdAt: string;
  total: number;
  items: PurchaseItem[];
}

export type ClaimStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface Claim {
  id: number;
  orderId: number;
  orderItemId: number;
  productName: string;
  reason: string;
  description: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
  staffResponse: string | null;
  respondedAt: string | null;
}

export interface StaffClaim {
  id: number;
  internalCode: string;
  orderId: number;
  orderItemId: number;
  productName: string;
  reason: string;
  description: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimRequest {
  orderId: number;
  orderItemId: number;
  reason: string;
  description: string;
}

export interface ClaimAudit {
  id: number;
  actorUserId: number;
  previousStatus: string | null;
  newStatus: string;
  action: string;
  details: string;
  createdAt: string;
}

export type DeactivationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

export interface DeactivationRequest {
  id: number;
  targetUserId: number;
  requestedByUserId: number;
  approvedByUserId: number | null;
  status: DeactivationStatus;
  reason: string;
  requestedAt: string;
  decidedAt: string | null;
  executedAt: string | null;
}

/** Error normalizado que devuelve GlobalExceptionHandler. */
export interface ApiError {
  status: number;
  error?: string;
  message: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}
