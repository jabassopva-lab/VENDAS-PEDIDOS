
import React from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice: number;
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
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  items: CartItem[];
  total: number;
  profit?: number;
  date: string;
  time?: string;
  paymentMethod?: string;
  paymentTerms?: string;
}

export interface BusinessProfile {
  companyName: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string; // Novo campo para centralizar a logo
  pixKey?: string;
  planStatus: 'FREE' | 'PREMIUM' | 'PRO';
  nextBilling?: string;
}

export interface SalesData {
  name: string;
  revenue: number;
  profit: number;
  sales: number;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  positive?: boolean;
  icon?: React.ReactNode;
}

export enum ModalType {
  ADD = 'ADD',
  EDIT = 'EDIT',
  NEW_SALE = 'NEW_SALE',
  NONE = 'NONE'
}

export type Screen = 'HOME' | 'PRODUCTS' | 'MONTHLY_SALES' | 'REPORTS' | 'CLIENTS' | 'SETTINGS';
