import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Minus, ShoppingCart, Check, User, Trash2, CreditCard, Calendar, Package } from 'lucide-react';
import { Product, Client, CartItem } from '../types';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  clients: Client[];
  onFinishSale: (saleData: { clientId: string, items: CartItem[], total: number, paymentMethod: string, paymentTerms: string }) => void;
}

const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose, products, clients, onFinishSale }) => {
  const [step, setStep] = useState<'SELECTION' | 'CART'>('SELECTION');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<string>('Dinheiro');
  // Changed from text string to date string (YYYY-MM-DD)
  const [dueDate, setDueDate] = useState<string>('');

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setStep('SELECTION');
      setCart([]);
      setSearchQuery('');
      setSelectedClientId('');
      setPaymentMethod('Dinheiro');
      setDueDate('');
    }
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.barcode?.includes(searchQuery)
    );
  }, [products, searchQuery]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleFinish = () => {
    if (!selectedClientId) {
      alert("Por favor, selecione um cliente.");
      return;
    }
    if (cart.length === 0) {
      alert("O carrinho está vazio.");
      return;
    }

    // Format Date from YYYY-MM-DD to DD/MM/YYYY for storage/display
    let formattedTerms = 'À vista';
    
    if (dueDate) {
      // Split ensures we don't have timezone issues
      const [year, month, day] = dueDate.split('-');
      formattedTerms = `${day}/${month}/${year}`;
    } else if (paymentMethod === 'Boleto / Prazo') {
        // If method is Boleto but no date selected, prompt user? 
        // For now, we leave as "À vista" or generic if not selected, but let's encourage selection.
    }

    onFinishSale({
      clientId: selectedClientId,
      items: cart,
      total: cartTotal,
      paymentMethod,
      paymentTerms: formattedTerms
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
      
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-md z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-blue-600" />
            Nova Venda
          </h2>
          <p className="text-xs text-gray-500">
            {step === 'SELECTION' ? 'Selecione produtos' : 'Pagamento e Revisão'}
          </p>
        </div>
        <button onClick={onClose} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 text-gray-600">
          <X size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
        
        {step === 'SELECTION' && (
          <>
            {/* Client Selector & Search */}
            <div className="p-4 bg-white border-b border-gray-100 space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <select 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-gray-700 appearance-none"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Selecione um Cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar produto por nome ou código..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredProducts.map(product => {
                const inCart = cart.find(c => c.id === product.id);
                return (
                  <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center active:scale-[0.99] transition-transform">
                    <div className="flex items-center gap-3">
                         {/* Thumbnail */}
                         <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Package size={16} className="text-gray-300" />
                            )}
                         </div>
                         
                         <div>
                            <h4 className="font-bold text-gray-800">{product.name}</h4>
                            <p className="text-sm text-gray-500">Estoque: {product.stock}</p>
                            <p className="font-bold text-blue-600 mt-1">R$ {product.price.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    {inCart ? (
                      <div className="flex items-center gap-3 bg-blue-50 px-2 py-1 rounded-lg">
                        <button onClick={() => updateQuantity(product.id, -1)} className="p-1 text-blue-700 hover:bg-blue-100 rounded">
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-blue-700 min-w-[20px] text-center">{inCart.quantity}</span>
                        <button onClick={() => updateQuantity(product.id, 1)} className="p-1 text-blue-700 hover:bg-blue-100 rounded">
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 'CART' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {/* Payment Details Section */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                 <CreditCard size={18} className="text-blue-600" />
                 Condições de Pagamento
               </h3>
               
               <div className="space-y-3">
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Forma de Pagamento</label>
                   <select 
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-gray-800"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                   >
                     <option value="Dinheiro">Dinheiro</option>
                     <option value="Pix">Pix</option>
                     <option value="Cartão de Crédito">Cartão de Crédito</option>
                     <option value="Cartão de Débito">Cartão de Débito</option>
                     <option value="Boleto / Prazo">Boleto / Prazo</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Data de Vencimento</label>
                   <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
                      <input 
                        type="date"
                        className="w-full pl-9 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-gray-800 placeholder-gray-400"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                   </div>
                   <p className="text-[10px] text-gray-400 mt-1 ml-1">Deixe em branco para "À vista"</p>
                 </div>
               </div>
             </div>

             {/* Cart Items List */}
             <div className="space-y-3">
              <h3 className="font-bold text-gray-800 px-1">Itens do Pedido</h3>
               {cart.length === 0 ? (
                 <div className="text-center text-gray-400 py-4">Carrinho vazio</div>
               ) : (
                 cart.map(item => (
                   <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                     <div>
                       <h4 className="font-bold text-gray-800">{item.name}</h4>
                       <p className="text-sm text-gray-500">
                          {item.quantity} x R$ {item.price.toFixed(2)}
                       </p>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-red-400 p-2 hover:bg-red-50 rounded-full">
                          <Trash2 size={18} />
                        </button>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}
      </div>

      {/* Footer / Cart Bar */}
      <div className="bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
            <p className="text-2xl font-bold text-gray-900">R$ {cartTotal.toFixed(2)}</p>
          </div>
          <div className="text-right">
             <p className="text-xs text-gray-500 uppercase font-bold">Itens</p>
             <p className="text-lg font-medium text-gray-700">{cartCount}</p>
          </div>
        </div>

        <div className="flex gap-3">
          {step === 'SELECTION' ? (
             <button 
              onClick={() => setStep('CART')} 
              className="flex-1 bg-gray-100 text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
              disabled={cart.length === 0}
            >
              Ver Carrinho ({cartCount})
            </button>
          ) : (
            <button 
              onClick={() => setStep('SELECTION')} 
              className="flex-1 bg-gray-100 text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Voltar
            </button>
          )}

          {step === 'CART' && (
             <button 
                onClick={handleFinish}
                className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 hover:brightness-105"
              >
                <Check size={20} /> Finalizar Venda
              </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default NewSaleModal;