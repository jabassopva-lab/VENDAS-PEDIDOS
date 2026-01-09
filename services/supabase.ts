
// Serviço Supabase desativado por solicitação do usuário.
// O aplicativo agora utiliza localStorage para persistência.

export const isConfigured = false;
export const supabase = null;
export const db = {
  products: { getAll: async () => [], upsert: async (p: any) => p },
  clients: { getAll: async () => [], upsert: async (c: any) => c },
  sales: { getAll: async () => [], create: async (s: any) => s }
};
