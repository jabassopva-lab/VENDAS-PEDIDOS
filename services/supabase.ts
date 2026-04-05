
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://sua-url.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sua-chave-anon';

export const isConfigured = supabaseUrl !== 'https://sua-url.supabase.co' && supabaseAnonKey !== 'sua-chave-anon';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getLocal = (key: string) => JSON.parse(localStorage.getItem(`omnivenda_${key}`) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(`omnivenda_${key}`, JSON.stringify(data));

export const db = {
  products: {
    getAll: async () => {
      if (!isConfigured) return getLocal('products');
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    upsert: async (product: any) => {
      if (!isConfigured) {
        const products = getLocal('products');
        const id = product.id || Math.random().toString(36).substr(2, 9);
        const newProduct = { ...product, id };
        const index = products.findIndex((p: any) => p.id === id);
        if (index >= 0) products[index] = newProduct;
        else products.unshift(newProduct);
        setLocal('products', products);
        return newProduct;
      }
      const { data, error } = await supabase.from('products').upsert(product).select();
      if (error) throw error;
      return data[0];
    },
    delete: async (id: string) => {
      if (!isConfigured) {
        const products = getLocal('products').filter((p: any) => p.id !== id);
        setLocal('products', products);
        return;
      }
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    }
  },
  clients: {
    getAll: async () => {
      if (!isConfigured) return getLocal('clients');
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    upsert: async (client: any) => {
      if (!isConfigured) {
        const clients = getLocal('clients');
        const id = client.id || Math.random().toString(36).substr(2, 9);
        const newClient = { ...client, id };
        const index = clients.findIndex((c: any) => c.id === id);
        if (index >= 0) clients[index] = newClient;
        else clients.unshift(newClient);
        setLocal('clients', clients);
        return newClient;
      }
      const { data, error } = await supabase.from('clients').upsert(client).select();
      if (error) throw error;
      return data[0];
    }
  },
  sales: {
    getAll: async () => {
      if (!isConfigured) return getLocal('sales');
      const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (sale: any) => {
      if (!isConfigured) {
        const sales = getLocal('sales');
        const newSale = { ...sale, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
        sales.unshift(newSale);
        setLocal('sales', sales);
        return newSale;
      }
      const { data, error } = await supabase.from('sales').insert(sale).select();
      if (error) throw error;
      return data[0];
    },
    update: async (sale: any) => {
      if (!isConfigured) {
        const sales = getLocal('sales');
        const index = sales.findIndex((s: any) => s.id === sale.id);
        if (index >= 0) {
          sales[index] = { ...sales[index], ...sale };
          setLocal('sales', sales);
        }
        return sales[index];
      }
      const { data, error } = await supabase.from('sales').update(sale).eq('id', sale.id).select();
      if (error) throw error;
      return data[0];
    }
  },
  profile: {
    get: async () => {
      if (!isConfigured) return JSON.parse(localStorage.getItem('omnivenda_profile') || 'null');
      const { data, error } = await supabase.from('profiles').select('*').single();
      if (error) return null;
      return data;
    },
    update: async (profile: any) => {
      if (!isConfigured) {
        localStorage.setItem('omnivenda_profile', JSON.stringify(profile));
        return profile;
      }
      const { data, error } = await supabase.from('profiles').upsert(profile).select();
      if (error) throw error;
      return data[0];
    }
  }
};
