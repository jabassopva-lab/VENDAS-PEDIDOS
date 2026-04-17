
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

const isTestMode = () => localStorage.getItem('omnivenda_test_session') === 'active';

const shouldUseSupabase = () => {
  return isConfigured && !isTestMode();
};

let impersonatedUserId: string | null = null;

export const setImpersonatedUserId = (id: string | null) => {
  impersonatedUserId = id;
};

const getUserId = async () => {
  if (impersonatedUserId) return impersonatedUserId;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
};

const toBool = (val: any) => val === true || val === 'true';

export const db = {
  products: {
    getAll: async () => {
      if (!shouldUseSupabase()) return getLocal('products');
      const userId = await getUserId();
      const { data, error } = await supabase.from('products').select('*').eq('user_id', userId).order('name');
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        wholesalePrice: p.wholesale_price ?? p.wholesalePrice,
        costPrice: p.cost_price ?? p.costPrice,
        imageUrl: p.image_url ?? p.imageUrl
      }));
    },
    upsert: async (product: any) => {
      if (!shouldUseSupabase()) {
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
      
      // Payload estritamente controlado para evitar erros de coluna inexistente
      const payload: any = {
        name: product.name,
        category: product.category,
        price: product.price,
        wholesale_price: product.wholesalePrice ?? product.wholesale_price,
        cost_price: product.costPrice ?? product.cost_price,
        stock: product.stock,
        min_stock: product.minStock ?? product.min_stock,
        unit: product.unit,
        image_url: product.imageUrl ?? product.image_url,
        user_id: userId
      };

      if (product.id) payload.id = product.id;
      
      const { data, error } = await supabase.from('products').upsert(payload).select();
      if (error) {
        console.error("Erro no upsert de produto:", error);
        // Fallback básico se snake falhar
        const fallbackPayload: any = { 
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          user_id: userId
        };
        const { data: fData, error: fError } = await supabase.from('products').upsert(fallbackPayload).select();
        if (fError) throw fError;
        return fData[0];
      }
      
      const saved = data[0];
      return {
        ...saved,
        wholesalePrice: saved.wholesale_price ?? saved.wholesalePrice,
        costPrice: saved.cost_price ?? saved.costPrice,
        imageUrl: saved.image_url ?? saved.imageUrl
      };
    },
    delete: async (id: string) => {
      if (!shouldUseSupabase()) {
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
      if (!shouldUseSupabase()) return getLocal('clients');
      const userId = await getUserId();
      const { data, error } = await supabase.from('clients').select('*').eq('user_id', userId).order('name');
      if (error) throw error;
      return data || [];
    },
    upsert: async (client: any) => {
      if (!shouldUseSupabase()) {
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
      if (!shouldUseSupabase()) return getLocal('sales');
      const userId = await getUserId();
      const { data, error } = await supabase.from('sales').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((s: any) => ({
        ...s,
        clientId: s.client_id ?? s.clientId,
        clientName: s.client_name ?? s.clientName,
        paymentMethod: s.payment_method ?? s.paymentMethod,
        paymentTerms: s.payment_terms ?? s.paymentTerms,
        deliveryStatus: s.delivery_status ?? s.deliveryStatus,
        isPaid: toBool(s.is_paid) || toBool(s.isPaid) || toBool(s.ispaid)
      }));
    },
    create: async (sale: any) => {
      if (!shouldUseSupabase()) {
        const sales = getLocal('sales');
        const newSale = { ...sale, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
        sales.unshift(newSale);
        setLocal('sales', sales);
        return newSale;
      }
      
      const userId = await getUserId();
      // Mapeamento SUPER LIMPO: Apenas snake_case e apenas o que é essencial.
      // Removendo TUDO que possa ser opcional ou novo (camelCase, delivery_status, defines, etc)
      const payload: any = { 
        user_id: userId,
        client_id: sale.clientId,
        client_name: sale.clientName,
        total: sale.total,
        profit: sale.profit,
        items: sale.items,
        date: sale.date,
        time: sale.time,
        payment_method: sale.paymentMethod,
        payment_terms: sale.paymentTerms,
        status: sale.status || 'FINALIZADA',
        is_paid: sale.isPaid,
        delivery_status: sale.deliveryStatus
      };

      console.log("Supabase Create - Payload Final:", payload);
      
      // Incluímos is_paid e delivery_status no select para garantir que retornem mapeados
      const { data, error } = await supabase.from('sales').insert(payload).select().single();
      
      if (error) {
        console.error("Erro Crítico no Supabase Insert:", error);
        
        // Fallback Ultra-Estável: Apenas o que GARANTIDAMENTE existe
        if (error.code === 'PGRST204' || error.message?.includes('column')) {
          console.warn("Tentando salvamento de emergência...");
          const minimalPayload = {
            user_id: userId,
            client_id: sale.clientId,
            client_name: sale.clientName,
            total: sale.total,
            items: sale.items
          };
          const { data: fData, error: fError } = await supabase.from('sales').insert(minimalPayload).select('id').single();
          if (fError) throw fError;
          return { ...sale, id: fData.id };
        }
        throw error;
      }

      const saved = data;
      return {
        ...sale,
        id: saved.id,
        clientId: saved.client_id ?? sale.clientId,
        clientName: saved.client_name ?? sale.clientName,
        isPaid: toBool(saved.is_paid) || toBool((saved as any).isPaid) || toBool((saved as any).ispaid),
        deliveryStatus: saved.delivery_status ?? sale.deliveryStatus
      };
    },
    update: async (sale: any) => {
      if (!shouldUseSupabase()) {
        const sales = getLocal('sales');
        const index = sales.findIndex((s: any) => s.id === sale.id);
        if (index >= 0) {
          sales[index] = { ...sales[index], ...sale };
          setLocal('sales', sales);
        }
        return sales[index];
      }
      
      const userId = await getUserId();
      const payload: any = { 
        user_id: userId,
        client_id: sale.clientId,
        client_name: sale.clientName,
        total: sale.total,
        profit: sale.profit,
        items: sale.items,
        payment_method: sale.paymentMethod,
        payment_terms: sale.paymentTerms,
        status: sale.status,
        is_paid: sale.isPaid,
        delivery_status: sale.deliveryStatus
      };
      
      const { data, error } = await supabase.from('sales').update(payload).eq('id', sale.id).select().single();
      
      if (error) {
        console.error("Erro no Supabase Update:", error);
        if (error.code === 'PGRST204' || error.message?.includes('column')) {
          const minimalUpdate = { total: sale.total, items: sale.items };
          const { error: fError } = await supabase.from('sales').update(minimalUpdate).eq('id', sale.id);
          if (fError) throw fError;
          return sale;
        }
        throw error;
      }
      
      const saved = data;
      return { 
        ...sale, 
        ...saved,
        isPaid: toBool(saved.is_paid) || toBool((saved as any).isPaid) || toBool((saved as any).ispaid)
      };
    },
    delete: async (id: string) => {
      if (!shouldUseSupabase()) {
        const sales = getLocal('sales').filter((s: any) => s.id !== id);
        setLocal('sales', sales);
        return;
      }
      // Tenta deletar do Supabase
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
    }
  },
  profile: {
    get: async () => {
      if (!shouldUseSupabase()) return JSON.parse(localStorage.getItem('omnivenda_profile') || 'null');
      const userId = await getUserId();
      if (!userId) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
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
        pixKey: data.pix_key || data.pixKey,
        role: data.role || 'USER',
        businessType: data.business_type || 'GERAL'
      };
    },
    update: async (profile: any) => {
      if (!shouldUseSupabase()) {
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
        pix_key: profile.pixKey,
        role: profile.role || 'USER',
        business_type: profile.businessType || 'GERAL'
      };
      
      console.log("Salvando perfil no Supabase:", payload);
      // Usamos onConflict para garantir que o banco saiba qual coluna usar para decidir entre Insert ou Update
      const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' }).select();
      
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
        planType: saved.plan_type,
        nextBilling: saved.next_billing,
        pixKey: saved.pix_key,
        role: saved.role,
        businessType: saved.business_type
      };
    },
    uploadLogo: async (file: File) => {
      if (!shouldUseSupabase()) return null;
      const userId = await getUserId();
      if (!userId) throw new Error("Usuário não autenticado.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('omnivenda-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('omnivenda-assets')
        .getPublicUrl(filePath);

      return data.publicUrl;
    }
  },
  admin: {
    getAllBusinesses: async () => {
      if (!shouldUseSupabase()) return [];
      const { data, error } = await supabase.from('profiles').select('*').order('company_name');
      if (error) {
        console.error("Erro ao buscar empresas:", error);
        return [];
      }
      return (data || []).map((d: any) => ({
        ...d,
        companyName: d.company_name,
        logoUrl: d.logo_url,
        planStatus: d.plan_status,
        planType: d.plan_type,
        role: d.role
      }));
    },
    getBusinessStats: async () => {
      if (!shouldUseSupabase()) return [];
      
      // Busca todos os perfis cadastrados no sistema
      const { data: profiles, error: pError } = await supabase.from('profiles').select('*').order('company_name');
      if (pError) {
        console.error("ERRO AO BUSCAR EMPRESAS (RLS?):", pError);
        return [];
      }

      if (!profiles || profiles.length === 0) return [];

      const stats = profiles.map((p: any) => {
        return {
          id: p.user_id,
          companyName: p.company_name,
          email: p.email,
          planStatus: p.plan_status || 'ATIVO',
          planType: p.plan_type || 'START',
          nextBilling: p.next_billing || '2026-05-15',
          role: p.role
        };
      });

      return stats;
    },
    deleteBusiness: async (userId: string) => {
      // Deleta o perfil (o usuário do Auth precisa ser deletado manualmente no console do Supabase por segurança ou via Edge Function)
      const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
      if (error) throw error;
      return true;
    }
  }
};

