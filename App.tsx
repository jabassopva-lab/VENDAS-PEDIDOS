
import React, { useState, useEffect } from 'react';
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
  Database
} from 'lucide-react';
import ProductModal from './components/ProductModal';
import ClientForm from './components/ClientForm';
import NewSaleModal from './components/NewSaleModal';
import SaleDetailModal from './components/SaleDetailModal';
import SettingsForm from './components/SettingsForm';
import { Product, Client, ModalType, Screen, Sale, BusinessProfile } from './types';
import { generatePerformanceReport } from './services/geminiService';

// CHAVES DEFINITIVAS - NÃO MUDAR NUNCA
const DB_KEYS = {
  PRODUCTS: 'DOCEBOM_DATA_PRODUCTS_FINAL',
  CLIENTS: 'DOCEBOM_DATA_CLIENTS_FINAL',
  SALES: 'DOCEBOM_DATA_SALES_FINAL',
  PROFILE: 'DOCEBOM_DATA_PROFILE_FINAL'
};

const LEGACY_KEYS = [
  'docebom_inventory_v1', 'docebom_inventory_v2', 'docebom_inventory_v3',
  'docebom_customers_v1', 'docebom_customers_v2', 'docebom_customers_v3',
  'docebom_history_v1', 'docebom_history_v2', 'docebom_history_v3',
  'DOCEBOM_STABLE_PRODUCTS_LIST', 'DOCEBOM_STABLE_CLIENTS_LIST', 
  'DOCEBOM_STABLE_SALES_HISTORY', 'DOCEBOM_STABLE_BUSINESS_PROFILE'
];

const DEFAULT_PROFILE: BusinessProfile = {
  companyName: 'DOCE BOM',
  document: '32.785.943/0001-63',
  phone: '66 99967-0612',
  email: 'contato@docebom.com',
  address: 'Distribuição de Cocadas',
  logoUrl: '',
  planStatus: 'PREMIUM',
  nextBilling: '20/12/2024'
};

export const convertDriveLink = (url: string): string => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const regExp = /\/file\/d\/([^/]+)\//;
    const match = url.match(regExp);
    if (match && match[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
};

const CocoMascot = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in zoom-in duration-500">
    <div className="w-24 h-24 bg-amber-900 rounded-full border-4 border-amber-950 flex items-center justify-center relative shadow-xl mb-4 overflow-hidden">
      <div className="flex flex-col items-center">
        <div className="flex gap-2 mb-1">
          <div className="w-3 h-3 bg-black rounded-full" />
          <div className="w-3 h-3 bg-black rounded-full" />
        </div>
        <div className="w-6 h-3 border-b-2 border-white rounded-full" />
      </div>
    </div>
    <h3 className="text-lg font-black text-amber-900 uppercase italic leading-tight">{message}</h3>
  </div>
);

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');
  const [saveNotify, setSaveNotify] = useState<{show: boolean, msg: string}>({show: false, msg: ''});
  
  // Lógica de Carregamento Ultra-Resiliente
  const loadData = (key: string, patterns: string[], def: any) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);

      // Migração de chaves antigas
      for (const lKey of LEGACY_KEYS) {
        if (patterns.some(p => lKey.toLowerCase().includes(p))) {
          const legacyData = localStorage.getItem(lKey);
          if (legacyData) {
            console.log(`Migrando de ${lKey} para ${key}`);
            localStorage.setItem(key, legacyData);
            return JSON.parse(legacyData);
          }
        }
      }
      return def;
    } catch (e) {
      return def;
    }
  };

  const [products, setProducts] = useState<Product[]>(() => loadData(DB_KEYS.PRODUCTS, ['inventory', 'product'], []));
  const [clients, setClients] = useState<Client[]>(() => loadData(DB_KEYS.CLIENTS, ['customer', 'client'], []));
  const [salesHistory, setSalesHistory] = useState<Sale[]>(() => loadData(DB_KEYS.SALES, ['history', 'sale'], []));
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => loadData(DB_KEYS.PROFILE, ['profile', 'biz'], DEFAULT_PROFILE));
  
  const [productModal, setProductModal] = useState<{ type: ModalType; data?: Product }>({ type: ModalType.NONE });
  const [clientModal, setClientModal] = useState<{ type: ModalType; data?: Client }>({ type: ModalType.NONE });
  const [saleModal, setSaleModal] = useState<boolean>(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');

  // Persistência Automática com Verificação
  useEffect(() => {
    try {
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(clients));
      localStorage.setItem(DB_KEYS.SALES, JSON.stringify(salesHistory));
      localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(businessProfile));
    } catch (e) {
      console.error("Erro ao persistir dados", e);
    }
  }, [products, clients, salesHistory, businessProfile]);

  const triggerNotify = (msg: string = 'Dados Salvos!') => {
    setSaveNotify({show: true, msg});
    setTimeout(() => setSaveNotify({show: false, msg: ''}), 2000);
  };

  const handleSaveProduct = (data: Omit<Product, 'id'>) => {
    const updated = productModal.type === ModalType.EDIT && productModal.data
      ? products.map(p => p.id === productModal.data!.id ? { ...data, id: p.id } : p)
      : [{ ...data, id: `P-${Date.now()}` }, ...products];
    
    setProducts(updated);
    setProductModal({ type: ModalType.NONE });
    triggerNotify('Produto Salvo!');
  };

  const handleSaveClient = async (data: Omit<Client, 'id'>) => {
    const updated = clientModal.type === ModalType.EDIT && clientModal.data
      ? clients.map(c => c.id === clientModal.data!.id ? { ...data, id: c.id } : c)
      : [{ ...data, id: `C-${Date.now()}` }, ...clients];
    
    setClients(updated);
    setClientModal({ type: ModalType.NONE });
    triggerNotify('Cliente Salvo!');
  };

  const handleFinishSale = (data: { clientId: string, items: any[], total: number, paymentMethod: string, paymentTerms: string }) => {
    const client = clients.find(c => c.id === data.clientId);
    const cost = data.items.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);
    
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      clientId: data.clientId,
      clientName: client?.name || 'Venda Avulsa',
      items: data.items,
      total: data.total,
      profit: data.total - cost,
      paymentMethod: data.paymentMethod,
      paymentTerms: data.paymentTerms,
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setSalesHistory([newSale, ...salesHistory]);
    setProducts(products.map(p => {
      const sold = data.items.find(i => i.id === p.id);
      return sold ? { ...p, stock: Math.max(0, p.stock - sold.quantity) } : p;
    }));
    setSaleModal(false);
    triggerNotify('Venda Realizada!');
  };

  const exportBackup = () => {
    const data = { products, clients, salesHistory, businessProfile };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DOCEBOM_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    triggerNotify('Backup Criado!');
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.products) setProducts(data.products);
        if (data.clients) setClients(data.clients);
        if (data.salesHistory) setSalesHistory(data.salesHistory);
        if (data.businessProfile) setBusinessProfile(data.businessProfile);
        triggerNotify('Dados Importados!');
      } catch (err) {
        alert("Arquivo de backup inválido.");
      }
    };
    reader.readAsText(file);
  };

  const Header = ({ title, showBack = false, rightAction }: { title: string, showBack?: boolean, rightAction?: React.ReactNode }) => (
    <header className="bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] text-white pt-10 pb-12 px-6 shadow-xl rounded-b-[3.5rem] sticky top-0 z-40 relative overflow-hidden border-b-4 border-yellow-400">
      <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 pointer-events-none">
        <Palmtree size={120} />
      </div>
      <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-yellow-400 rounded-full opacity-20 blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {showBack ? (
            <button onClick={() => setCurrentScreen('HOME')} className="bg-white/20 p-2.5 rounded-2xl active:scale-90 transition-all">
              <ArrowLeft size={22} />
            </button>
          ) : (
            <div onClick={() => setCurrentScreen('SETTINGS')} className="w-12 h-12 bg-white rounded-2xl p-1 shadow-lg cursor-pointer border-2 border-yellow-400 flex items-center justify-center">
               <span className="text-[#0ea5e9] font-black text-lg italic leading-none">DB</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none truncate drop-shadow-sm">
              {currentScreen === 'SETTINGS' ? 'Meu Perfil' : title}
            </h1>
            {!showBack && <p className="text-yellow-300 text-[8px] font-black uppercase tracking-[0.2em] mt-1">Sabor da Ilha</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {!showBack && (
            <button onClick={() => setCurrentScreen('SETTINGS')} className="p-2.5 bg-white/20 rounded-2xl border border-white/10 active:scale-90">
              <SettingsIcon size={20} />
            </button>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen pb-32 bg-[#fffbeb]">
      {saveNotify.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 duration-300 font-black uppercase italic text-[10px] border-2 border-white">
          <CheckCircle2 size={16} /> {saveNotify.msg}
        </div>
      )}

      {currentScreen === 'HOME' && (
        <>
          <Header title={businessProfile.companyName} />
          <main className="px-6 -mt-6 relative z-30 space-y-5 pt-1">
            
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white p-5 rounded-[2.2rem] shadow-lg border-b-4 border-[#0ea5e9]/10 flex flex-col justify-between h-32 active:scale-95 transition-all">
                  <div className="bg-[#0ea5e9] w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"><Wallet size={20}/></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vendas</p>
                    <h4 className="text-lg font-black text-[#0ea5e9]">R$ {salesHistory.reduce((a,b)=>a+b.total,0).toFixed(2)}</h4>
                  </div>
               </div>
               <div className="bg-white p-5 rounded-[2.2rem] shadow-lg border-b-4 border-green-200/50 flex flex-col justify-between h-32 active:scale-95 transition-all">
                  <div className="bg-green-500 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"><TrendingUp size={20}/></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lucro</p>
                    <h4 className="text-lg font-black text-green-600">R$ {salesHistory.reduce((a,b)=>a+(b.profit||0),0).toFixed(2)}</h4>
                  </div>
               </div>
            </div>

            <button 
              onClick={() => setSaleModal(true)} 
              className="w-full bg-yellow-400 text-[#1e293b] p-6 rounded-[2.8rem] shadow-xl shadow-yellow-200/50 flex items-center justify-between group active:scale-[0.96] transition-all border-b-8 border-yellow-600"
            >
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-yellow-500 shadow-inner">
                    <Plus size={30} strokeWidth={4} />
                 </div>
                 <div className="text-left">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">Nova Venda</h3>
                    <p className="text-amber-900/60 text-[8px] font-black uppercase mt-1">Registrar Pedido</p>
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
                  <p className="font-black text-slate-800 uppercase text-[9px] tracking-widest">Estoque ({products.length})</p>
               </button>
               <button onClick={() => setCurrentScreen('MONTHLY_SALES')} className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-50 flex flex-col items-center gap-2 active:scale-95 transition-all group">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all"><ClipboardList size={28} /></div>
                  <p className="font-black text-slate-800 uppercase text-[9px] tracking-widest">Histórico</p>
               </button>
               <button onClick={() => setCurrentScreen('REPORTS')} className="bg-[#1e293b] p-6 rounded-[2.5rem] shadow-md border-b-4 border-black flex flex-col items-center gap-2 active:scale-95 transition-all group text-white">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black transition-all"><Sparkles size={28} /></div>
                  <p className="font-black uppercase text-[9px] tracking-widest">IA Insights</p>
               </button>
            </div>
            
            {/* Status de Armazenamento */}
            <div className="bg-white/50 border border-slate-200 rounded-3xl p-4 flex items-center gap-3 justify-center">
               <Database size={14} className="text-slate-400" />
               <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Dados Sincronizados Localmente</span>
            </div>
          </main>
        </>
      )}

      {/* Telas Secundárias */}
      {currentScreen === 'CLIENTS' && (
        <div className="min-h-screen">
          <Header title="Clientes" showBack rightAction={<button onClick={() => setClientModal({ type: ModalType.ADD })} className="bg-white/20 p-2.5 rounded-2xl"><Plus size={22} /></button>} />
          <div className="px-6 py-8 space-y-3">
            {clients.length === 0 ? <CocoMascot message="Nenhum cliente?" /> : (
              clients.map(c => (
                <div key={c.id} onClick={() => setClientModal({ type: ModalType.EDIT, data: c })} className="bg-white p-4 rounded-[2rem] shadow-md border-b-4 border-slate-100 flex items-center justify-between active:scale-95 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 font-black text-xl border border-sky-100 shadow-inner group-hover:bg-sky-500 group-hover:text-white transition-all">
                        {c.name.charAt(0)}
                     </div>
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
          <Header title="Meu Estoque" showBack rightAction={<button onClick={() => setProductModal({ type: ModalType.ADD })} className="bg-white/20 p-2.5 rounded-2xl"><Plus size={22} /></button>} />
          <div className="px-6 py-8 space-y-4">
             {products.length === 0 ? <CocoMascot message="Estoque Vazio!" /> : (
               products.map(p => (
                 <div key={p.id} onClick={() => setProductModal({ type: ModalType.EDIT, data: p })} className="bg-white p-4 rounded-[2.5rem] shadow-lg flex items-center gap-4 active:scale-95 transition-all cursor-pointer border-b-4 border-slate-100 hover:border-red-200 group">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center overflow-hidden border border-red-50 flex-shrink-0 shadow-inner group-hover:bg-red-100">
                       {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package className="text-red-200" size={32} />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase mb-1 inline-block">QTD: {p.stock}</span>
                       <h3 className="font-black text-slate-800 text-base truncate mb-0.5 uppercase italic leading-none">{p.name}</h3>
                       <p className="text-xl font-black text-[#0ea5e9]">R$ {p.price.toFixed(2)}</p>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {currentScreen === 'SETTINGS' && (
        <div className="min-h-screen">
          <Header title="Configurações" showBack />
          <SettingsForm profile={businessProfile} onSave={(newProfile) => {
            setBusinessProfile(newProfile);
            triggerNotify('Perfil Atualizado!');
          }} />
          
          {/* Sessão de Backup Adicional */}
          <div className="px-6 pb-20 space-y-4">
             <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Database size={14}/> Gestão de Dados</h3>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={exportBackup} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all text-slate-600 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100">
                      <Download size={24} />
                      <span className="text-[9px] font-black uppercase">Exportar</span>
                   </button>
                   <label className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all text-slate-600 cursor-pointer hover:bg-green-50 hover:text-green-600 hover:border-green-100">
                      <Upload size={24} />
                      <span className="text-[9px] font-black uppercase">Importar</span>
                      <input type="file" accept=".json" className="hidden" onChange={importBackup} />
                   </label>
                </div>
                <p className="text-[8px] text-slate-400 mt-4 leading-tight text-center uppercase font-bold">* Use o backup se for trocar de celular ou navegador.</p>
             </div>
          </div>
        </div>
      )}

      {/* Modais */}
      <ProductModal isOpen={productModal.type !== ModalType.NONE} onClose={() => setProductModal({ type: ModalType.NONE })} onSave={handleSaveProduct} initialData={productModal.data} />
      <ClientForm isOpen={clientModal.type !== ModalType.NONE} onClose={() => setClientModal({ type: ModalType.NONE })} onSave={handleSaveClient} initialData={clientModal.data} />
      <NewSaleModal isOpen={saleModal} onClose={() => setSaleModal(false)} products={products} clients={clients} onFinishSale={handleFinishSale} />
      <SaleDetailModal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} sale={selectedSale} profile={businessProfile} clients={clients} />

      {currentScreen === 'MONTHLY_SALES' && (
        <div className="min-h-screen">
          <Header title="Vendas" showBack />
          <div className="px-6 py-8 space-y-3">
            {salesHistory.length === 0 ? <CocoMascot message="Sem vendas!" /> : (
              salesHistory.map(sale => (
                <div key={sale.id} onClick={() => setSelectedSale(sale)} className="bg-white p-5 rounded-[2.2rem] shadow-md border-b-6 border-slate-50 flex items-center justify-between active:scale-95 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:rotate-12 transition-transform">
                         <ShoppingBag size={24} />
                      </div>
                      <div className="min-w-0">
                         <h4 className="font-black text-slate-800 text-sm uppercase italic leading-tight truncate">{sale.clientName}</h4>
                         <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">{sale.date} • {sale.time}</p>
                      </div>
                   </div>
                   <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black text-[#0ea5e9]">R$ {sale.total.toFixed(2)}</p>
                      <p className="text-[8px] font-black text-yellow-500 italic uppercase">#{sale.id}</p>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {currentScreen === 'REPORTS' && (
        <div className="min-h-screen">
          <Header title="Estratégia IA" showBack />
          <div className="p-6">
             <div className="bg-white rounded-[3.5rem] p-8 shadow-xl border-b-[10px] border-sky-100">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center text-blue-900 shadow-md rotate-3"><Sparkles size={28} /></div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Análise</h3>
                      <p className="text-[8px] font-black text-sky-500 uppercase tracking-widest mt-1">Inteligência Doce Bom</p>
                   </div>
                </div>
                
                <div className="bg-slate-50 rounded-[2rem] p-6 text-sm leading-relaxed font-bold text-slate-600 border border-slate-100 shadow-inner min-h-[220px] flex flex-col justify-center">
                  {loadingReport ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                       <Loader2 className="animate-spin text-sky-500" size={32} />
                       <span className="font-black uppercase tracking-widest text-[10px] text-slate-400 italic">Consultando a IA...</span>
                    </div>
                  ) : (
                    <div className="prose prose-sm font-bold text-slate-600 whitespace-pre-wrap">
                      {aiReport || "Toque abaixo para analisar o desempenho da sua distribuição de cocadas."}
                    </div>
                  )}
                </div>
                
                {!aiReport && !loadingReport && (
                  <button onClick={async () => {
                    setLoadingReport(true);
                    const rData = salesHistory.length > 0 ? 
                      [{ name: 'Atual', revenue: salesHistory.reduce((a,b)=>a+b.total,0), profit: salesHistory.reduce((a,b)=>a+(b.profit||0),0), sales: salesHistory.length }] :
                      [{ name: 'Base', revenue: 0, profit: 0, sales: 0 }];
                    const rep = await generatePerformanceReport(rData);
                    setAiReport(rep);
                    setLoadingReport(false);
                  }} className="mt-8 w-full bg-[#0ea5e9] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-lg shadow-sky-200 active:scale-95 transition-all border-b-6 border-sky-800 italic">
                    Gerar Análise
                  </button>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
