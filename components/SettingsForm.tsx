
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Building2, 
  Smartphone, 
  Mail, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Zap,
  Image as ImageIcon,
  Link as LinkIcon,
  Package,
  AlertCircle,
  ImageOff,
  Loader2
} from 'lucide-react';
import { BusinessProfile } from '../types';
import { convertDriveLink } from '../App';

interface SettingsFormProps {
  profile: BusinessProfile;
  onSave: (profile: BusinessProfile) => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState<BusinessProfile>(profile);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);

  useEffect(() => {
    setLogoPreviewError(false);
    if (formData.logoUrl) {
      setIsLoadingLogo(true);
    }
  }, [formData.logoUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert('Configurações salvas com sucesso!');
  };

  const currentLogo = convertDriveLink(formData.logoUrl || '');

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-24">
      
      {/* Plan Status Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
        <Zap className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">Seu Plano</span>
            <ShieldCheck size={24} className="text-blue-200" />
          </div>
          <h3 className="text-2xl font-black mb-1">PLANO {formData.planStatus || 'PREMIUM'}</h3>
          <p className="text-blue-100 text-sm opacity-80">Próxima renovação: {formData.nextBilling || '15/10/2024'}</p>
        </div>
      </div>

      {/* Identidade Visual */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <ImageIcon size={18} className="text-blue-600" />
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Identidade Visual</h3>
        </div>
        <div className="p-5 space-y-4">
           <div className="flex flex-col items-center gap-6">
              <div className="w-48 h-48 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative shadow-inner">
                  {isLoadingLogo && !logoPreviewError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                      <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                  )}
                  
                  {(formData.logoUrl && !logoPreviewError) ? (
                    <img 
                      src={currentLogo} 
                      alt="Logo Preview" 
                      className="w-full h-full object-contain p-4"
                      onLoad={() => setIsLoadingLogo(false)}
                      onError={() => {
                        setLogoPreviewError(true);
                        setIsLoadingLogo(false);
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-300">
                      <ImageOff size={48} />
                      <span className="text-[10px] mt-2 font-black uppercase italic">Sem Logo</span>
                    </div>
                  )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">URL da Logo (Google Drive)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 text-gray-400" size={16} />
                  <input 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all text-xs font-mono"
                    value={formData.logoUrl}
                    onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                    placeholder="Cole aqui o link de compartilhamento"
                  />
                </div>
                {formData.logoUrl?.includes('drive.google.com') && !logoPreviewError && (
                  <div className="flex items-center gap-1.5 px-2">
                    <CheckCircle2 size={12} className="text-green-500" />
                    <span className="text-[9px] font-bold text-green-600 uppercase italic">Link do Drive Identificado</span>
                  </div>
                )}
                {logoPreviewError && formData.logoUrl && (
                  <div className="flex items-center gap-1.5 px-2">
                    <AlertCircle size={12} className="text-red-500" />
                    <span className="text-[9px] font-bold text-red-600 uppercase italic">Verifique o acesso do link</span>
                  </div>
                )}
                <p className="text-[9px] text-gray-400 leading-tight px-1 italic text-center md:text-left mt-2">
                  * No Drive: botão direito > Compartilhar > Qualquer pessoa com o link.
                </p>
              </div>
           </div>
        </div>
      </div>

      {/* Business Data */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Building2 size={18} className="text-blue-600" />
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Dados da Empresa</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome Fantasia / Razão Social</label>
            <input 
              className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-gray-800"
              value={formData.companyName}
              onChange={e => setFormData({...formData, companyName: e.target.value})}
              placeholder="Ex: Minha Loja de Doces"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">CNPJ / CPF</label>
            <input 
              className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
              value={formData.document}
              onChange={e => setFormData({...formData, document: e.target.value})}
              placeholder="00.000.000/0001-00"
            />
          </div>
        </div>
      </div>

      {/* Contact & Address */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Smartphone size={18} className="text-green-600" />
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Contato e Localização</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">WhatsApp</label>
              <input 
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">E-mail</label>
              <input 
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Endereço Completo</label>
            <textarea 
              rows={2}
              className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Payment Keys */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <CreditCard size={18} className="text-purple-600" />
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Cobrança e Recebimento</h3>
        </div>
        <div className="p-5">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Chave Pix (Para Comprovantes)</label>
            <input 
              className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-mono"
              value={formData.pixKey}
              onChange={e => setFormData({...formData, pixKey: e.target.value})}
              placeholder="CNPJ, E-mail ou Celular"
            />
          </div>
        </div>
      </div>

      <button 
        type="submit"
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <Save size={20} />
        SALVAR CONFIGURAÇÕES
      </button>

    </form>
  );
};

// Helper components missing from imports in lucide-react (simulated)
const CheckCircle2 = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);

export default SettingsForm;
