
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Package, 
  Plus, 
  Search,
  ArrowLeft,
  Loader2,
  TrendingUp,
  ClipboardList,
  Calendar,
  Clock,
  ShoppingBag,
  Settings as SettingsIcon,
  Filter,
  ChevronRight,
  Eye,
  Sparkles,
  ArrowUpRight,
  Wallet,
  Sun,
  Palmtree,
  CheckCircle2,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Database,
  BarChart3,
  ChevronLeft,
  FileText,
  ArrowRight,
  LogOut,
  Store,
  Info,
  Printer,
  RefreshCw,
  Trash2,
  Bell,
  ExternalLink,
  Ban,
  Smartphone,
  Mail,
  MoreVertical,
  ShieldAlert,
  DatabaseZap,
  Cloud,
  Lock,
  EyeOff,
  UserPlus,
  LogIn,
  X
} from 'lucide-react';
import ProductModal from './components/ProductModal.tsx';
import ClientForm from './components/ClientForm.tsx';
import NewSaleModal from './components/NewSaleModal.tsx';
import SaleDetailModal from './components/SaleDetailModal.tsx';
import SettingsForm from './components/SettingsForm.tsx';
import CostCorrectionTool from './components/CostCorrectionTool.tsx';
import AuthScreen from './components/AuthScreen.tsx';
import { supabase, db, isConfigured, setImpersonatedUserId } from './services/supabase.ts';
import { Product, Client, ModalType, Screen, Sale, BusinessProfile, SalesData } from './types.ts';

const DEFAULT_PROFILE: BusinessProfile = {
  companyName: 'Minha Empresa',
  document: '',
  phone: '',
  email: '',
  address: '',
  logoUrl: '',
  planStatus: 'START',
  nextBilling: '-'
};

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const convertDriveLink = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('drive.google.com')) {
    const matches = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (matches && matches[1]) {
      const fileId = matches[1];
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  }
  return url;
};

const EmptyState = ({ message, icon: Icon = Store }: { message: string, icon?: any }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in zoom-in duration-500">
    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-200 mb-4">
      <Icon size={40} />
    </div>
    <h3 className="text-lg font-black text-amber-900/40 uppercase tracking-widest leading-tight">{message}</h3>
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');
  const [saveNotify, setSaveNotify] = useState<{show: boolean, msg: string}>({show: false, msg: ''});
  const [loading, setLoading] = useState(true);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(DEFAULT_PROFILE);
  
  const [reportTab, setReportTab] = useState<'DIARIO' | 'MENSAL' | 'ANUAL'>('MENSAL');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [productModal, setProductModal] = useState<{ type: ModalType; data?: Product }>({ type: ModalType.NONE });
  const [clientModal, setClientModal] = useState<{ type: ModalType; data?: Client }>({ type: ModalType.NONE });
  const [saleModal, setSaleModal] = useState<boolean>(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [filterClientId, setFilterClientId] = useState<string>('ALL');
  const [filterProductId, setFilterProductId] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [allBusinessesStats, setAllBusinessesStats] = useState<any[]>([]);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [subscriptionModal, setSubscriptionModal] = useState<{ isOpen: boolean, business: any | null }>({ isOpen: false, business: null });

  const handleExitImpersonation = () => {
    setImpersonatedUserId(null);
    setIsImpersonating(false);
    setCurrentScreen('DEVELOPER_PANEL');
    fetchAllData();
    triggerNotify('Voltando ao Painel Admin');
  };

  const isDeveloper = useMemo(() => {
    const email = session?.user?.email?.toLowerCase();
    const companyName = businessProfile.companyName?.toUpperCase();
    const isDevEmail = email === 'jabasso.pva@gmail.com' || email === 'omnvenda_adm@omnivenda.com';
    const isDevCompany = companyName === 'OMNVENDA_ADM';
    return isDevEmail || isDevCompany || businessProfile.role === 'DEVELOPER';
  }, [session, businessProfile]);

  const isPureAdmin = useMemo(() => {
    return session?.user?.email?.toLowerCase() === 'omnvenda_adm@omnivenda.com';
  }, [session]);

  const isProfileIncomplete = useMemo(() => {
    if (isPureAdmin || isImpersonating) return false;
    return !businessProfile.companyName || 
           businessProfile.companyName === 'MINHA EMPRESA' || 
           !businessProfile.phone || 
           businessProfile.phone.trim() === '';
  }, [businessProfile, isPureAdmin, isImpersonating]);

  useEffect(() => {
    if (isProfileIncomplete && session && !loading && currentScreen !== 'SETTINGS') {
      setCurrentScreen('SETTINGS');
      triggerNotify('Complete seu cadastro para continuar');
    }
  }, [isProfileIncomplete, session, loading, currentScreen]);

  useEffect(() => {
    if (isPureAdmin && currentScreen !== 'DEVELOPER_PANEL') {
      setCurrentScreen('DEVELOPER_PANEL');
    }
  }, [isPureAdmin, currentScreen]);

  useEffect(() => {
    if (currentScreen === 'DEVELOPER_PANEL' && isDeveloper) {
      db.admin.getBusinessStats().then(setAllBusinessesStats);
    }
  }, [currentScreen, isDeveloper]);

  useEffect(() => {
    const savedTest = localStorage.getItem('omnivenda_test_session');
    if (savedTest) {
      setSession({ user: { email: 'demo@omnivenda.com' } });
      setIsTestMode(true);
      fetchAllData();
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [p, c, s, prof] = await Promise.all([
        db.products.getAll(),
        db.clients.getAll(),
        db.sales.getAll(),
        db.profile.get()
      ]);
      setProducts(p || []);
      setClients(c || []);
      setSalesHistory(s || []);
      
      if (prof) {
        setBusinessProfile(prof);
      } else if (session?.user) {
        const email = session.user.email || '';
        const emailPrefix = email.split('@')[0].toUpperCase().replace(/[._]/g, ' ');
        const detectedName = session.user.user_metadata?.company_name || session.user.user_metadata?.username || emailPrefix || 'MINHA EMPRESA';
        const initialProfile = {
          ...DEFAULT_PROFILE,
          companyName: detectedName,
          email: email,
          role: (email === 'omnvenda_adm@omnivenda.com' || email === 'jabasso.pva@gmail.com') ? 'DEVELOPER' : 'USER'
        };
        setBusinessProfile(initialProfile);
        db.profile.update(initialProfile).then((saved) => {
          if (saved) setBusinessProfile(saved);
        });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (isTest?: boolean, testName?: string) => {
    if (isTest) {
      setIsTestMode(true);
      setSession({ user: { email: 'demo@omnivenda.com', user_metadata: { company_name: testName } } });
      localStorage.setItem('omnivenda_test_session', 'active');
      fetchAllData();
    } else {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setSession(currentSession);
        setTimeout(() => fetchAllData(), 500);
      }
    }
  };

  const triggerNotify = (msg: string = 'Dados Salvos!') => {
    setSaveNotify({show: true, msg});
    setTimeout(() => setSaveNotify({show: false, msg: ''}), 2000);
  };

  const handleSaveProduct = async (data: Omit<Product, 'id'>) => {
    try {
      const isEdit = productModal.type === ModalType.EDIT && !!productModal.data;
      const editId = productModal.data?.id;
      const payload = isEdit ? { ...data, id: editId } : { ...data };
      const saved = await db.products.upsert(payload);
      setProducts(prev => isEdit ? prev.map(p => p.id === editId ? (saved as Product) : p) : [saved as Product, ...prev]);
      setProductModal({ type: ModalType.NONE });
      triggerNotify('Produto Salvo!');
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar produto.");
    }
  };

  const handleSaveClient = async (data: Omit<Client, 'id'>) => {
    try {
      const isEdit = clientModal.type === ModalType.EDIT && !!clientModal.data;
      const editId = clientModal.data?.id;
      const payload = isEdit ? { ...data, id: editId } : { ...data };
      const saved = await db.clients.upsert(payload);
      setClients(prev => isEdit ? prev.map(c => c.id === editId ? (saved as Client) : c) : [saved as Client, ...prev]);
      setClientModal({ type: ModalType.NONE });
      triggerNotify('Cliente Salvo!');
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar cliente.");
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const recalculateRetroactiveProfits = async () => {
    if (!confirm("Isso irá recalcular o lucro de TODAS as vendas baseando-se nos custos ATUAIS dos produtos. Deseja continuar?")) return;
    setIsSyncing(true);
    try {
      const allSales = await db.sales.getAll();
      const allProducts = await db.products.getAll();
      let updatedCount = 0;
      for (const sale of allSales) {
        let newProfit = 0;
        const newItems = sale.items.map((item: any) => {
          const product = allProducts.find((p: any) => p.id === item.id);
          if (product) {
            const currentCost = product.cost_price || product.costPrice || 0;
            newProfit += (item.price - currentCost) * item.quantity;
            return { ...item, costPrice: currentCost };
          }
          newProfit += (item.profit || 0);
          return item;
        });
        await db.sales.update({ ...sale, items: newItems, profit: newProfit });
        updatedCount++;
      }
      const refreshedSales = await db.sales.getAll();
      setSalesHistory(refreshedSales);
      triggerNotify(`${updatedCount} vendas atualizadas!`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFinishSale = async (data: Partial<Sale>) => {
    try {
      const isUpdate = !!data.id;
      const client = clients.find(c => c.id === data.clientId);
      const cleanItems = (data.items || []).map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        costPrice: Number(item.costPrice) || 0,
        quantity: Number(item.quantity) || 0,
        discount: Number(item.discount) || 0
      }));

      const todayBR = new Date().toLocaleDateString('pt-BR');
      const salePayload = {
        ...data,
        clientName: client?.name || 'Venda Avulsa',
        items: cleanItems as any,
        date: isUpdate ? (salesHistory.find(s => s.id === data.id)?.date || todayBR) : todayBR,
        time: isUpdate ? (salesHistory.find(s => s.id === data.id)?.time || "00:00") : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      let savedSale;
      if (isUpdate) savedSale = await db.sales.update(salePayload);
      else savedSale = await db.sales.create(salePayload);
      
      setSalesHistory(prev => isUpdate ? prev.map(s => s.id === savedSale.id ? savedSale : s) : [savedSale, ...prev]);
      
      // Update stock if finished
      if (savedSale.status === 'FINALIZADA') {
        const oldItems = isUpdate ? (salesHistory.find(s => s.id === data.id)?.items || []) : [];
        const newItems = data.items || [];
        const allProductIds = Array.from(new Set([...oldItems.map(i => i.id), ...newItems.map(i => i.id)]));
        const productUpdates = [...products];
        for (let i = 0; i < productUpdates.length; i++) {
          const p = productUpdates[i];
          if (allProductIds.includes(p.id)) {
            const oldQty = oldItems.find(item => item.id === p.id)?.quantity || 0;
            const newQty = newItems.find(item => item.id === p.id)?.quantity || 0;
            const delta = newQty - oldQty;
            if (delta !== 0) {
              const newStock = Math.max(0, p.stock - delta);
              const updatedProduct = { ...p, stock: newStock };
              await db.products.upsert(updatedProduct);
              productUpdates[i] = updatedProduct;
            }
          }
        }
        setProducts(productUpdates);
      }
      
      setSaleModal(false);
      setEditingSale(null);
      triggerNotify('Venda Salva!');
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar venda.");
    }
  };

  const handleOpenEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSelectedSale(null);
    setSaleModal(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) return;
    
    try {
      const saleToDelete = salesHistory.find(s => s.id === saleId);
      if (!saleToDelete) return;
      
      // Tenta restaurar o estoque se a venda estiver finalizada
      try {
        if (saleToDelete.status === 'FINALIZADA') {
          const productUpdates = [...products];
          for (let i = 0; i < productUpdates.length; i++) {
            const p = productUpdates[i];
            const item = (saleToDelete.items || []).find(it => it.id === p.id);
            if (item) {
              const newStock = Number(p.stock || 0) + Number(item.quantity || 0);
              const updatedProduct = { ...p, stock: newStock };
              await db.products.upsert(updatedProduct);
              productUpdates[i] = updatedProduct;
            }
          }
          setProducts(productUpdates);
        }
      } catch (stockError) {
        console.warn("Erro ao restaurar estoque durante exclusão:", stockError);
        // Prosseguimos com a exclusão da venda mesmo se a restauração de estoque falhar
      }

      await db.sales.delete(saleId);
      setSalesHistory(prev => prev.filter(s => s.id !== saleId));
      setSelectedSale(null);
      triggerNotify('Venda Excluída!');
    } catch (e: any) {
      console.error("Erro ao excluir venda:", e);
      alert(`Erro ao excluir venda: ${e.message || 'Verifique sua conexão.'}`);
    }
  };

  const handleImpersonate = (userId: string) => {
    setImpersonatedUserId(userId);
    setIsImpersonating(true);
    fetchAllData();
    setCurrentScreen('HOME');
  };

  const handleLogout = async () => {
    if (isImpersonating) {
      setImpersonatedUserId(null);
      setIsImpersonating(false);
      fetchAllData();
      setCurrentScreen('DEVELOPER_PANEL');
      return;
    }
    if (isTestMode) {
      localStorage.removeItem('omnivenda_test_session');
      setIsTestMode(false);
    } else {
      await supabase.auth.signOut();
    }
    setSession(null);
    setCurrentScreen('HOME');
  };

  const currentSummary = useMemo(() => {
    const d = currentDate;
    const dayStr = d.toLocaleDateString('pt-BR');
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
    const yearStr = d.getFullYear().toString();
    const filtered = salesHistory.filter(s => {
      if (!s.date) return false;
      if (reportTab === 'DIARIO') return s.date === dayStr;
      if (reportTab === 'MENSAL') return s.date.endsWith(monthStr);
      if (reportTab === 'ANUAL') return s.date.endsWith(yearStr);
      return false;
    });
    const stats = { vendasCount: 0, vendasTotal: 0, lucro: 0, recebidoCount: 0, recebidoTotal: 0, aReceberCount: 0, aReceberTotal: 0, orcamentosCount: 0, orcamentosTotal: 0, entregaCount: 0, entregaTotal: 0 };
    filtered.forEach(s => {
      if (s.status === 'FINALIZADA') {
        stats.vendasCount++; stats.vendasTotal += Number(s.total); stats.lucro += Number(s.profit || 0);
        if (s.isPaid) { stats.recebidoCount++; stats.recebidoTotal += Number(s.total); }
        else { stats.aReceberCount++; stats.aReceberTotal += Number(s.total); }
        if (s.deliveryStatus === 'PENDENTE') { stats.entregaCount++; stats.entregaTotal += Number(s.total); }
      } else { stats.orcamentosCount++; stats.orcamentosTotal += Number(s.total); }
    });
    return stats;
  }, [salesHistory, reportTab, currentDate]);

  const clientRanking = useMemo(() => {
    const d = currentDate;
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
    const filtered = salesHistory.filter(s => s.status === 'FINALIZADA' && s.date && s.date.endsWith(monthStr));
    const clientsMap: Record<string, any> = {};
    filtered.forEach(sale => {
      if (!clientsMap[sale.clientId]) clientsMap[sale.clientId] = { name: sale.clientName, salesCount: 0, totalSold: 0, totalProfit: 0, cocadaPotes: 0, cocadaPotesPaid: 0, cocadaPotesToReceive: 0, cocadaPotesOverdue: 0, totalPendingAmount: 0, totalOverdueAmount: 0 };
      clientsMap[sale.clientId].salesCount++;
      clientsMap[sale.clientId].totalSold += Number(sale.total);
      clientsMap[sale.clientId].totalProfit += Number(sale.profit || 0);
      if (!sale.isPaid) clientsMap[sale.clientId].totalPendingAmount += Number(sale.total);
    });
    return Object.values(clientsMap).sort((a, b) => b.totalSold - a.totalSold);
  }, [salesHistory, currentDate, reportTab]);

  const productRanking = useMemo(() => {
    const d = currentDate;
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
    const filtered = salesHistory.filter(s => s.status === 'FINALIZADA' && s.date && s.date.endsWith(monthStr));
    const productsMap: Record<string, any> = {};
    filtered.forEach(sale => {
      sale.items.forEach(item => {
        if (!productsMap[item.id]) productsMap[item.id] = { name: item.name, salesCount: 0, totalSold: 0, totalProfit: 0 };
        const qty = Number(item.quantity) || 0;
        productsMap[item.id].salesCount += qty;
        productsMap[item.id].totalSold += Number(item.price) * qty;
        productsMap[item.id].totalProfit += (Number(item.price) - Number(item.costPrice || 0)) * qty;
      });
    });
    return Object.values(productsMap).sort((a, b) => b.totalSold - a.totalSold);
  }, [salesHistory, currentDate, reportTab]);

  const changeDate = (delta: number) => {
    const next = new Date(currentDate);
    if (reportTab === 'DIARIO') next.setDate(next.getDate() + delta);
    else if (reportTab === 'MENSAL') next.setMonth(next.getMonth() + delta);
    else if (reportTab === 'ANUAL') next.setFullYear(next.getFullYear() + delta);
    setCurrentDate(next);
  };

  const handleUpdateSubscription = async (bizId: string, status: string, date: string) => {
    try {
      const biz = allBusinessesStats.find(b => b.id === bizId);
      if (!biz) return;
      const updatedProfile = { ...biz, planStatus: status, nextBilling: date };
      await db.profile.update(updatedProfile);
      setAllBusinessesStats(prev => prev.map(b => b.id === bizId ? { ...b, planStatus: status, nextBilling: date } : b));
      setSubscriptionModal({ isOpen: false, business: null });
      triggerNotify('Assinatura Atualizada!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBusiness = async (bizId: string) => {
    if (!confirm("Excluir empresa permanentemente?")) return;
    try {
      await db.admin.deleteBusiness(bizId);
      setAllBusinessesStats(prev => prev.filter(b => b.id !== bizId));
      setSubscriptionModal({ isOpen: false, business: null });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendNotification = (biz: any) => {
    const message = `Olá ${biz.companyName}! Vencimento OmniVenda em ${biz.nextBilling}.`;
    const phone = biz.phone?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleRetroactiveCostUpdate = async (productId: string, newCost: number) => {
    setLoading(true);
    try {
      const updatedSales = salesHistory.map(sale => {
        let hasProduct = false;
        const updatedItems = sale.items.map(item => {
          if (item.id === productId) { hasProduct = true; return { ...item, costPrice: newCost }; }
          return item;
        });
        if (!hasProduct) return sale;
        const totalItemsCost = updatedItems.reduce((acc, item) => acc + (Number(item.costPrice || 0) * item.quantity), 0);
        const newProfit = Number(sale.total) - totalItemsCost;
        return { ...sale, items: updatedItems, profit: newProfit };
      });
      const salesToUpdate = updatedSales.filter((s, i) => s !== salesHistory[i]);
      for (const sale of salesToUpdate) await db.sales.update(sale);
      setSalesHistory(updatedSales);
      triggerNotify('Sincronizado!');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const Header = ({ title, showBack = false, rightAction }: { title: string, showBack?: boolean, rightAction?: React.ReactNode }) => (
    <div className="sticky top-0 z-40 bg-[#fffbeb]">
      <header className="bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] text-white pt-4 pb-3 px-6 shadow-xl rounded-b-[1.8rem] relative overflow-hidden border-b-4 border-yellow-400">
        <div className="absolute top-2 right-0 p-4 opacity-10 rotate-12 pointer-events-none">
          <Palmtree size={50} />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            {showBack && !isProfileIncomplete ? (
              <button 
                onClick={() => isImpersonating ? handleExitImpersonation() : setCurrentScreen('HOME')} 
                className="bg-white/20 p-1.5 rounded-lg active:scale-90 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div 
                onClick={() => !isPureAdmin && setCurrentScreen('SETTINGS')} 
                className="w-12 h-12 bg-white rounded-xl shadow-lg border-2 border-yellow-400 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                 {businessProfile.logoUrl ? (
                   <img src={convertDriveLink(businessProfile.logoUrl)} className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-[#0ea5e9] font-black text-xl italic leading-none">{businessProfile.companyName?.charAt(0) || 'O'}</span>
                 )}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">{title}</h1>
              <p className="text-yellow-300 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Conectado OmniVenda Cloud</p>
            </div>
          </div>
          <div className="flex gap-2">
            {rightAction}
            <button onClick={handleLogout} className="p-2 bg-red-500/20 rounded-xl border border-white/10">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
    </div>
  );

  if (!session) return <AuthScreen onAuthSuccess={handleAuthSuccess} />;

  if (loading) {
    return (
      <div className="h-screen bg-[#fffbeb] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#fffbeb] flex flex-col ${currentScreen === 'HOME' ? 'h-screen overflow-hidden' : 'pb-32'}`}>
      {saveNotify.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 font-black uppercase italic text-[10px] border-2 border-white">
          <CheckCircle2 size={16} /> {saveNotify.msg}
        </div>
      )}

      {currentScreen === 'HOME' && !isPureAdmin && (
        <>
          <Header title={businessProfile.companyName} />
          <main className="px-6 mt-6 relative z-30 space-y-4 flex-1">
            {isDeveloper && (
              <button 
                onClick={() => setCurrentScreen('DEVELOPER_PANEL')}
                className="w-full bg-slate-800 text-white py-3 px-6 rounded-2xl shadow-lg flex items-center justify-between border-b-4 border-slate-950"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-blue-400"><Database size={18} /></div>
                  <h3 className="text-sm font-black uppercase italic tracking-tighter">Painel do Desenvolvedor</h3>
                </div>
                <ArrowRight size={18} className="text-slate-600" />
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white p-5 rounded-[2.2rem] shadow-lg border-b-4 border-slate-100 flex flex-col h-32 justify-between">
                  <div className="bg-[#0ea5e9] w-10 h-10 rounded-xl flex items-center justify-center text-white"><Wallet size={20}/></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Vendas</p>
                    <h4 className="text-lg font-black text-[#0ea5e9]">R$ {currentSummary.vendasTotal.toFixed(2)}</h4>
                  </div>
               </div>
               <div className="bg-white p-5 rounded-[2.2rem] shadow-lg border-b-4 border-slate-100 flex flex-col h-32 justify-between">
                  <div className="bg-green-500 w-10 h-10 rounded-xl flex items-center justify-center text-white"><TrendingUp size={20}/></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lucro Líquido</p>
                    <h4 className="text-lg font-black text-green-600">R$ {currentSummary.lucro.toFixed(2)}</h4>
                  </div>
               </div>
            </div>

            <button onClick={() => { setEditingSale(null); setSaleModal(true); }} className="w-full bg-yellow-400 text-[#1e293b] py-4 px-6 rounded-[2.5rem] shadow-xl flex items-center justify-between border-b-6 border-yellow-600 active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-yellow-500"><Plus size={24} strokeWidth={4} /></div>
                 <div className="text-left">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter leading-none">Novo Pedido</h3>
                    <p className="text-amber-900/60 text-[7px] font-black uppercase mt-1">Sincronizado na Nuvem</p>
                 </div>
              </div>
              <ChevronRight size={24} className="text-amber-900/20" />
            </button>

            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setCurrentScreen('CLIENTS')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
                  <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500"><Users size={28} /></div>
                  <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Clientes ({clients.length})</p>
               </button>
               <button onClick={() => setCurrentScreen('PRODUCTS')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500"><Package size={28} /></div>
                  <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Produtos ({products.length})</p>
               </button>
               <button onClick={() => setCurrentScreen('MONTHLY_SALES')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500"><ClipboardList size={28} /></div>
                  <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Histórico</p>
               </button>
               <button onClick={() => setCurrentScreen('REPORTS')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500"><BarChart3 size={28} /></div>
                  <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Relatório</p>
               </button>
            </div>
          </main>
        </>
      )}

      {currentScreen === 'SETTINGS' && !isPureAdmin && (
        <div className="min-h-screen bg-slate-50 pb-20">
          <Header title="Configurações" showBack={!isProfileIncomplete} />
          <div className="px-6 py-6 space-y-6">
            <SettingsForm profile={businessProfile} onLogout={handleLogout} onSave={async (p) => { const s = await db.profile.update(p); setBusinessProfile(s); triggerNotify('Salvo!'); }} />
            <CostCorrectionTool products={products} salesHistory={salesHistory} onUpdateSales={handleRetroactiveCostUpdate} />
          </div>
        </div>
      )}

      {currentScreen === 'CLIENTS' && !isPureAdmin && (
        <div className="min-h-screen">
          <Header title="Clientes" showBack rightAction={<button onClick={() => setClientModal({ type: ModalType.ADD })} className="bg-white/20 p-2.5 rounded-2xl"><Plus size={22} /></button>} />
          <div className="px-6 py-8 space-y-3">
            {clients.map(c => (
              <div key={c.id} onClick={() => setClientModal({ type: ModalType.EDIT, data: c })} className="bg-white p-4 rounded-[2rem] shadow-md border-b-4 border-slate-100 flex items-center justify-between active:scale-95 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 font-black text-xl">{c.name.charAt(0)}</div>
                   <div>
                      <h4 className="font-black text-slate-800 text-base uppercase italic leading-tight">{c.name}</h4>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{c.phone}</p>
                   </div>
                </div>
                <ChevronRight size={20} className="text-slate-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      {currentScreen === 'PRODUCTS' && !isPureAdmin && (
        <div className="min-h-screen">
          <Header title="Produtos" showBack rightAction={<button onClick={() => setProductModal({ type: ModalType.ADD })} className="bg-white/20 p-2.5 rounded-2xl"><Plus size={22} /></button>} />
          <div className="px-6 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="text" placeholder="Buscar..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none" />
            </div>
          </div>
          <div className="px-6 py-6 space-y-3">
             {products.filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase())).map(p => (
               <div key={p.id} onClick={() => setProductModal({ type: ModalType.EDIT, data: p })} className="bg-white p-3 rounded-2xl shadow-lg flex items-center gap-3 active:scale-95 transition-all cursor-pointer border-b-4 border-slate-100">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                     {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package className="text-red-200" size={28} />}
                  </div>
                  <div className="flex-1">
                     <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">QTD: {p.stock}</span>
                     <h3 className="font-black text-slate-800 text-sm uppercase italic leading-none">{p.name}</h3>
                     <p className="text-lg font-black text-[#0ea5e9]">R$ {Number(p.price).toFixed(2)}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {currentScreen === 'MONTHLY_SALES' && !isPureAdmin && (
        <div className="min-h-screen">
          <Header title="Histórico" showBack />
          <div className="px-6 py-6 space-y-2">
            {salesHistory.map(sale => (
              <div key={sale.id} onClick={() => setSelectedSale(sale)} className="bg-white p-3 rounded-2xl shadow-md border-b-4 border-slate-100 flex items-center justify-between active:scale-95 transition-all">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sale.status === 'ORCAMENTO' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                      {sale.status === 'ORCAMENTO' ? <FileText size={20}/> : <ShoppingBag size={20} />}
                    </div>
                    <div>
                       <h4 className="font-black text-slate-800 text-xs uppercase italic leading-tight">{sale.clientName}</h4>
                       <p className="text-[7px] font-black text-slate-400 uppercase">{sale.date} • {sale.status}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-base font-black text-[#0ea5e9]">R$ {Number(sale.total).toFixed(2)}</p>
                    <p className={`text-[7px] font-black uppercase italic ${sale.isPaid ? 'text-green-500' : 'text-red-400'}`}>{sale.isPaid ? 'Pago' : 'Pendente'}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentScreen === 'DEVELOPER_PANEL' && isDeveloper && (
        <div className="min-h-screen">
          <Header title="Admin" showBack={!isPureAdmin} />
          <div className="px-6 py-6 space-y-4">
            {allBusinessesStats.map(biz => (
              <div key={biz.id} className="bg-white p-4 rounded-[2rem] shadow-md flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-800 text-sm uppercase italic">{biz.companyName}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase">{biz.email}</p>
                </div>
                <button onClick={() => setSubscriptionModal({ isOpen: true, business: biz })} className="bg-blue-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">Gerenciar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentScreen === 'REPORTS' && !isPureAdmin && (
        <div className="min-h-screen bg-[#f3f4f6]">
          <Header title="Relatórios" showBack />
          <div className="p-4 space-y-4">
             <div className="bg-white p-5 rounded-2xl shadow-md border-b-4 border-slate-100">
                <h3 className="font-black text-slate-800 uppercase italic">Vendas: R$ {currentSummary.vendasTotal.toFixed(2)}</h3>
                <h3 className="font-black text-green-600 uppercase italic mt-1">Lucro: R$ {currentSummary.lucro.toFixed(2)}</h3>
             </div>
             <button onClick={() => setCurrentScreen('CLIENT_REPORT')} className="w-full bg-white p-5 rounded-xl text-left font-black uppercase">Ranking Clientes</button>
             <button onClick={() => setCurrentScreen('PRODUCT_REPORT')} className="w-full bg-white p-5 rounded-xl text-left font-black uppercase">Ranking Produtos</button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal isOpen={productModal.type !== ModalType.NONE} onClose={() => setProductModal({ type: ModalType.NONE })} onSave={handleSaveProduct} initialData={productModal.data} />
      <ClientForm isOpen={clientModal.type !== ModalType.NONE} onClose={() => setClientModal({ type: ModalType.NONE })} onSave={handleSaveClient} initialData={clientModal.data} />
      <NewSaleModal isOpen={saleModal} onClose={() => { setSaleModal(false); setEditingSale(null); }} products={products} clients={clients} onFinishSale={handleFinishSale} initialData={editingSale} />
      <SaleDetailModal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} sale={selectedSale} profile={businessProfile} clients={clients} onEdit={handleOpenEditSale} onDelete={handleDeleteSale} />
      
      <footer className="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
        © {new Date().getFullYear()} JABASSO
      </footer>
    </div>
  );
};

export default App;
