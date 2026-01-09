
import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, FileText, Loader2 } from 'lucide-react';
import { Client } from '../types';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id'>) => Promise<void>;
  initialData?: Client;
}

const ClientForm: React.FC<ClientFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    document: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        phone: initialData.phone,
        email: initialData.email || '',
        address: initialData.address || '',
        document: initialData.document || ''
      });
    } else {
      setFormData({ name: '', phone: '', email: '', address: '', document: '' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // O erro será tratado pelo alert no componente pai (App.tsx)
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="text-white/80" />
            {initialData ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                required
                disabled={isSaving}
                type="text"
                placeholder="Nome / Empresa"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-gray-700 disabled:opacity-50"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <Phone className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    required
                    disabled={isSaving}
                    type="tel"
                    placeholder="Telefone / WhatsApp"
                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-700 disabled:opacity-50"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="relative group">
                  <FileText className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    disabled={isSaving}
                    type="text"
                    placeholder="CPF / CNPJ"
                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-700 disabled:opacity-50"
                    value={formData.document}
                    onChange={e => setFormData({...formData, document: e.target.value})}
                  />
                </div>
            </div>

            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                disabled={isSaving}
                type="email"
                placeholder="Email (Opcional)"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-700 disabled:opacity-50"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="relative group">
              <MapPin className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <textarea
                disabled={isSaving}
                placeholder="Endereço Completo"
                rows={3}
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-700 resize-none disabled:opacity-50"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Salvando Cliente...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Salvar Cliente
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ClientForm;
