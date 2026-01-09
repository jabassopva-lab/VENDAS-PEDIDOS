
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Camera, 
  Loader2, 
  Sparkles, 
  Package, 
  TrendingUp, 
  Tag, 
  Layers,
  Info
} from 'lucide-react';
import { Product } from '../types';
import { generateProductDescription } from '../services/geminiService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => void;
  initialData?: Product;
}

const CATEGORIES = ['Doces', 'Bebidas', 'Salgados', 'Mercearia', 'Limpeza', 'Outros'];
const UNITS = ['un', 'kg', 'pct', 'cx', 'lt'];

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('Doces');
  const [unit, setUnit] = useState('un');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setBarcode(initialData.barcode || '');
      setCostPrice(initialData.costPrice.toString());
      setSellPrice(initialData.price.toString());
      setSupplier(initialData.supplier || '');
      setStock(initialData.stock.toString());
      setDescription(initialData.description || '');
      setImageUrl(initialData.imageUrl || '');
      setCategory(initialData.category || 'Doces');
      setUnit(initialData.unit || 'un');
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setName('');
    setBarcode('');
    setCostPrice('');
    setSellPrice('');
    setSupplier('');
    setStock('');
    setDescription('');
    setImageUrl('');
    setCategory('Doces');
    setUnit('un');
  };

  const cost = parseFloat(costPrice) || 0;
  const sell = parseFloat(sellPrice) || 0;
  const profitValue = sell - cost;
  const marginPercent = sell > 0 ? ((profitValue / sell) * 100) : 0;

  const handleGenerateDescription = async () => {
    if (!name) return;
    setIsGenerating(true);
    try {
      const desc = await generateProductDescription(name, category, sell);
      setDescription(desc);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sellPrice) {
      alert("Preencha ao menos o nome e o preço de venda.");
      return;
    }
    onSave({
      name,
      barcode,
      costPrice: cost,
      price: sell,
      supplier,
      stock: parseInt(stock) || 0,
      description,
      category,
      unit,
      imageUrl
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-right duration-300">
      {/* SaaS Styled Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-full transition-all">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-800 leading-tight">
              {initialData ? 'Editar Produto' : 'Adicionar ao Catálogo'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gestão de Inventário</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
        >
          <Save size={18} />
          SALVAR
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6 pb-24">
          
          {/* Section: Visual & Name */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
            <div className="relative group self-center md:self-start">
              <div className="w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative transition-all group-hover:border-blue-300">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-300 flex flex-col items-center gap-1">
                    <Camera size={32} />
                    <span className="text-[10px] font-bold uppercase">Foto</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center cursor-pointer transition-all">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Camera size={24} className="text-white opacity-0 group-hover:opacity-100" />
                </label>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome do Produto</label>
                <div className="flex gap-2">
                  <input 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-gray-800"
                    placeholder="Ex: Coca-Cola 350ml"
                  />
                  <button 
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating || !name}
                    className="mt-1 bg-indigo-50 text-indigo-600 p-3 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-30"
                    title="IA Copywriting"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Categoria</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-medium appearance-none"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Unidade</label>
                  <select 
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-medium appearance-none"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Pricing & Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-green-600" />
                Financeiro
              </h3>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Preço de Custo</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-3.5 text-gray-400 font-bold text-sm">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Preço de Venda</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-3.5 text-blue-400 font-bold text-sm">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    value={sellPrice}
                    onChange={e => setSellPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-black text-blue-700 text-lg"
                    placeholder="0,00"
                  />
                </div>
              </div>
              
              {/* Profit Indicator */}
              <div className={`p-4 rounded-2xl flex justify-between items-center ${profitValue > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Lucro por {unit}</p>
                  <p className={`text-lg font-black ${profitValue > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    R$ {profitValue.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Margem</p>
                   <p className={`text-lg font-black ${marginPercent > 20 ? 'text-green-700' : 'text-orange-600'}`}>
                    {marginPercent.toFixed(1)}%
                   </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                <Layers size={18} className="text-blue-600" />
                Estoque & IDs
              </h3>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Quantidade em Estoque</label>
                <input 
                  type="number"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Código de Barras (EAN)</label>
                <div className="relative mt-1">
                  <input 
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-mono"
                    placeholder="7890000000000"
                  />
                  <Info size={14} className="absolute right-4 top-4 text-gray-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Extra Info */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Descrição Comercial (IA)</label>
              <textarea 
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm leading-relaxed text-gray-600 resize-none"
                placeholder="Uma breve descrição para atrair clientes..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Fornecedor Preferencial</label>
              <input 
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                placeholder="Ex: Distribuidora Central"
              />
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductModal;
