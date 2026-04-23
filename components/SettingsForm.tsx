
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
  Loader2,
  CheckCircle2,
  Upload
} from 'lucide-react';
import { BusinessProfile } from '../types';
import { convertDriveLink } from '../App';
import { db } from '../services/supabase';

interface SettingsFormProps {
  profile: BusinessProfile;
  onSave: (profile: BusinessProfile) => Promise<void>;
  onLogout?: () => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ profile, onSave, onLogout }) => {
  const [formData, setFormData] = useState<BusinessProfile>(profile);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  useEffect(() => {
    setLogoPreviewError(false);
    if (formData.logoUrl) {
      setIsLoadingLogo(true);
    }
  }, [formData.logoUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de campos obrigatórios
    if (!formData.companyName || formData.companyName.trim() === '' || formData.companyName === 'MINHA EMPRESA') {
      alert("Por favor, preencha o Nome Fantasia / Razão Social da sua empresa.");
      return;
    }

    if (!formData.phone || formData.phone.trim() === '') {
      alert("Por favor, preencha o WhatsApp de contato da empresa.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (1MB é seguro para base64 no banco)
    if (file.size > 1024 * 1024) {
      alert("Arquivo muito grande! Máximo 1MB.");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const updatedProfile = { ...formData, logoUrl: base64String };
        setFormData(updatedProfile);
        setIsUploading(false);
        
        // Salva automaticamente para facilitar
        try {
          await onSave(updatedProfile);
        } catch (err) {
          console.error("Erro ao salvar logo:", err);
        }
      };
      reader.onerror = () => {
        alert("Erro ao ler arquivo.");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Erro no processamento:", error);
      alert("Erro ao processar imagem.");
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (window.confirm("Deseja remover a logo atual?")) {
      const updatedProfile = { ...formData, logoUrl: '' };
      setFormData(updatedProfile);
      await onSave(updatedProfile);
    }
  };

  const currentLogo = convertDriveLink(formData.logoUrl || '');

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-24">
      
      {/* Alerta de Cadastro Incompleto */}
      {(!formData.companyName || formData.companyName === 'MINHA EMPRESA' || !formData.phone) && (
        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-start gap-3 animate-pulse">
          <AlertCircle className="text-amber-600 shrink-0" size={20} />
          <div>
            <h4 className="text-amber-900 font-black text-[10px] uppercase tracking-widest">Cadastro Obrigatório</h4>
            <p className="text-amber-700 text-[9px] font-bold mt-1 leading-tight uppercase">
              Para liberar o acesso ao sistema, você precisa preencher o **Nome Fantasia** e o **WhatsApp** da sua empresa.
            </p>
            <button 
              type="button"
              onClick={() => {
                if (window.confirm("Deseja realmente sair do sistema?")) {
                  onLogout?.();
                }
              }}
              className="mt-3 bg-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      )}

      {/* Business Data */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Building2 size={18} className="text-blue-600" />
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Dados da Empresa</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
              Nome Fantasia / Razão Social <span className="text-red-500">*</span>
            </label>
            <input 
              className={`w-full mt-1 px-4 py-3 bg-gray-50 border rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-gray-800 ${!formData.companyName || formData.companyName === 'MINHA EMPRESA' ? 'border-red-200' : 'border-gray-200'}`}
              value={formData.companyName || ''}
              onChange={e => setFormData({...formData, companyName: e.target.value})}
              placeholder="Ex: Minha Loja de Doces"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">CNPJ / CPF</label>
            <input 
              className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
              value={formData.document || ''}
              onChange={e => setFormData({...formData, document: e.target.value})}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Segmento do SaaS</label>
            <select 
              className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-slate-700 appearance-none"
              value={formData.businessType || 'GERAL'}
              onChange={e => setFormData({...formData, businessType: e.target.value as any})}
            >
              <option value="GERAL">Geral / Multivendas</option>
              <option value="COCORA">Cocada (Distribuição)</option>
              <option value="ACAI">Açaí (Vendas e Adicionais)</option>
            </select>
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
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                WhatsApp <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full mt-1 px-4 py-3 bg-gray-50 border rounded-xl focus:border-blue-500 outline-none ${!formData.phone ? 'border-red-200' : 'border-gray-200'}`}
                value={formData.phone || ''}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">E-mail</label>
              <input 
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                value={formData.email || ''}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Endereço Completo</label>
            <textarea 
              rows={2}
              className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none"
              value={formData.address || ''}
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
              value={formData.pixKey || ''}
              onChange={e => setFormData({...formData, pixKey: e.target.value})}
              placeholder="CNPJ, E-mail ou Celular"
            />
          </div>
        </div>
      </div>

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
              <div className="w-48 h-48 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative shadow-inner group">
                  {isLoadingLogo && !logoPreviewError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                      <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                  )}
                  
                  {(formData.logoUrl && !logoPreviewError) ? (
                    <>
                      <img 
                        src={currentLogo} 
                        alt="Logo Preview" 
                        className="w-full h-full object-cover"
                        onLoad={() => setIsLoadingLogo(false)}
                        onError={() => {
                          setLogoPreviewError(true);
                          setIsLoadingLogo(false);
                        }}
                      />
                      <button 
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="bg-white text-red-600 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest">Remover Logo</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-300">
                      <ImageOff size={48} />
                      <span className="text-[10px] mt-2 font-black uppercase italic">Sem Logo</span>
                    </div>
                  )}
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Subir Logo do Dispositivo</label>
                  <label className="relative cursor-pointer group">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <div className="flex items-center justify-center gap-2 w-full py-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-black text-[10px] uppercase tracking-widest group-hover:bg-blue-100 group-hover:border-blue-300 transition-all">
                      {isUploading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Upload size={16} />
                      )}
                      {isUploading ? 'SUBINDO...' : 'ESCOLHER ARQUIVO'}
                    </div>
                  </label>
                </div>

                <div className="relative flex items-center gap-2 py-2">
                  <div className="h-[1px] bg-gray-100 flex-1"></div>
                  <span className="text-[8px] font-black text-gray-300 uppercase">Ou use um link</span>
                  <div className="h-[1px] bg-gray-100 flex-1"></div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">URL da Logo (Google Drive ou Direto)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <input 
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all text-xs font-mono"
                      value={formData.logoUrl || ''}
                      onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                      placeholder="Cole aqui o link de compartilhamento"
                    />
                  </div>
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
                  {"* No Drive: botão direito > Compartilhar > Qualquer pessoa com o link."}
                </p>
              </div>
           </div>
        </div>
      </div>

      <button 
        type="submit"
        disabled={isSaving}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <Save size={20} />
        )}
        {isSaving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES'}
      </button>

    </form>
  );
};

export default SettingsForm;
