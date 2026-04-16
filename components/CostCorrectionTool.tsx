
import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Product, Sale } from '../types';

interface CostCorrectionToolProps {
  products: Product[];
  salesHistory: Sale[];
  onUpdateSales: (productId: string, newCost: number) => Promise<void>;
}

const CostCorrectionTool: React.FC<CostCorrectionToolProps> = ({ products, salesHistory, onUpdateSales }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [newCost, setNewCost] = useState<number | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Calcula quantas vendas seriam afetadas
  const affectedSalesCount = salesHistory.filter(s => 
    s.items.some(item => item.id === selectedProductId)
  ).length;

  const handleUpdate = async () => {
    if (!selectedProductId || typeof newCost !== 'number') return;
    
    setIsProcessing(true);
    try {
      await onUpdateSales(selectedProductId, newCost);
      setSelectedProductId('');
      setNewCost('');
      setShowConfirm(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-md border-b-4 border-slate-100 overflow-hidden">
      <div className="bg-slate-800 p-5 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
          <Database size={20} />
        </div>
        <div>
          <h3 className="font-black text-xs uppercase italic tracking-tighter">Correção Retroativa de Custos</h3>
          <p className="text-amber-300 text-[7px] font-black uppercase tracking-widest">Ajuste de Lucro Histórico</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {!selectedProductId ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-xs font-bold"
                placeholder="Buscar produto..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {filteredProducts.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-[10px] text-slate-400">
                      {p.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-800 uppercase italic">{p.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Custo atual: R$ {p.costPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-blue-50 p-4 rounded-2xl flex items-center justify-between border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-500 shadow-sm">
                  {selectedProduct?.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-900 uppercase italic">{selectedProduct?.name}</p>
                  <p className="text-[8px] font-bold text-blue-600 uppercase italic">Ajustando custo para este item</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProductId('')}
                className="text-[8px] font-black text-blue-600 uppercase underline tracking-widest"
              >
                Trocar Produto
              </button>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Novo Preço de Custo (Unid)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">R$</div>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-lg font-black text-slate-800"
                  value={newCost}
                  onChange={e => setNewCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            {affectedSalesCount > 0 ? (
              <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-100 border-dashed">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                  <div>
                    <p className="text-amber-900 font-black text-[10px] uppercase italic">Atenção!</p>
                    <p className="text-amber-700 text-[9px] font-bold leading-tight mt-1 uppercase">
                      Esta alteração afetará **{affectedSalesCount} vendas** já realizadas. O lucro de cada uma será recalculado com base no novo custo de **R$ {Number(newCost || 0).toFixed(2)}**.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-slate-400 text-[9px] font-bold uppercase italic">Nenhuma venda encontrada para este produto até o momento.</p>
              </div>
            )}

            {!showConfirm ? (
              <button 
                disabled={newCost === '' || newCost < 0}
                onClick={() => setShowConfirm(true)}
                className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg border-b-4 border-slate-950 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
              >
                Atualizar Histórico
              </button>
            ) : (
              <div className="space-y-3">
                <button 
                  disabled={isProcessing}
                  onClick={handleUpdate}
                  className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg border-b-4 border-red-800 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {isProcessing ? 'PROCESSANDO...' : 'CONFIRMAR ALTERAÇÃO'}
                </button>
                <button 
                  disabled={isProcessing}
                  onClick={() => setShowConfirm(false)}
                  className="w-full bg-slate-100 text-slate-400 font-black py-3 rounded-2xl active:scale-95 transition-all text-[8px] uppercase tracking-widest"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CostCorrectionTool;
