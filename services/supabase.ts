
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://sua-url.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sua-chave-anon';

export const isConfigured = supabaseUrl !== 'https://sua-url.supabase.co' && 
                          supabaseAnonKey !== 'sua-chave-anon' && 
                          supabaseUrl.startsWith('https://');

console.log("Supabase Configuration:", { 
  url: supabaseUrl, 
  configured: isConfigured,
  hasKey: !!supabaseAnonKey && supabaseAnonKey !== 'sua-chave-anon'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection on load
if (isConfigured) {
  supabase.from('clients').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) console.error("Erro na conexão inicial com Supabase:", error);
      else console.log("Conexão com Supabase OK. Total de clientes no banco:", count);
    });
}

const getLocal = (key: string) => JSON.parse(localStorage.getItem(`omnivenda_${key}`) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(`omnivenda_${key}`, JSON.stringify(data));

const getUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
};

export const db = {
  products: {
    getAll: async () => {
      if (!isConfigured) return getLocal('products');
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        wholesalePrice: p.wholesale_price
      }));
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
      
      const userId = await getUserId();
      const payload = { 
        ...product, 
        user_id: userId,
        wholesale_price: product.wholesalePrice 
      };
      delete payload.wholesalePrice;
      
      const { data, error } = await supabase.from('products').upsert(payload).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Erro ao salvar produto. Verifique as permissões do RLS.");
      
      const saved = data[0];
      return {
        ...saved,
        wholesalePrice: saved.wholesale_price
      };
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
      
      const userId = await getUserId();
      const payload = { ...client, user_id: userId };
      
      const { data, error } = await supabase.from('clients').upsert(payload).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Erro ao salvar cliente. Verifique as permissões do RLS.");
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
      
      const userId = await getUserId();
      const payload = { ...sale, user_id: userId };
      
      const { data, error } = await supabase.from('sales').insert(payload).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Erro ao registrar venda. Verifique as permissões do RLS.");
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
      
      const userId = await getUserId();
      const payload = { ...sale, user_id: userId };
      
      const { data, error } = await supabase.from('sales').update(payload).eq('id', sale.id).select();
      if (error) throw error;
      return data[0];
    },
    delete: async (id: string) => {
      if (!isConfigured) {
        const sales = getLocal('sales').filter((s: any) => s.id !== id);
        setLocal('sales', sales);
        return;
      }
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
    }
  },
  profile: {
    get: async () => {
      if (!isConfigured) return JSON.parse(localStorage.getItem('omnivenda_profile') || 'null');
      const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
      if (error) {
        console.error("Erro ao buscar perfil:", error);
        return null;
      }
      if (!data) return null;
      
      // Mapeia de snake_case para camelCase
      return {
        ...data,
        companyName: data.company_name || data.companyName,
        logoUrl: data.logo_url || data.logoUrl,
        planStatus: data.plan_status || data.planStatus,
        nextBilling: data.next_billing || data.nextBilling,
        pixKey: data.pix_key || data.pixKey
      };
    },
    update: async (profile: any) => {
      if (!isConfigured) {
        localStorage.setItem('omnivenda_profile', JSON.stringify(profile));
        return profile;
      }
      
      const userId = await getUserId();
      if (!userId) throw new Error("Usuário não autenticado.");

      // Mapeamento para snake_case (padrão Postgres)
      const payload = { 
        id: userId,
        user_id: userId,
        company_name: profile.companyName,
        document: profile.document,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        logo_url: profile.logoUrl,
        plan_status: profile.planStatus || 'START',
        next_billing: profile.nextBilling,
        pix_key: profile.pixKey
      };
      
      console.log("Salvando perfil no Supabase:", payload);
      const { data, error } = await supabase.from('profiles').upsert(payload).select();
      
      if (error) {
        console.error("Erro detalhado Supabase (profile):", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error("O banco de dados não retornou dados. Verifique o RLS.");
      }
      
      // Mapeia de volta para camelCase
      const saved = data[0];
      return {
        ...saved,
        companyName: saved.company_name,
        logoUrl: saved.logo_url,
        planStatus: saved.plan_status,
        nextBilling: saved.next_billing,
        pixKey: saved.pix_key
      };
    }
  }
};
