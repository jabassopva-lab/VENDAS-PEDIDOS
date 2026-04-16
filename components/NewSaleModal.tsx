
import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Plus, Minus, ShoppingCart, Check, User, Trash2, CreditCard, Calendar, Package, Layers, FileText, Truck, Banknote, Edit3, QrCode } from 'lucide-react';
import { Product, Client, CartItem, Sale } from '../types';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  clients: Client[];
  onFinishSale: (saleData: Partial<Sale>) => void;
  initialData?: Sale | null;
}

const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose, products, clients, onFinishSale, initialData }) => {
  const [step, setStep] = useState<'SELECTION' | 'CART'>('SELECTION');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<string>('Dinheiro');
  const [paymentType, setPaymentType] = useState<'A_VISTA' | 'PARCELADO'>('A_VISTA');
  const [installments, setInstallments] = useState<number>(1);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Status State
  const [isPaid, setIsPaid] = useState(true);
  const [isPendingDelivery, setIsPendingDelivery] = useState(false);
  const [isBudget, setIsBudget] = useState(false);

  const paymentMethods = [
    { id: 'Dinheiro', icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'Pix', icon: QrCode, color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: 'Boleto', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'Cartão', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setStep('SELECTION');
        setCart(initialData.items || []);
        setSearchQuery('');
        const client = clients.find(c => c.id === initialData.clientId);
        setClientSearchQuery(client?.name.toUpperCase() || '');
        setSelectedClientId(initialData.clientId);
        setPaymentMethod(initialData.paymentMethod || 'Dinheiro');
        setIsBudget(initialData.status === 'ORCAMENTO');
        setIsPaid(initialData.isPaid);
        setIsPendingDelivery(initialData.deliveryStatus === 'PENDENTE');
        setInstallments(initialData.installments || 1);
        setPaymentType(initialData.installments > 1 ? 'PARCELADO' : 'A_VISTA');
      } else {
        setStep('SELECTION');
        setCart([]);
        setSearchQuery('');
        setClientSearchQuery('');
        setSelectedClientId('');
        setPaymentMethod('Dinheiro');
        setPaymentType('A_VISTA');
        setInstallments(1);
        setDueDate(new Date().toISOString().split('T')[0]);
        setIsPaid(true);
        setIsPendingDelivery(false);
        setIsBudget(false);
      }
    }
  }, [isOpen, initialData]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.barcode?.includes(searchQuery)
    );
  }, [products, searchQuery]);

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return [];
    return clients.filter(c => 
      c.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
    );
  }, [clients, clientSearchQuery]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, useWholesale: false, discount: 0 }];
    });
  };

  const toggleWholesale = (productId: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newUseWholesale = !item.useWholesale;
        const product = products.find(p => p.id === productId);
        const newPrice = newUseWholesale && product?.wholesalePrice ? product.wholesalePrice : (product?.price || item.price);
        return { ...item, useWholesale: newUseWholesale, price: newPrice, discount: 0 };
      }
      return item;
    }));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, discount: Math.max(0, discount) };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + ((item.price - (item.discount || 0)) * item.quantity), 0);
  const cartCost = cart.reduce((acc, item) => acc + ((item.costPrice || 0) * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleFinish = (statusOverride?: 'ORCAMENTO' | 'FINALIZADA') => {
    if (!selectedClientId) {
      alert("Por favor, selecione um cliente.");
      return;
    }
    if (cart.length === 0) {
      alert("O carrinho está vazio.");
      return;
    }

    let formattedTerms = '';
    const [year, month, day] = dueDate.split('-');
    const dateStr = `${day}/${month}/${year}`;

    if (paymentType === 'A_VISTA') {
      formattedTerms = `À vista (${dateStr})`;
    } else {
      formattedTerms = `${installments}x (1ª em ${dateStr})`;
    }

    const finalStatus = statusOverride || (isBudget ? 'ORCAMENTO' : 'FINALIZADA');

    onFinishSale({
      id: initialData?.id,
      clientId: selectedClientId,
      items: cart,
      total: cartTotal,
      profit: cartTotal - cartCost,
      paymentMethod,
      paymentTerms: formattedTerms,
      installments: paymentType === 'PARCELADO' ? installments : 1,
      status: finalStatus,
      isPaid: finalStatus === 'ORCAMENTO' ? false : isPaid,
      deliveryStatus: isPendingDelivery ? 'PENDENTE' : 'ENTREGUE'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
      
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-md z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {initialData ? <Edit3 className="text-blue-600" /> : <ShoppingCart className="text-blue-600" />}
            {initialData ? 'Editar Pedido' : 'Nova Venda'}
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            {step === 'SELECTION' ? 'Ajuste os itens' : 'Confirmação e Status'}
          </p>
        </div>
        <button onClick={onClose} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
        {step === 'SELECTION' && (
          <>
            <div className="p-4 bg-white border-b border-gray-100 space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="-- Buscar ou Selecionar Cliente --"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-gray-700 font-bold italic uppercase"
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setIsClientDropdownOpen(true);
                    if (!e.target.value) setSelectedClientId('');
                  }}
                  onFocus={() => setIsClientDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsClientDropdownOpen(false), 200)}
                />
                {isClientDropdownOpen && clientSearchQuery && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-2xl z-50 max-h-60 overflow-y-auto">
                    {filteredClients.map(c => (
                      <div 
                        key={c.id} 
                        className="p-4 hover:bg-blue-50 cursor-pointer font-black text-slate-700 uppercase italic text-[10px] border-b last:border-0 border-slate-50 flex justify-between items-center"
                        onClick={() => {
                          setSelectedClientId(c.id);
                          setClientSearchQuery(c.name.toUpperCase());
                          setIsClientDropdownOpen(false);
                        }}
                      >
                        <span>{c.name.toUpperCase()}</span>
                        {selectedClientId === c.id && <Check size={14} className="text-blue-600" />}
                      </div>
                    ))}
                    {filteredClients.length === 0 && (
                      <div className="p-4 text-slate-400 text-xs font-black uppercase italic">Nenhum cliente encontrado</div>
                    )}
                  </div>
                )}
                {isClientDropdownOpen && !clientSearchQuery && clients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-2xl z-50 max-h-60 overflow-y-auto">
                    {clients.slice(0, 10).map(c => (
                      <div 
                        key={c.id} 
                        className="p-4 hover:bg-blue-50 cursor-pointer font-black text-slate-700 uppercase italic text-[10px] border-b last:border-0 border-slate-50 flex justify-between items-center"
                        onClick={() => {
                          setSelectedClientId(c.id);
                          setClientSearchQuery(c.name.toUpperCase());
                          setIsClientDropdownOpen(false);
                        }}
                      >
                        <span>{c.name.toUpperCase()}</span>
                        {selectedClientId === c.id && <Check size={14} className="text-blue-600" />}
                      </div>
                    ))}
                    <div className="p-2 text-center bg-slate-50 text-[8px] font-black text-slate-300 uppercase italic">Digite para filtrar mais...</div>
                  </div>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar produto por nome..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredProducts.map(product => {
                const inCart = cart.find(c => c.id === product.id);
                return (
                  <div key={product.id} className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center active:scale-[0.99] transition-transform">
                    <div className="flex items-center gap-2">
                         <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner">
                            {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package size={18} className="text-gray-300" />}
                         </div>
                         <div>
                            <h4 className="font-black text-slate-800 uppercase text-xs italic leading-tight">{product.name}</h4>
                          <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">Estoque: {product.stock}</p>
                          <p className="font-black text-blue-600 text-xs mt-0.5">R$ {product.price.toFixed(2)}</p>
                        </div>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-3 bg-blue-600 px-3 py-1.5 rounded-xl text-white shadow-md">
                        <button onClick={() => updateQuantity(product.id, -1)} className="p-1 hover:bg-white/20 rounded"><Minus size={16} strokeWidth={3} /></button>
                        <span className="font-black min-w-[20px] text-center">{inCart.quantity}</span>
                        <button onClick={() => updateQuantity(product.id, 1)} className="p-1 hover:bg-white/20 rounded"><Plus size={16} strokeWidth={3} /></button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(product)} className="bg-white text-blue-600 border-2 border-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Plus size={20} strokeWidth={3} /></button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 'CART' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             <div className="bg-white p-6 rounded-[2rem] shadow-md border-b-4 border-slate-100 space-y-5">
               
               {/* Método de Pagamento */}
               <div>
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Forma de Pagamento</label>
                 <div className="grid grid-cols-4 gap-2">
                   {paymentMethods.map((method) => {
                     const Icon = method.icon;
                     const isActive = paymentMethod === method.id;
                     return (
                       <button
                         key={method.id}
                         onClick={() => setPaymentMethod(method.id)}
                         className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${isActive ? `border-blue-500 ${method.bg}` : 'border-slate-50 bg-slate-50 opacity-60'}`}
                       >
                         <Icon size={20} className={isActive ? method.color : 'text-slate-400'} />
                         <span className={`text-[10px] font-black uppercase italic ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>{method.id}</span>
                       </button>
                     );
                   })}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3 mb-2">
                 <button 
                  onClick={() => setIsPaid(!isPaid)} 
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all font-black text-xs uppercase italic ${isPaid ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                 >
                   <Banknote size={16}/> {isPaid ? 'Valor Recebido' : 'A Receber'}
                 </button>
                 <button 
                  onClick={() => setIsPendingDelivery(!isPendingDelivery)} 
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all font-black text-xs uppercase italic ${isPendingDelivery ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                 >
                   <Truck size={16}/> {isPendingDelivery ? 'Entrega Pendente' : 'Entregue'}
                 </button>
               </div>

               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
                    <button onClick={() => setPaymentType('A_VISTA')} className={`py-2 rounded-xl font-black text-xs uppercase transition-all ${paymentType === 'A_VISTA' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>À Vista</button>
                    <button onClick={() => setPaymentType('PARCELADO')} className={`py-2 rounded-xl font-black text-xs uppercase transition-all ${paymentType === 'PARCELADO' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>Parcelado</button>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    {paymentType === 'PARCELADO' && (
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Parcelas</label>
                        <input type="number" min="2" max="12" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-slate-800 font-bold" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value) || 2)} />
                      </div>
                    )}
                    <div className={paymentType === 'A_VISTA' ? 'col-span-2' : ''}>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Vencimento / Recebimento</label>
                      <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-slate-800 font-bold" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                 </div>
               </div>
             </div>

             <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col gap-2 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center font-black text-blue-600 text-[10px] border border-blue-100">{item.quantity}x</div>
                         <h4 className="font-black text-slate-800 uppercase italic text-[10px] leading-tight">{item.name}</h4>
                      </div>
                      <span className="font-black text-slate-900 text-[11px] tabular-nums">R$ {((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 bg-red-50/50 p-2 rounded-xl border border-red-100 flex-1 group focus-within:border-red-300 transition-colors">
                        <span className="text-[8px] font-black text-red-400 uppercase ml-1 tracking-wider">Desc. Unit.</span>
                        <div className="flex items-center gap-1 flex-1 justify-end">
                          <span className="text-[10px] font-black text-red-300">R$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            className="w-16 bg-transparent outline-none text-[11px] font-black text-red-600 text-right placeholder:text-red-200"
                            value={item.discount || ''}
                            onChange={(e) => updateDiscount(item.id, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      {item.wholesalePrice && (
                        <button 
                          type="button"
                          onClick={() => toggleWholesale(item.id)}
                          className={`text-[9px] font-black px-3 py-2 rounded-xl border transition-all whitespace-nowrap active:scale-95 ${item.useWholesale ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'}`}
                        >
                          {item.useWholesale ? 'ATACADO ATIVO' : 'USAR ATACADO'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t-4 border-yellow-400 p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-3xl font-black text-blue-600 italic">R$ {cartTotal.toFixed(2)}</p>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd Itens</p>
             <p className="text-xl font-black text-slate-800 leading-none">{cartCount}</p>
          </div>
        </div>

        <div className="flex gap-3">
          {step === 'SELECTION' ? (
             <button onClick={() => setStep('CART')} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl uppercase text-xs italic" disabled={cart.length === 0}>Revisar Alterações</button>
          ) : (
            <>
              <button onClick={() => setStep('SELECTION')} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl uppercase text-xs italic">Voltar</button>
              <button onClick={() => handleFinish('ORCAMENTO')} className="flex-1 bg-amber-100 text-amber-700 font-black py-4 rounded-2xl uppercase text-xs italic flex items-center justify-center gap-1 border-2 border-amber-200"><FileText size={16}/> Orçamento</button>
              <button onClick={() => handleFinish('FINALIZADA')} className="flex-[1.5] bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 uppercase text-xs italic"><Check size={20} strokeWidth={4} /> {initialData ? 'Salvar Edição' : 'Finalizar'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewSaleModal;
