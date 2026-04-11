
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
  Info
} from 'lucide-react';
import ProductModal from './components/ProductModal.tsx';
import ClientForm from './components/ClientForm.tsx';
import NewSaleModal from './components/NewSaleModal.tsx';
import SaleDetailModal from './components/SaleDetailModal.tsx';
import SettingsForm from './components/SettingsForm.tsx';
import AuthScreen from './components/AuthScreen.tsx';
import { supabase, db, isConfigured } from './services/supabase.ts';
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
      } else if (session?.user?.user_metadata?.company_name) {
        setBusinessProfile(prev => ({
          ...prev,
          companyName: session.user.user_metadata.company_name
        }));
      }
    } catch (e: any) {
      console.error("Erro ao sincronizar dados:", e);
      alert(`Erro de conexão com o Banco de Dados: ${e.message || 'Verifique sua internet ou as chaves do Supabase.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (isTest?: boolean, testName?: string) => {
    if (isTest) {
      setIsTestMode(true);
      setSession({ user: { email: 'demo@omnivenda.com', user_metadata: { company_name: testName } } });
      localStorage.setItem('omnivenda_test_session', 'active');
      fetchAllData();
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
      console.error("Erro ao salvar produto:", e);
      alert(`Erro ao salvar produto: ${e.message || 'Verifique se as tabelas foram criadas no Supabase.'}`);
    }
  };

  const handleSaveClient = async (data: Omit<Client, 'id'>) => {
    try {
      const isEdit = clientModal.type === ModalType.EDIT && !!clientModal.data;
      const editId = clientModal.data?.id;
      const payload = isEdit ? { ...data, id: editId } : { ...data };
      const saved = await db.clients.upsert(payload);
      
      if (!saved || !saved.id) {
        throw new Error("O banco de dados não retornou um ID válido após salvar.");
      }

      setClients(prev => isEdit 
        ? prev.map(c => c.id === editId ? (saved as Client) : c) 
        : [saved as Client, ...prev]
      );
      
      setClientModal({ type: ModalType.NONE });
      triggerNotify('Cliente Salvo!');
    } catch (e: any) {
      console.error("Erro ao salvar cliente:", e);
      alert(`Erro ao salvar cliente: ${e.message || 'Verifique sua conexão.'}`);
    }
  };

  const handleFinishSale = async (data: Partial<Sale>) => {
    try {
      const isUpdate = !!data.id;
      const client = clients.find(c => c.id === data.clientId);
      
      const salePayload = {
        id: data.id,
        clientId: data.clientId!,
        clientName: client?.name || 'Venda Avulsa',
        items: data.items!,
        total: data.total!,
        profit: data.profit || 0,
        paymentMethod: data.paymentMethod || 'Dinheiro',
        paymentTerms: data.paymentTerms || 'À vista',
        installments: data.installments || 1,
        date: isUpdate ? salesHistory.find(s => s.id === data.id)?.date : new Date().toLocaleDateString('pt-BR'),
        time: isUpdate ? salesHistory.find(s => s.id === data.id)?.time : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: data.status || 'FINALIZADA',
        isPaid: data.isPaid ?? true,
        deliveryStatus: data.deliveryStatus || 'ENTREGUE'
      };

      let savedSale;
      if (isUpdate) {
        savedSale = await db.sales.update(salePayload);
        setSalesHistory(prev => prev.map(s => s.id === savedSale.id ? savedSale : s));
      } else {
        savedSale = await db.sales.create(salePayload);
        setSalesHistory(prev => [savedSale, ...prev]);
      }
      
      if (savedSale.status === 'FINALIZADA') {
        const oldItems = isUpdate ? (salesHistory.find(s => s.id === data.id)?.items || []) : [];
        const newItems = data.items!;
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
      triggerNotify(isUpdate ? 'Pedido Atualizado!' : (savedSale.status === 'ORCAMENTO' ? 'Orçamento Salvo!' : 'Venda Realizada!'));
    } catch (e) {
      alert("Erro ao processar venda.");
    }
  };

  const handleOpenEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSelectedSale(null);
    setSaleModal(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    try {
      const saleToDelete = salesHistory.find(s => s.id === saleId);
      if (!saleToDelete) return;

      // Se a venda estava finalizada, devolve o estoque
      if (saleToDelete.status === 'FINALIZADA') {
        const productUpdates = [...products];
        for (let i = 0; i < productUpdates.length; i++) {
          const p = productUpdates[i];
          const item = saleToDelete.items.find(it => it.id === p.id);
          if (item) {
            const newStock = p.stock + item.quantity;
            const updatedProduct = { ...p, stock: newStock };
            await db.products.upsert(updatedProduct);
            productUpdates[i] = updatedProduct;
          }
        }
        setProducts(productUpdates);
      }

      await db.sales.delete(saleId);
      setSalesHistory(prev => prev.filter(s => s.id !== saleId));
      triggerNotify('Pedido Excluído!');
    } catch (e) {
      console.error("Erro ao excluir venda:", e);
      alert("Erro ao excluir pedido.");
    }
  };

  const handleLogout = async () => {
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
      if (reportTab === 'DIARIO') return s.date === dayStr;
      if (reportTab === 'MENSAL') return s.date.endsWith(monthStr);
      if (reportTab === 'ANUAL') return s.date.endsWith(yearStr);
      return false;
    });

    const stats = {
      vendasCount: 0, vendasTotal: 0, lucro: 0, recebidoCount: 0, recebidoTotal: 0,
      aReceberCount: 0, aReceberTotal: 0, orcamentosCount: 0, orcamentosTotal: 0,
      entregaCount: 0, entregaTotal: 0
    };

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
    const dayStr = d.toLocaleDateString('pt-BR');
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
    const yearStr = d.getFullYear().toString();

    const filtered = salesHistory.filter(s => {
      if (s.status !== 'FINALIZADA') return false;
      if (reportTab === 'DIARIO') return s.date === dayStr;
      if (reportTab === 'MENSAL') return s.date.endsWith(monthStr);
      if (reportTab === 'ANUAL') return s.date.endsWith(yearStr);
      return false;
    });

    const clientsMap: Record<string, { name: string, salesCount: number, totalSold: number, totalProfit: number }> = {};

    filtered.forEach(sale => {
      if (!clientsMap[sale.clientId]) {
        clientsMap[sale.clientId] = { name: sale.clientName, salesCount: 0, totalSold: 0, totalProfit: 0 };
      }
      clientsMap[sale.clientId].salesCount += 1;
      clientsMap[sale.clientId].totalSold += Number(sale.total);
      clientsMap[sale.clientId].totalProfit += Number(sale.profit || 0);
    });

    return Object.values(clientsMap).sort((a, b) => b.totalSold - a.totalSold);
  }, [salesHistory, currentDate, reportTab]);

  const productRanking = useMemo(() => {
    const d = currentDate;
    const dayStr = d.toLocaleDateString('pt-BR');
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
    const yearStr = d.getFullYear().toString();

    const filtered = salesHistory.filter(s => {
      if (s.status !== 'FINALIZADA') return false;
      if (reportTab === 'DIARIO') return s.date === dayStr;
      if (reportTab === 'MENSAL') return s.date.endsWith(monthStr);
      if (reportTab === 'ANUAL') return s.date.endsWith(yearStr);
      return false;
    });

    const productsMap: Record<string, { name: string, salesCount: number, totalSold: number, totalProfit: number }> = {};

    filtered.forEach(sale => {
      sale.items.forEach(item => {
        if (!productsMap[item.id]) {
          productsMap[item.id] = { name: item.name, salesCount: 0, totalSold: 0, totalProfit: 0 };
        }
        productsMap[item.id].salesCount += item.quantity;
        productsMap[item.id].totalSold += Number(item.price * item.quantity);
        const cost = item.costPrice || 0;
        const profit = (item.price - cost) * item.quantity;
        productsMap[item.id].totalProfit += profit;
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

  const Header = ({ title, showBack = false, rightAction }: { title: string, showBack?: boolean, rightAction?: React.ReactNode }) => (
    <div className="sticky top-0 z-40 bg-[#fffbeb]">
      <header className="bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] text-white pt-4 pb-3 px-6 shadow-xl rounded-b-[1.8rem] relative overflow-hidden border-b-4 border-yellow-400">
        <div className="absolute top-2 right-0 p-4 opacity-10 rotate-12 pointer-events-none">
          <Palmtree size={50} />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            {showBack ? (
              <button onClick={() => setCurrentScreen('HOME')} className="bg-white/20 p-1.5 rounded-lg active:scale-90 transition-all">
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div onClick={() => setCurrentScreen('SETTINGS')} className="w-12 h-12 bg-white rounded-xl shadow-lg cursor-pointer border-2 border-yellow-400 flex items-center justify-center overflow-hidden">
                 {businessProfile.logoUrl ? (
                   <img src={convertDriveLink(businessProfile.logoUrl)} className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-[#0ea5e9] font-black text-xl italic leading-none">{businessProfile.companyName?.charAt(0) || 'O'}</span>
                 )}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none truncate drop-shadow-sm max-w-[220px]">
                {title}
              </h1>
              <p className="text-yellow-300 text-[9px] font-black uppercase tracking-[0.2em] mt-1">
                {isTestMode ? 'Modo Teste Offline' : 'Conectado OmniVenda Cloud'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {rightAction}
            {!showBack && (
              <button onClick={handleLogout} className="p-2 bg-red-500/20 rounded-xl border border-white/10 active:scale-90">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );

  if (!session) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fffbeb]">
        <div className="relative">
           <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
           <Sun className="absolute inset-0 m-auto text-yellow-400" size={24} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando com a Nuvem...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#fffbeb] flex flex-col ${currentScreen === 'HOME' ? 'h-screen overflow-hidden' : 'pb-32'}`}>
      {saveNotify.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 duration-300 font-black uppercase italic text-[10px] border-2 border-white">
          <CheckCircle2 size={16} /> {saveNotify.msg}
        </div>
      )}

      {isTestMode && currentScreen === 'HOME' && (
        <div className="bg-amber-100 border-b border-amber-200 px-6 py-1 flex items-center justify-center gap-2">
           <Info size={12} className="text-amber-600" />
           <span className="text-[8px] font-black uppercase text-amber-700 tracking-widest">Aviso: Você está no Modo de Teste. Dados salvos apenas neste navegador.</span>
        </div>
      )}

      {currentScreen === 'HOME' && (
        <>
          <Header title={businessProfile.companyName || 'Minha Empresa'} />
          <main className="px-6 mt-6 relative z-30 space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white p-5 rounded-[2.2rem] shadow-lg border-b-4 border-[#0ea5e9]/10 flex flex-col h-32 justify-between active:scale-95 transition-all">
                  <div className="bg-[#0ea5e9] w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"><Wallet size={20}/></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Vendas</p>
                    <h4 className="text-lg font-black text-[#0ea5e9]">R$ {currentSummary.vendasTotal.toFixed(2)}</h4>
                  </div>
               </div>
               <div className="bg-white p-5 rounded-[2.2rem] shadow-lg border-b-4 border-green-200/50 flex flex-col h-32 justify-between active:scale-95 transition-all">
                  <div className="bg-green-500 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"><TrendingUp size={20}/></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lucro Líquido</p>
                    <h4 className="text-lg font-black text-green-600">R$ {currentSummary.lucro.toFixed(2)}</h4>
                  </div>
               </div>
            </div>

            <button onClick={() => { setEditingSale(null); setSaleModal(true); }} className="w-full bg-yellow-400 text-[#1e293b] py-4 px-6 rounded-[2.5rem] shadow-xl shadow-yellow-200/50 flex items-center justify-between group active:scale-[0.96] transition-all border-b-6 border-yellow-600">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-yellow-500 shadow-inner"><Plus size={24} strokeWidth={4} /></div>
                 <div className="text-left">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter leading-none">Novo Pedido</h3>
                    <p className="text-amber-900/60 text-[7px] font-black uppercase mt-1">
                      {isTestMode ? 'Teste Local (Offline)' : 'Nuvem Multi-Empresa'}
                    </p>
                 </div>
              </div>
              <ChevronRight size={24} className="text-amber-900/20" />
            </button>

            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setCurrentScreen('CLIENTS')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-50 flex flex-col items-center gap-2 active:scale-95 transition-all group">
                  <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all"><Users size={28} /></div>
                  <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Clientes ({clients.length})</p>
               </button>
               <button onClick={() => setCurrentScreen('PRODUCTS')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-50 flex flex-col items-center gap-2 active:scale-95 transition-all group">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all"><Package size={28} /></div>
                  <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Produtos/Estoques ({products.length})</p>
               </button>
               <button onClick={() => setCurrentScreen('MONTHLY_SALES')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-50 flex flex-col items-center gap-2 active:scale-95 transition-all group">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all"><ClipboardList size={28} /></div>
                  <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Histórico</p>
               </button>
               <button onClick={() => setCurrentScreen('REPORTS')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-50 flex flex-col items-center gap-2 active:scale-95 transition-all group">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all"><BarChart3 size={28} /></div>
                  <p className="font-black text-slate-500 uppercase text-[10px] tracking-widest">Relatório</p>
               </button>
            </div>
          </main>
        </>
      )}

      {currentScreen === 'SETTINGS' && (
        <div className="min-h-screen">
          <Header title="Configurações" showBack />
          <SettingsForm profile={businessProfile} onSave={async (newProfile) => { 
            try {
              const saved = await db.profile.update(newProfile);
              setBusinessProfile(saved);
              triggerNotify('Perfil Atualizado!'); 
            } catch (e: any) {
              console.error("Erro ao salvar perfil:", e);
              alert(`Erro ao salvar configurações: ${e.message || 'Verifique sua conexão.'}`);
            }
          }} />
        </div>
      )}

      {currentScreen === 'CLIENTS' && (
        <div className="min-h-screen">
          <Header title="Clientes" showBack rightAction={<button onClick={() => setClientModal({ type: ModalType.ADD })} className="bg-white/20 p-2.5 rounded-2xl"><Plus size={22} /></button>} />
          <div className="px-6 py-8 space-y-3">
            {clients.length === 0 ? <EmptyState message="Nenhum cliente" icon={Users} /> : (
              clients.map(c => (
                <div key={c.id} onClick={() => setClientModal({ type: ModalType.EDIT, data: c })} className="bg-white p-4 rounded-[2rem] shadow-md border-b-4 border-slate-100 flex items-center justify-between active:scale-95 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 font-black text-xl border border-sky-100 shadow-inner group-hover:bg-sky-500 group-hover:text-white transition-all">{c.name.charAt(0)}</div>
                     <div>
                        <h4 className="font-black text-slate-800 text-base leading-tight uppercase italic">{c.name}</h4>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{c.phone || 'Sem Contato'}</p>
                     </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-200 group-hover:text-sky-500" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {currentScreen === 'PRODUCTS' && (
        <div className="min-h-screen">
          <Header title="Produtos/Estoques" showBack rightAction={<button onClick={() => setProductModal({ type: ModalType.ADD })} className="bg-white/20 p-2.5 rounded-2xl"><Plus size={22} /></button>} />
          
          <div className="px-6 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar produto por nome..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium shadow-sm"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="px-6 py-6 space-y-3">
             {products.filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase())).length === 0 ? <EmptyState message={catalogSearch ? "Nenhum produto encontrado" : "Estoque Vazio"} icon={Package} /> : (
               products
                .filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                .map(p => (
                 <div key={p.id} onClick={() => setProductModal({ type: ModalType.EDIT, data: p })} className="bg-white p-3 rounded-2xl shadow-lg flex items-center gap-3 active:scale-95 transition-all cursor-pointer border-b-4 border-slate-100 group">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner group-hover:bg-red-100">
                       {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package className="text-red-200" size={28} />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase mb-1 inline-block">QTD: {p.stock}</span>
                       <h3 className="font-black text-slate-800 text-sm truncate mb-0.5 uppercase italic leading-none">{p.name}</h3>
                       <p className="text-lg font-black text-[#0ea5e9]">R$ {Number(p.price).toFixed(2)}</p>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {currentScreen === 'MONTHLY_SALES' && (
        <div className="min-h-screen">
          <Header 
            title="Histórico" 
            showBack 
            rightAction={
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`p-2.5 rounded-2xl border transition-all active:scale-90 ${showFilters ? 'bg-yellow-400 border-yellow-500 text-slate-800 shadow-md' : 'bg-white/20 border-white/10 text-white'}`}
              >
                <Filter size={20} />
              </button>
            } 
          />
          
          {showFilters && (
            <div className="px-6 pt-4 space-y-3 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-white p-4 rounded-[2rem] shadow-lg border border-slate-100 space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Vendas por Clientes</label>
                  <select 
                    value={filterClientId}
                    onChange={(e) => setFilterClientId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="ALL">Todos os Clientes</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Vendas por Produtos</label>
                  <select 
                    value={filterProductId}
                    onChange={(e) => setFilterProductId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="ALL">Todos os Produtos</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    onClick={() => setCurrentScreen('CLIENT_REPORT')}
                    className="bg-blue-50 text-blue-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Users size={14} /> Ranking Clientes
                  </button>
                  <button 
                    onClick={() => setCurrentScreen('PRODUCT_REPORT')}
                    className="bg-red-50 text-red-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Package size={14} /> Ranking Produtos
                  </button>
                </div>
                {(filterClientId !== 'ALL' || filterProductId !== 'ALL') && (
                  <button 
                    onClick={() => { setFilterClientId('ALL'); setFilterProductId('ALL'); }}
                    className="w-full py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="px-6 py-6 space-y-2">
            {salesHistory.filter(sale => {
              const matchesClient = filterClientId === 'ALL' || sale.clientId === filterClientId;
              const matchesProduct = filterProductId === 'ALL' || sale.items.some(item => item.id === filterProductId);
              return matchesClient && matchesProduct;
            }).length === 0 ? <EmptyState message="Nenhum pedido encontrado" icon={ClipboardList} /> : (
              salesHistory
                .filter(sale => {
                  const matchesClient = filterClientId === 'ALL' || sale.clientId === filterClientId;
                  const matchesProduct = filterProductId === 'ALL' || sale.items.some(item => item.id === filterProductId);
                  return matchesClient && matchesProduct;
                })
                .map(sale => (
                  <div key={sale.id} onClick={() => setSelectedSale(sale)} className="bg-white p-3 rounded-2xl shadow-md border-b-4 border-slate-50 flex items-center justify-between active:scale-95 transition-all group">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform ${sale.status === 'ORCAMENTO' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                          {sale.status === 'ORCAMENTO' ? <FileText size={20}/> : <ShoppingBag size={20} />}
                        </div>
                        <div className="min-w-0">
                           <h4 className="font-black text-slate-800 text-xs uppercase italic leading-tight truncate max-w-[120px]">{sale.clientName}</h4>
                           <p className="text-[7px] font-black text-slate-400 uppercase mt-0.5">{sale.date} • {sale.status}</p>
                        </div>
                     </div>
                     <div className="text-right flex-shrink-0">
                        <p className="text-base font-black text-[#0ea5e9]">R$ {Number(sale.total).toFixed(2)}</p>
                        <p className={`text-[7px] font-black uppercase italic ${sale.isPaid ? 'text-green-500' : 'text-red-400'}`}>{sale.isPaid ? 'Pago' : 'Pendente'}</p>
                     </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {currentScreen === 'REPORTS' && (
        <div className="min-h-screen bg-[#f3f4f6]">
          <div className="bg-[#0ea5e9] text-white pt-2 shadow-md">
             <div className="flex justify-between px-10 pb-4">
                <button onClick={() => setReportTab('DIARIO')} className={`text-sm font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${reportTab === 'DIARIO' ? 'border-yellow-400' : 'border-transparent text-white/60'}`}>Diário</button>
                <button onClick={() => setReportTab('MENSAL')} className={`text-sm font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${reportTab === 'MENSAL' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-white/60'}`}>Mensal</button>
                <button onClick={() => setReportTab('ANUAL')} className={`text-sm font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${reportTab === 'ANUAL' ? 'border-yellow-400' : 'border-transparent text-white/60'}`}>Anual</button>
             </div>
             <div className="bg-sky-600/50 flex items-center justify-between px-12 py-3">
                <button onClick={() => changeDate(-1)} className="p-1 active:scale-75 transition-transform"><ChevronLeft size={28}/></button>
                <span className="text-xl font-medium">
                  {reportTab === 'DIARIO' ? currentDate.toLocaleDateString('pt-BR') : 
                   reportTab === 'MENSAL' ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}` : 
                   currentDate.getFullYear()}
                </span>
                <button onClick={() => changeDate(1)} className="p-1 active:scale-75 transition-transform"><ChevronRight size={28}/></button>
             </div>
          </div>

          <div className="p-4 pb-20">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
               <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xl font-bold text-slate-800">Indicadores Financeiros</h3>
               </div>
               
               <div className="p-2 divide-y divide-slate-100">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                     <div className="flex items-center gap-3">
                        <div className="w-1 h-10 bg-blue-500 rounded-full"/>
                        <span className="text-xl font-medium text-slate-900">Vendas</span>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-yellow-500">{currentSummary.vendasCount}</span>
                        <span className="text-xl font-bold text-[#0ea5e9]">R$ {currentSummary.vendasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <ChevronRight className="text-slate-300" size={20}/>
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/20">
                     <div className="flex items-center gap-3 pl-4">
                        <span className="text-xl font-medium text-slate-800">Lucro Estimado</span>
                     </div>
                     <div className="flex items-center gap-4 pr-10">
                        <span className="text-xl font-bold text-green-600">R$ {currentSummary.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                     <div className="flex items-center gap-3">
                        <div className="w-1 h-10 bg-green-600 rounded-full"/>
                        <span className="text-xl font-medium text-slate-900">Recebido</span>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-yellow-500">{currentSummary.recebidoCount}</span>
                        <span className="text-xl font-bold text-green-600">R$ {currentSummary.recebidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <ChevronRight className="text-slate-300" size={20}/>
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                     <div className="flex items-center gap-3">
                        <div className="w-1 h-10 bg-amber-600 rounded-full"/>
                        <span className="text-xl font-medium text-slate-900">A Receber</span>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-yellow-500">{currentSummary.aReceberCount}</span>
                        <span className="text-xl font-bold text-amber-700">R$ {currentSummary.aReceberTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <ChevronRight className="text-slate-300" size={20}/>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <button onClick={() => setCurrentScreen('HOME')} className="fixed bottom-6 right-6 w-14 h-14 bg-[#0ea5e9] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 border-4 border-white">
            <ArrowLeft size={24}/>
          </button>
        </div>
      )}

      {(currentScreen === 'CLIENT_REPORT' || currentScreen === 'PRODUCT_REPORT') && (
        <div className="min-h-screen bg-white flex flex-col animate-in slide-in-from-right duration-300">
          <div className="bg-[#0ea5e9] text-white pt-2 shadow-md flex-shrink-0">
             <div className="flex items-center px-6 py-2">
                <button onClick={() => setCurrentScreen('MONTHLY_SALES')} className="bg-white/20 p-2 rounded-xl active:scale-90 transition-all mr-4">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Relatório de Ranking</p>
                  <h2 className="text-lg font-black uppercase italic tracking-tighter leading-none">
                    {currentScreen === 'CLIENT_REPORT' ? 'Vendas por Clientes' : 'Vendas por Produtos'}
                  </h2>
                </div>
             </div>
             <div className="flex justify-between px-10 pb-4 mt-2">
                <button onClick={() => setReportTab('DIARIO')} className={`text-sm font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${reportTab === 'DIARIO' ? 'border-yellow-400' : 'border-transparent text-white/60'}`}>Diário</button>
                <button onClick={() => setReportTab('MENSAL')} className={`text-sm font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${reportTab === 'MENSAL' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-white/60'}`}>Mensal</button>
                <button onClick={() => setReportTab('ANUAL')} className={`text-sm font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${reportTab === 'ANUAL' ? 'border-yellow-400' : 'border-transparent text-white/60'}`}>Anual</button>
             </div>
             <div className="bg-sky-600/50 flex items-center justify-between px-12 py-3">
                <button onClick={() => changeDate(-1)} className="p-1 active:scale-75 transition-transform"><ChevronLeft size={28}/></button>
                <span className="text-xl font-medium">
                  {reportTab === 'DIARIO' ? currentDate.toLocaleDateString('pt-BR') : 
                   reportTab === 'MENSAL' ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}` : 
                   currentDate.getFullYear()}
                </span>
                <button onClick={() => changeDate(1)} className="p-1 active:scale-75 transition-transform"><ChevronRight size={28}/></button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
            {(currentScreen === 'CLIENT_REPORT' ? clientRanking : productRanking).length === 0 ? (
              <EmptyState message="Sem dados para este período" icon={BarChart3} />
            ) : (
              (currentScreen === 'CLIENT_REPORT' ? clientRanking : productRanking).map((item, index) => (
                <div key={index} className="bg-white border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-[10px] font-black text-slate-300 uppercase italic">Pos. {index + 1}</div>
                    <h3 className="font-black text-slate-800 text-sm uppercase italic leading-none truncate flex-1">{item.name}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Nro. Vendas</p>
                      <p className="text-lg font-black text-yellow-500">{item.salesCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lucro</p>
                      <p className="text-sm font-black text-green-600">R$ {item.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendido</p>
                      <p className="text-sm font-black text-blue-600">R$ {item.totalSold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-sky-50 p-4 border-t border-sky-100 flex-shrink-0 fixed bottom-0 left-0 right-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-slate-500 uppercase">Nro. Vendas:</span>
              <span className="text-lg font-black text-slate-800">{(currentScreen === 'CLIENT_REPORT' ? clientRanking : productRanking).reduce((acc, curr) => acc + curr.salesCount, 0)}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-slate-500 uppercase">Venda Total:</span>
              <span className="text-lg font-black text-blue-600">R$ {(currentScreen === 'CLIENT_REPORT' ? clientRanking : productRanking).reduce((acc, curr) => acc + curr.totalSold, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase">Lucro Total:</span>
              <span className="text-lg font-black text-green-600">R$ {(currentScreen === 'CLIENT_REPORT' ? clientRanking : productRanking).reduce((acc, curr) => acc + curr.totalProfit, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}

      <ProductModal isOpen={productModal.type !== ModalType.NONE} onClose={() => setProductModal({ type: ModalType.NONE })} onSave={handleSaveProduct} initialData={productModal.data} />
      <ClientForm isOpen={clientModal.type !== ModalType.NONE} onClose={() => setClientModal({ type: ModalType.NONE })} onSave={handleSaveClient} initialData={clientModal.data} />
      <NewSaleModal isOpen={saleModal} onClose={() => { setSaleModal(false); setEditingSale(null); }} products={products} clients={clients} onFinishSale={handleFinishSale} initialData={editingSale} />
      <SaleDetailModal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} sale={selectedSale} profile={businessProfile} clients={clients} onEdit={handleOpenEditSale} onDelete={handleDeleteSale} />
      
      <footer className="py-6 text-center border-t border-slate-100 bg-white/50">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Todos os direitos reservados JABASSO
        </p>
      </footer>
    </div>
  );
};

export default App;
