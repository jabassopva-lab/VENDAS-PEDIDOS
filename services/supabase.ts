
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    impersonatedUserId = null;
    return null;
  }
  if (impersonatedUserId) return impersonatedUserId;
  return session.user.id;
};

let cachedPaidColumn: string | null = null;
let cachedProfitColumn: string | null = null;

const getPaidColumn = async () => {
  if (cachedPaidColumn) return cachedPaidColumn;
  try {
    const { data } = await supabase.from('sales').select('*').limit(1);
    if (data && data.length > 0) {
      const keys = Object.keys(data[0]);
      const candidates = ['is_paid', 'isPaid', 'ispaid', 'is_pago', 'pago', 'paid'];
      const found = candidates.find(c => keys.includes(c));
      if (found) {
        cachedPaidColumn = found;
        return found;
      }
    }
  } catch (e) {
    console.warn("Erro ao detectar coluna de pagamento:", e);
  }
  cachedPaidColumn = 'is_paid'; // Fallback padrão
  return 'is_paid';
};

const getProfitColumn = async () => {
  if (cachedProfitColumn) return cachedProfitColumn;
  try {
    const { data } = await supabase.from('sales').select('*').limit(1);
    if (data && data.length > 0) {
      const keys = Object.keys(data[0]);
      const candidates = ['profit', 'lucro', 'total_profit', 'totalProfit'];
      const found = candidates.find(c => keys.includes(c));
      if (found) {
        cachedProfitColumn = found;
        return found;
      }
    }
  } catch (e) {
    console.warn("Erro ao detectar coluna de lucro:", e);
  }
  cachedProfitColumn = 'profit'; // Fallback padrão
  return 'profit';
};

const toBool = (val: any) => {
  if (val === true || val === 'true' || val === 1 || val === '1' || val === 't' || val === 'T' || val === 's' || val === 'S' || val === 'pago') return true;
  if (val === false || val === 'false' || val === 0 || val === '0' || val === 'f' || val === 'F' || val === 'n' || val === 'N' || val === 'pendente') return false;
  return !!val;
};

// Helper para detectar isPaid em objetos retornados pelo Supabase (mapeamento flexível de colunas)
const s_isPaid = (s: any) => {
  if (!s) return null;
  // Ordem de preferência: is_paid, isPaid, ispaid, is_pago, pago, paid
  const possibleKeys = ['is_paid', 'isPaid', 'ispaid', 'is_pago', 'pago', 'paid'];
  for (const key of possibleKeys) {
    if (s[key] !== undefined && s[key] !== null) {
      return toBool(s[key]);
    }
  }
  return null;
};

const s_profit = (s: any) => {
  if (!s) return null;
  const possibleKeys = ['profit', 'lucro', 'total_profit', 'totalProfit'];
  for (const key of possibleKeys) {
    if (s[key] !== undefined && s[key] !== null) {
      return Number(s[key]);
    }
  }
  return null;
};

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
      const userId = await getUserId();
      const { data, error, count } = await supabase
        .from('products')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', userId)
        .select();
        
      if (error) {
        console.error("Erro ao deletar produto:", error);
        throw error;
      }
      console.log("Produto deletado:", { id, count, data });
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
    },
    delete: async (id: string) => {
      if (!shouldUseSupabase()) {
        const clients = getLocal('clients').filter((c: any) => c.id !== id);
        setLocal('clients', clients);
        return;
      }
      const userId = await getUserId();
      
      // Tenta deletar garantindo que pertence ao usuário
      const { data, error, count } = await supabase
        .from('clients')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error("Erro ao deletar cliente no Supabase:", error);
        throw error;
      }
      
      console.log("Resultado da exclusão de cliente:", { id, count, data });
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
        isPaid: s_isPaid(s) ?? false,
        profit: s_profit(s) ?? 0
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
      const paidCol = await getPaidColumn();
      const profitCol = await getProfitColumn();
      
      // Mapeamento COMPLETO
      const payload: any = { 
        user_id: userId,
        client_id: sale.clientId || null,
        client_name: sale.clientName || 'Venda Avulsa',
        total: Number(sale.total) || 0,
        items: Array.isArray(sale.items) ? sale.items : [],
        date: sale.date || new Date().toLocaleDateString('pt-BR'),
        time: sale.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        payment_method: sale.paymentMethod || 'Dinheiro',
        payment_terms: sale.paymentTerms || 'À vista',
        status: sale.status || 'FINALIZADA',
        delivery_status: sale.deliveryStatus || 'ENTREGUE'
      };

      payload[paidCol] = toBool(sale.isPaid);
      payload[profitCol] = Number(sale.profit) || 0;

      console.log("Supabase Create - Payload:", payload);
      try {
        // Tenta insert com select completo primeiro
        let { data, error } = await supabase.from('sales').insert(payload).select().single();
        
        if (error) {
          console.error("Erro no Supabase Insert Inicial:", error);
          
          // Se o erro for de coluna inexistente, tenta com select reduzido
          if (error.message?.includes('column') || error.code === 'PGRST204') {
             console.warn("Tentando insert com select seguro (id)...");
             const { data: sData, error: sError } = await supabase.from('sales').insert(payload).select('id').single();
             if (!sError) {
                data = sData;
                error = null;
             }
          }
          
          // Se ainda tiver erro, tenta o fallback manual já existente
          if (error) {
            console.warn("Iniciando fallback minimal para criação...");
            const minimalPayload: any = {
              user_id: userId,
              client_id: payload.client_id,
              client_name: payload.client_name,
              total: payload.total,
              items: payload.items,
              date: payload.date,
              time: payload.time,
              status: payload.status,
              payment_method: payload.payment_method,
              payment_terms: payload.payment_terms
            };
            
            if (sale.isPaid !== undefined) {
               try { minimalPayload[paidCol] = toBool(sale.isPaid); } catch(e) {}
            }
            try { minimalPayload[profitCol] = payload[profitCol]; } catch(e) {}
            
            const { data: fData, error: fError } = await supabase.from('sales').insert(minimalPayload).select('id').single();
            if (fError) {
              console.error("Erro no fallback do create:", fError);
              const toRemove = ['delivery_status', 'payment_method', 'payment_terms', paidCol];
              toRemove.forEach(k => delete minimalPayload[k]);
              const { data: fData2, error: fError2 } = await supabase.from('sales').insert(minimalPayload).select('id').single();
              if (fError2) throw fError2;
              return { ...sale, id: fData2.id, isPaid: !!sale.isPaid };
            }
            return { ...sale, id: fData.id, isPaid: !!sale.isPaid };
          }
        }

        const saved = data;
        return {
          ...sale,
          id: saved.id,
          isPaid: s_isPaid(saved) ?? !!sale.isPaid
        };
      } catch (err) {
        console.error("Falha fatal no salvamento da venda:", err);
        throw err;
      }
    },
    update: async (sale: any) => {
      if (!shouldUseSupabase()) {
        const sales = getLocal('sales');
        const index = sales.findIndex((s: any) => String(s.id) === String(sale.id));
        if (index >= 0) {
          sales[index] = { ...sales[index], ...sale };
          setLocal('sales', sales);
        }
        return sales[index];
      }
      
      const userId = await getUserId();
      const paidCol = await getPaidColumn();
      const profitCol = await getProfitColumn();

      const payload: any = { 
        user_id: userId,
        client_id: sale.clientId || null,
        client_name: sale.clientName || 'Venda Avulsa',
        total: Number(sale.total) || 0,
        items: Array.isArray(sale.items) ? sale.items : [],
        payment_method: sale.paymentMethod || 'Dinheiro',
        payment_terms: sale.paymentTerms || 'À vista',
        status: sale.status || 'FINALIZADA',
        delivery_status: sale.deliveryStatus || 'ENTREGUE'
      };
      
      payload[paidCol] = toBool(sale.isPaid);
      payload[profitCol] = Number(sale.profit) || 0;

      console.log("Supabase Update - Payload:", payload);
      try {
        let { data, error } = await supabase.from('sales').update(payload).eq('id', sale.id).select().single();
        
        if (error) {
          console.error("Erro no Supabase Update Inicial:", error);
          
          if (error.message?.includes('column') || error.code === 'PGRST204') {
             console.warn("Tentando update com select seguro (id)...");
             const { data: sData, error: sError } = await supabase.from('sales').update(payload).eq('id', sale.id).select('id').single();
             if (!sError) {
                data = sData;
                error = null;
             }
          }

          if (error) {
            console.warn("Iniciando update minimal (fallback)...");
            const minimalUpdate: any = { 
              total: Number(sale.total) || 0, 
              items: Array.isArray(sale.items) ? sale.items : [],
              client_id: sale.clientId || null,
              client_name: sale.clientName || 'Venda Avulsa',
              status: sale.status || 'FINALIZADA',
              payment_method: sale.paymentMethod || 'Dinheiro',
              payment_terms: sale.paymentTerms || 'À vista',
              date: sale.date,
              time: sale.time
            };

            if (sale.isPaid !== undefined) {
              try { minimalUpdate[paidCol] = toBool(sale.isPaid); } catch(e) {}
            }
            try { minimalUpdate[profitCol] = Number(sale.profit) || 0; } catch(e) {}

            const { data: fData, error: fError } = await supabase.from('sales').update(minimalUpdate).eq('id', sale.id).select('id').single();
            if (fError) {
               console.error("Erro no fallback do update:", fError);
               const keysToRemove = ['delivery_status', 'payment_method', 'payment_terms', paidCol];
               keysToRemove.forEach(k => delete minimalUpdate[k]);
               const { data: fData2, error: fError2 } = await supabase.from('sales').update(minimalUpdate).eq('id', sale.id).select('id').single();
               if (fError2) throw fError2;
               return { ...sale, id: fData2.id };
            }
            return { ...sale, id: fData.id };
          }
        }
        
        const saved = data;
        return { 
          ...sale, 
          ...saved,
          isPaid: s_isPaid(saved) ?? sale.isPaid
        };
      } catch (err) {
        console.error("Erro fatal no update da venda:", err);
        throw err;
      }
    },
    delete: async (id: string | number) => {
      if (!shouldUseSupabase()) {
        const sales = getLocal('sales').filter((s: any) => String(s.id) !== String(id));
        setLocal('sales', sales);
        return;
      }
      
      const userId = await getUserId();
      if (!userId) {
        throw new Error("Sessão não identificada. Por favor, faça login novamente.");
      }

      console.log("Supabase Delete - Executando para ID:", id, "Usuário:", userId);

      // Usamos .select('id') para garantir que temos feedback do que foi deletado sem dar erro em colunas inexistentes
      const { data, error, count } = await supabase
        .from('sales')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', userId)
        .select('id');

      if (error) {
        console.error("Erro Supabase ao deletar venda:", error);
        throw error;
      }

      const rowsAffected = count !== null ? count : (data ? data.length : 0);
      console.log("Supabase Delete - Linhas afetadas (Fase 1):", rowsAffected);

      if (rowsAffected === 0) {
        console.warn("Nenhuma linha afetada com user_id. Tentando exclusão apenas por ID (fallback)...");
        
        // Se falhou com user_id, tentamos apenas por ID (respeitando o RLS do banco)
        const { data: data2, error: error2, count: count2 } = await supabase
          .from('sales')
          .delete({ count: 'exact' })
          .eq('id', id)
          .select('id');

        if (error2) {
          console.error("Erro Supabase no fallback de exclusão:", error2);
          throw error2;
        }

        const rowsAffected2 = count2 !== null ? count2 : (data2 ? data2.length : 0);
        console.log("Supabase Delete - Linhas afetadas (Fase 2):", rowsAffected2);

        if (rowsAffected2 === 0) {
          // Se ainda assim não deletou nada, tentamos conversão numérica se aplicável
          const numericId = !isNaN(Number(id)) ? Number(id) : null;
          if (numericId !== null && String(numericId) === String(id)) {
             console.warn("Tentando exclusão com ID convertido para número:", numericId);
             const { data: data3, count: count3 } = await supabase
               .from('sales')
               .delete({ count: 'exact' })
               .eq('id', numericId)
               .select('id');
             
             if (count3 && count3 > 0) {
               console.log("Venda excluída com ID numérico.");
               return;
             }
          }
          
          throw new Error("Não foi possível excluir o registro. Verifique se ele ainda existe ou se você tem permissão.");
        }
      }
      
      console.log("Venda excluída com sucesso!");
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

