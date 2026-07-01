
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Building2, 
  Smartphone, 
  Mail, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Shield,
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
  onManageSubscription?: () => void;
  showBilling?: boolean;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ profile, onSave, onLogout, onManageSubscription, showBilling = true }) => {
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
    <form id="settings-form" onSubmit={handleSubmit} className="p-1 sm:p-2 space-y-2 pb-20">
      
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-2.5 py-1 border-b border-gray-100 flex items-center gap-2">
          <Building2 size={13} className="text-blue-600" />
          <h3 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider">Dados da Empresa</h3>
        </div>
        <div className="p-2.5 space-y-1.5">
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">
              Nome Fantasia / Razão Social <span className="text-red-500">*</span>
            </label>
            <input 
              className={`w-full mt-0 px-3 py-1 bg-gray-50 border rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs text-gray-800 ${!formData.companyName || formData.companyName === 'MINHA EMPRESA' ? 'border-red-200' : 'border-gray-200'}`}
              value={formData.companyName || ''}
              onChange={e => setFormData({...formData, companyName: e.target.value})}
              placeholder="Ex: Minha Loja de Doces"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">CNPJ / CPF</label>
            <input 
              className="w-full mt-0 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all text-xs font-semibold"
              value={formData.document || ''}
              onChange={e => setFormData({...formData, document: e.target.value})}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">Segmentos ou Categorias de Produtos</label>
            <select 
              className="w-full mt-0 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all font-bold text-xs text-slate-700 appearance-none"
              value={formData.businessType || 'GERAL'}
              onChange={e => setFormData({...formData, businessType: e.target.value as any})}
            >
              <option value="GERAL">Geral / Multivendas</option>
              <option value="COCORA">Cocada (Distribuição)</option>
              <option value="ACAI">Açaí (Vendas e Adicionais)</option>
              <option value="COSMETIC_PERFUME">Cosméticos e Perfumaria</option>
              <option value="CLEANING_PRODUCTS">Produtos de Limpeza</option>
              <option value="FOOD_DISTRIBUTION">Distribuição Alimentícia</option>
              <option value="FASHION_APPAREL">Moda / Vestuário & Acessórios</option>
              <option value="FOOTWEAR">Calçados e Bolsas</option>
              <option value="ELECTRONICS_TECH">Eletrônicos e Tecnologia</option>
              <option value="TOYS_GIFTS">Brinquedos, Papelaria e Presentes</option>
              <option value="AUTO_PARTS">Autopeças, Mecânica e Moto</option>
              <option value="PET_SHOP">Pet Shop e Agropecuária</option>
              <option value="CONSTRUCTION">Material de Construção & Decoração</option>
              <option value="PHARMACY_WELLNESS">Farmácia, Suplementos e Bem-estar</option>
              <option value="JEWELRY_ACCESSORIES">Joalheria, Semijoias e Relógios</option>
              <option value="CRAFTS_ART">Artesanato, Costura e Pintura</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact & Address */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-2.5 py-1 border-b border-gray-100 flex items-center gap-2">
          <Smartphone size={13} className="text-green-600" />
          <h3 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider">Contato e Localização</h3>
        </div>
        <div className="p-2.5 space-y-1.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">
                WhatsApp <span className="text-red-500">*</span>
              </label>
              <input 
                className={`w-full mt-0 px-3 py-1 bg-gray-50 border rounded-lg focus:border-blue-500 outline-none text-xs font-semibold ${!formData.phone ? 'border-red-200' : 'border-gray-200'}`}
                value={formData.phone || ''}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">E-mail</label>
              <input 
                className="w-full mt-0 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-xs font-semibold"
                value={formData.email || ''}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">Endereço Completo</label>
            <textarea 
              rows={1}
              className="w-full mt-0 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none resize-none text-xs font-semibold min-h-[32px] sm:min-h-[36px]"
              value={formData.address || ''}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Payment Keys */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-2.5 py-1 border-b border-gray-100 flex items-center gap-2">
          <CreditCard size={13} className="text-purple-600" />
          <h3 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider">Cobrança e Recebimento</h3>
        </div>
        <div className="p-2.5">
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">Chave Pix (Para Comprovantes)</label>
            <input 
              className="w-full mt-0 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none font-mono text-xs font-semibold"
              value={formData.pixKey || ''}
              onChange={e => setFormData({...formData, pixKey: e.target.value})}
              placeholder="CNPJ, E-mail ou Celular"
            />
          </div>
        </div>
      </div>

      {/* Plan Status Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-3 sm:p-4 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
        <Zap className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24" />
        <div className="relative z-10 space-y-2">
          
          <div className="flex justify-between items-center border-b border-white/10 pb-1">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase">
              Assinatura SaaS
            </span>
            <ShieldCheck size={16} className="text-blue-200" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-center">
            {/* Coluna 1: Nome do Plano e Botão de Upgrade */}
            <div className="space-y-1.5">
              <div>
                <h3 className="text-base font-black flex items-center gap-1.5 flex-wrap">
                  PLANO {(formData.planType || 'START').toUpperCase()}
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase ${
                    (formData.planStatus || 'ATIVO').toUpperCase() === 'ATIVO' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-amber-500 text-white animate-pulse'
                  }`}>
                    {formData.planStatus || 'ATIVO'}
                  </span>
                </h3>
                <p className="text-blue-100 text-[10px] opacity-85 font-semibold">
                  Próxima renovação: {formData.nextBilling && formData.nextBilling !== '-' ? formData.nextBilling : 'Vencimento não configurado'}
                </p>
              </div>

              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={onManageSubscription}
                  className="inline-flex items-center gap-1.5 bg-white text-indigo-700 hover:bg-slate-50 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all text-center cursor-pointer"
                >
                  <Zap size={10} className="fill-indigo-600 shrink-0" />
                  Solicitar Upgrade
                </button>
              </div>
            </div>

            {/* Coluna 2: Limites */}
            <div className="border-t md:border-t-0 md:border-l border-white/15 pt-2 md:pt-0 md:pl-4 space-y-1">
              <p className="text-[8px] uppercase font-black text-blue-200 tracking-wider">
                Limites do seu Plano:
              </p>
              <p className="text-[10px] font-bold text-white leading-snug">
                {(() => {
                  const t = (formData.planType || 'START').toUpperCase();
                  const saved = localStorage.getItem("omnivenda_plan_configs");
                  let plans: any = {
                    START: { maxProducts: 15, maxClients: 20, maxSellers: 2 },
                    PREMIUM: { maxProducts: 50, maxClients: 100, maxSellers: 5 },
                    ULTRA: { maxProducts: 200, maxClients: 300, maxSellers: 10 },
                    MASTER: { maxProducts: Infinity, maxClients: Infinity, maxSellers: Infinity },
                  };
                  if (saved) {
                    try { plans = JSON.parse(saved); } catch (e) {}
                  }
                  const planValue = plans[t] || plans.START;
                  const prodStr = planValue.maxProducts === Infinity || !isFinite(planValue.maxProducts) ? 'Ilimitados' : planValue.maxProducts;
                  const clientStr = planValue.maxClients === Infinity || !isFinite(planValue.maxClients) ? 'Ilimitados' : planValue.maxClients;
                  const sellerStr = planValue.maxSellers === Infinity || !isFinite(planValue.maxSellers) ? 'Ilimitados' : planValue.maxSellers;

                  if (t === 'MASTER') {
                    return '✓ Ilimitado: Produtos, Clientes e Vendedores • Suporte Dedicado';
                  }
                  return `✓ Limite atual de uso: ${prodStr} Produtos • ${clientStr} Clientes • ${sellerStr} Vendedores`;
                })()}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Identidade Visual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex items-center gap-2">
          <ImageIcon size={14} className="text-blue-600" />
          <h3 className="font-bold text-gray-800 text-[11px] sm:text-xs uppercase tracking-wider">Identidade Visual</h3>
        </div>
        <div className="p-3 space-y-2">
           <div className="flex flex-col items-center gap-4 md:flex-row">
              <div className="w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative shadow-inner group shrink-0">
                  {isLoadingLogo && !logoPreviewError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                      <Loader2 className="animate-spin text-blue-500" size={24} />
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
                        <span className="bg-white text-red-600 px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest">Remover Logo</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-300">
                      <ImageOff size={36} />
                      <span className="text-[10px] mt-1 font-black uppercase italic">Sem Logo</span>
                    </div>
                  )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">Subir Logo do Dispositivo</label>
                  <label className="relative cursor-pointer group">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <div className="flex items-center justify-center gap-2 w-full py-1.5 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg text-blue-600 font-black text-[9px] uppercase tracking-widest group-hover:bg-blue-100 group-hover:border-blue-300 transition-all">
                      {isUploading ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : (
                        <Upload size={12} />
                      )}
                      {isUploading ? 'SUBINDO...' : 'ESCOLHER ARQUIVO'}
                    </div>
                  </label>
                </div>

                <div className="relative flex items-center gap-2 py-1">
                  <div className="h-[1px] bg-gray-100 flex-1"></div>
                  <span className="text-[8px] font-black text-gray-300 uppercase">Ou use um link</span>
                  <div className="h-[1px] bg-gray-100 flex-1"></div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">URL da Logo (Google Drive ou Direto)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-2 text-gray-400" size={12} />
                    <input 
                      className="w-full pl-8 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all text-xs font-mono"
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
                <p className="text-[9px] text-gray-400 leading-tight px-1 italic text-center md:text-left">
                  {"* No Drive: botão direito > Compartilhar > Qualquer pessoa com o link."}
                </p>
              </div>
           </div>
        </div>
      </div>

      {/* Assinatura & Cobrança */}
      {showBilling && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-sky-500" />
              <h3 className="font-bold text-gray-800 text-[11px] sm:text-xs uppercase tracking-wider">Assinatura & Cobrança</h3>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
              (formData.planStatus || "TESTE").toUpperCase() === "ATIVO"
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse"
                : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}>
              {(formData.planStatus || "TESTE").toUpperCase() === "ATIVO" ? "Assinatura Ativa" : "Período de Testes"}
            </span>
          </div>
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Plano do SaaS</p>
                <p className="text-xs font-black text-slate-700 uppercase mt-0.5">Essential (R$ 19,90)</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Vencimento</p>
                <p className="text-xs font-black text-slate-700 uppercase mt-0.5">
                  {formData.nextBilling && formData.nextBilling !== "-" ? formData.nextBilling : "Expirado"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onManageSubscription}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl shadow-md text-xs font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95"
            >
              <Zap size={14} className="animate-pulse" />
              {(formData.planStatus || "TESTE").toUpperCase() === "ATIVO" ? "Estender Assinatura (R$ 19,90)" : "Ativar Assinatura (R$ 19,90)"}
            </button>
          </div>
        </div>
      )}

      {/* Segurança e Privacidade / Exclusão de Conta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex items-center gap-2">
          <ShieldCheck size={14} className="text-red-500" />
          <h3 className="font-bold text-gray-800 text-[11px] sm:text-xs uppercase tracking-wider">Segurança & Privacidade</h3>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex gap-2 text-gray-500 text-xs">
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-700">De acordo com a LGPD e as diretrizes do Google Play:</p>
              <p className="text-slate-500 text-[10px] leading-snug">
                Você pode visualizar a nossa política de privacidade ou solicitar a exclusão de sua conta, de seu perfil de distribuidora e de todos os dados salvos a qualquer momento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/?page=politica-privacidade";
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest cursor-pointer transition-all"
          >
            <Shield size={14} className="text-blue-500" />
            Visualizar Política de Privacidade
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/?page=excluir-conta";
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 active:scale-95 text-red-650 rounded-xl border border-red-100 text-xs font-black uppercase tracking-widest cursor-pointer transition-all"
          >
            <ShieldCheck size={14} className="text-red-500" />
            Solicitar Exclusão da Conta e Dados
          </button>
        </div>
      </div>

      <button 
        type="submit"
        disabled={isSaving}
        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Save size={18} />
        )}
        {isSaving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES'}
      </button>

    </form>
  );
};

export default SettingsForm;
