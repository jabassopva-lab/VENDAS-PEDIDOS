
import React from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  wholesalePrice?: number;
  category: string;
  description: string;
  stock: number;
  barcode?: string;
  supplier?: string;
  unit?: string;
  imageUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  document?: string;
}

export interface CartItem extends Product {
  quantity: number;
  useWholesale?: boolean;
  discount?: number;
}

export interface BusinessProfile {
  id?: string;
  user_id?: string;
  companyName: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
  planStatus: string;
  nextBilling: string;
  pixKey?: string;
  role?: 'USER' | 'ADMIN' | 'DEVELOPER';
  businessType?: 'COCORA' | 'ACAI' | 'GERAL';
}

export interface BusinessStats {
  id: string;
  companyName: string;
  email: string;
  planStatus: string;
  nextBilling: string;
  role?: string;
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  items: CartItem[];
  total: number;
  profit: number;
  date: string;
  time: string;
  paymentMethod: string;
  paymentTerms: string;
  installments: number;
  status: 'FINALIZADA' | 'ORCAMENTO'; // Novo
  isPaid: boolean; // Novo
  deliveryStatus: 'PENDENTE' | 'ENTREGUE'; // Novo
}

export interface SalesData {
  name: string;
  revenue: number;
  profit: number;
  sales: number;
  received: number;
  toReceive: number;
  budgets: number;
  pendingDelivery: number;
}

// Added StatCardProps interface for StatCard component
export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  positive?: boolean;
  icon: React.ReactNode;
}

export enum ModalType {
  ADD = 'ADD',
  EDIT = 'EDIT',
  NEW_SALE = 'NEW_SALE',
  NONE = 'NONE'
}

export type Screen = 'HOME' | 'PRODUCTS' | 'MONTHLY_SALES' | 'REPORTS' | 'CLIENTS' | 'SETTINGS' | 'CLIENT_REPORT' | 'PRODUCT_REPORT' | 'DEVELOPER_PANEL';
