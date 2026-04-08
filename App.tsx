
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
      if (prof) setBusinessProfile(prof);
    } catch (e: any) {
      console.error("Erro ao sincronizar dados:", e);
      alert(`Erro de conexão com o Banco de Dados: ${e.message || 'Verifique sua internet ou as chaves do Supabase.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (isTest?: boolean) => {
    if (isTest) {
      setIsTestMode(true);
      setSession({ user: { email: 'demo@omnivenda.com' } });
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
        
        const productUpdates = products.map(p => {
          if (allProductIds.includes(p.id)) {
            const oldQty = oldItems.find(i => i.id === p.id)?.quantity || 0;
            const newQty = newItems.find(i => i.id === p.id)?.quantity || 0;
            const delta = newQty - oldQty;
            
            if (delta !== 0) {
              const newStock = Math.max(0, p.stock - delta);
              db.products.upsert({ ...p, stock: newStock });
              return { ...p, stock: newStock };
            }
          }
          return p;
        });
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

  const changeDate = (delta: number) => {
    const next = new Date(currentDate);
    if (reportTab === 'DIARIO') next.setDate(next.getDate() + delta);
    else if (reportTab === 'MENSAL') next.setMonth(next.getMonth() + delta);
    else if (reportTab === 'ANUAL') next.setFullYear(next.getFullYear() + delta);
    setCurrentDate(next);
  };

  const Header = ({ title, showBack = false, rightAction }: { title: string, showBack?: boolean, rightAction?: React.ReactNode }) => (
    <header className="bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] text-white pt-10 pb-12 px-6 shadow-xl rounded-b-[3.5rem] sticky top-0 z-40 relative overflow-hidden border-b-4 border-yellow-400">
      <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 pointer-events-none">
        <Palmtree size={120} />
      </div>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {showBack ? (
            <button onClick={() => setCurrentScreen('HOME')} className="bg-white/20 p-2.5 rounded-2xl active:scale-90 transition-all">
              <ArrowLeft size={22} />
            </button>
          ) : (
            <div onClick={() => setCurrentScreen('SETTINGS')} className="w-16 h-16 bg-white rounded-2xl p-1 shadow-lg cursor-pointer border-2 border-yellow-400 flex items-center justify-center overflow-hidden">
               {businessProfile.logoUrl ? (
                 <img src={convertDriveLink(businessProfile.logoUrl)} className="w-full h-full object-contain" />
               ) : (
                 <span className="text-[#0ea5e9] font-black text-xl italic leading-none">{businessProfile.companyName?.charAt(0) || 'O'}</span>
               )}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none truncate drop-shadow-sm max-w-[180px]">
              {title}
            </h1>
            <p className="text-yellow-300 text-[8px] font-black uppercase tracking-[0.2em] mt-1">
              {isTestMode ? 'Modo Teste Offline' : 'Conectado OmniVenda Cloud'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {rightAction}
          {!showBack && (
            <button onClick={handleLogout} className="p-2.5 bg-red-500/20 rounded-2xl border border-white/10 active:scale-90">
              <LogOut size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
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
    <div className="min-h-screen pb-32 bg-[#fffbeb]">
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
          <main className="px-6 -mt-6 relative z-30 space-y-5 pt-1">
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

            <button onClick={() => { setEditingSale(null); setSaleModal(true); }} className="w-full bg-yellow-400 text-[#1e293b] p-6 rounded-[2.8rem] shadow-xl shadow-yellow-200/50 flex items-center justify-between group active:scale-[0.96] transition-all border-b-8 border-yellow-600">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-yellow-500 shadow-inner"><Plus size={30} strokeWidth={4} /></div>
                 <div className="text-left">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">Novo Pedido</h3>
                    <p className="text-amber-900/60 text-[8px] font-black uppercase mt-1">
                      {isTestMode ? 'Teste Local (Offline)' : 'Nuvem Multi-Empresa'}
                    </p>
                 </div>
              </div>
              <ChevronRight size={28} className="text-amber-900/20" />
            </button>

            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setCurrentScreen('CLIENTS')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-50 flex flex-col items-center gap-2 active:scale-95 transition-all group">
                  <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all"><Users size={28} /></div>
                  <p className="font-black text-slate-800 uppercase text-[9px] tracking-widest">Clientes ({clients.length})</p>
               </button>
               <button onClick={() => setCurrentScreen('PRODUCTS')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-50 flex flex-col items-center gap-2 active:scale-95 transition-all group">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all"><Package size={28} /></div>
                  <p className="font-black text-slate-800 uppercase text-[9px] tracking-widest">Catálogo ({products.length})</p>
               </button>
               <button onClick={() => setCurrentScreen('MONTHLY_SALES')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-50 flex flex-col items-center gap-2 active:scale-95 transition-all group">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all"><ClipboardList size={28} /></div>
                  <p className="font-black text-slate-800 uppercase text-[9px] tracking-widest">Histórico</p>
               </button>
               <button onClick={() => setCurrentScreen('REPORTS')} className="bg-[#1e293b] p-6 rounded-[2.5rem] shadow-md border-b-4 border-black flex flex-col items-center gap-2 active:scale-95 transition-all group text-white">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black transition-all"><BarChart3 size={28} /></div>
                  <p className="font-black uppercase text-[9px] tracking-widest">Relatório</p>
               </button>
            </div>
          </main>
        </>
      )}

      {currentScreen === 'SETTINGS' && (
        <div className="min-h-screen">
          <Header title="Configurações" showBack />
          <SettingsForm profile={businessProfile} onSave={async (newProfile) => { 
            const saved = await db.profile.update(newProfile);
            setBusinessProfile(saved);
            triggerNotify('Perfil Atualizado!'); 
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
          <Header title="Catálogo" showBack rightAction={<button onClick={() => setProductModal({ type: ModalType.ADD })} className="bg-white/20 p-2.5 rounded-2xl"><Plus size={22} /></button>} />
          <div className="px-6 py-8 space-y-4">
             {products.length === 0 ? <EmptyState message="Estoque Vazio" icon={Package} /> : (
               products.map(p => (
                 <div key={p.id} onClick={() => setProductModal({ type: ModalType.EDIT, data: p })} className="bg-white p-4 rounded-[2.5rem] shadow-lg flex items-center gap-4 active:scale-95 transition-all cursor-pointer border-b-4 border-slate-100 group">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner group-hover:bg-red-100">
                       {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package className="text-red-200" size={32} />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase mb-1 inline-block">QTD: {p.stock}</span>
                       <h3 className="font-black text-slate-800 text-base truncate mb-0.5 uppercase italic leading-none">{p.name}</h3>
                       <p className="text-xl font-black text-[#0ea5e9]">R$ {Number(p.price).toFixed(2)}</p>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {currentScreen === 'MONTHLY_SALES' && (
        <div className="min-h-screen">
          <Header title="Histórico" showBack />
          <div className="px-6 py-8 space-y-3">
            {salesHistory.length === 0 ? <EmptyState message="Sem vendas registradas" icon={ClipboardList} /> : (
              salesHistory.map(sale => (
                <div key={sale.id} onClick={() => setSelectedSale(sale)} className="bg-white p-5 rounded-[2.2rem] shadow-md border-b-6 border-slate-50 flex items-center justify-between active:scale-95 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform ${sale.status === 'ORCAMENTO' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                        {sale.status === 'ORCAMENTO' ? <FileText size={24}/> : <ShoppingBag size={24} />}
                      </div>
                      <div className="min-w-0">
                         <h4 className="font-black text-slate-800 text-sm uppercase italic leading-tight truncate">{sale.clientName}</h4>
                         <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">{sale.date} • {sale.status}</p>
                      </div>
                   </div>
                   <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black text-[#0ea5e9]">R$ {Number(sale.total).toFixed(2)}</p>
                      <p className={`text-[8px] font-black uppercase italic ${sale.isPaid ? 'text-green-500' : 'text-red-400'}`}>{sale.isPaid ? 'Pago' : 'Pendente'}</p>
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

      <ProductModal isOpen={productModal.type !== ModalType.NONE} onClose={() => setProductModal({ type: ModalType.NONE })} onSave={handleSaveProduct} initialData={productModal.data} />
      <ClientForm isOpen={clientModal.type !== ModalType.NONE} onClose={() => setClientModal({ type: ModalType.NONE })} onSave={handleSaveClient} initialData={clientModal.data} />
      <NewSaleModal isOpen={saleModal} onClose={() => { setSaleModal(false); setEditingSale(null); }} products={products} clients={clients} onFinishSale={handleFinishSale} initialData={editingSale} />
      <SaleDetailModal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} sale={selectedSale} profile={businessProfile} clients={clients} onEdit={handleOpenEditSale} />
    </div>
  );
};

export default App;
