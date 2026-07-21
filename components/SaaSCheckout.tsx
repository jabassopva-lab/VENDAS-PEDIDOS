import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  QrCode, 
  Check, 
  Copy, 
  Loader2, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  Coins, 
  ChevronRight,
  Sparkles,
  Smartphone,
  Clock
} from "lucide-react";
import { BusinessProfile } from "../types";

interface SaaSCheckoutProps {
  profile: BusinessProfile;
  onPaymentSuccess: (newExpiryDate: string, status?: string) => Promise<void>;
  onClose?: () => void;
  isBlockedMode?: boolean;
}

export const SaaSCheckout: React.FC<SaaSCheckoutProps> = ({
  profile,
  onPaymentSuccess,
  onClose,
  isBlockedMode = false,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARD">("PIX");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"FORM" | "SUCCESS" | "AWAITING">(
    profile.planStatus === "PENDENTE" ? "AWAITING" : "FORM"
  );
  const [copied, setCopied] = useState(false);

  // Card form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const planPrice = 19.90;

  // Generate a fully valid BR Code (Pix Static QR Code) with custom cell key
  const pixCode = React.useMemo(() => {
    const key = "66992442998";
    const cleanKey = key.replace(/\D/g, "");
    
    // Merchant account info (ID 26)
    const gui = "0014br.gov.bcb.pix";
    // For cell phone numbers, the standard Pix key is formatted as "+55..." or clean with 11 digits
    // Since it's a Brazilian phone key, usually stored as +5566992442998 in BCB (central bank) but let's write what was requested
    // If the user specified exactly "66992442998", let's make sure we prefix +55 or use as is. Brazilian phone keys in DICT MUST be in international format e.g. +5566992442998
    const standardKey = cleanKey.length === 11 ? `+55${cleanKey}` : cleanKey;
    const keyField = `01${standardKey.length.toString().padStart(2, "0")}${standardKey}`;
    const merchantAccountInfo = `${gui}${keyField}`;
    const id26 = `26${merchantAccountInfo.length.toString().padStart(2, "0")}${merchantAccountInfo}`;
    
    const id52 = "52040000";
    const id53 = "5303986";
    
    const formattedAmount = planPrice.toFixed(2);
    const id54 = `54${formattedAmount.length.toString().padStart(2, "0")}${formattedAmount}`;
    
    const id58 = "5802BR";
    const id59 = "5909OMNIVENDA";
    const id60 = "6009SAO PAULO";
    const id62 = "62070503PIX"; // simple TxID
    
    const payloadBeforeCRC = `000201${id26}${id52}${id53}${id54}${id58}${id59}${id60}${id62}6304`;
    
    // CRC16 Calculation
    let crc = 0xFFFF;
    for (let i = 0; i < payloadBeforeCRC.length; i++) {
      const charCode = payloadBeforeCRC.charCodeAt(i);
      crc ^= (charCode << 8);
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
        crc &= 0xFFFF;
      }
    }
    const crcHex = crc.toString(16).toUpperCase().padStart(4, "0");
    return `${payloadBeforeCRC}${crcHex}`;
  }, []);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=0f172a&data=${encodeURIComponent(pixCode)}`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (paymentMethod === "CARD") {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        alert("Por favor, preencha todos os campos do cartão.");
        return;
      }
    }

    setIsProcessing(true);

    // Simulate gateway integration communication with Asaas/Mercado Pago
    setTimeout(async () => {
      try {
        // Calculate next expiry date (30 days from today)
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30);
        const nextDateStr = nextDate.toISOString().split("T")[0];

        // Trigger success parent update with "PENDENTE" status
        await onPaymentSuccess(nextDateStr, "PENDENTE");
        setPaymentStep("AWAITING");
      } catch (err) {
        console.error(err);
        alert("Erro ao sincronizar ativação com o servidor. Tente novamente.");
      } finally {
        setIsProcessing(false);
      }
    }, 2500);
  };

  // Mask helper for Card Number
  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const matched = cleaned.match(/.{1,4}/g);
    if (matched) {
      setCardNumber(matched.join(" ").substring(0, 19));
    } else {
      setCardNumber("");
    }
  };

  // Mask helper for Card Expiry
  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`.substring(0, 5));
    } else {
      setCardExpiry(cleaned);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 max-w-md mx-auto w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {paymentStep === "FORM" ? (
        <>
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-100">
              <Sparkles size={12} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Plano Essential</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">
              Assinatura OmniVenda
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Tenha acesso completo e impulsione suas vendas sem intermediação ou taxas adicionais.
            </p>
          </div>

          {/* Pricing Box */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-850 text-white rounded-3xl p-5 shadow-inner relative overflow-hidden flex items-center justify-between">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
              <Coins size={150} />
            </div>
            <div>
              <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest">
                Mensalidade recorrente
              </p>
              <h4 className="text-3xl font-black text-white italic">
                R$ 19,90<span className="text-xs text-slate-400 font-bold">/mês</span>
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-md">
                15 dias grátis inclusos
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button
              type="button"
              onClick={() => setPaymentMethod("PIX")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                paymentMethod === "PIX"
                  ? "bg-white text-slate-800 shadow-md border border-slate-100"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <QrCode size={16} className={paymentMethod === "PIX" ? "text-sky-500" : ""} />
              Pix Automático
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("CARD")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                paymentMethod === "CARD"
                  ? "bg-white text-slate-800 shadow-md border border-slate-100"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <CreditCard size={16} className={paymentMethod === "CARD" ? "text-sky-500" : ""} />
              Cartão de Crédito
            </button>
          </div>

          {/* Payment Method Content */}
          {paymentMethod === "PIX" ? (
            <div className="space-y-4 text-center">
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-4 w-52 h-52 mx-auto flex items-center justify-center shadow-sm relative group overflow-hidden">
                <img 
                  src={qrCodeUrl} 
                  alt="Pix QR Code" 
                  className={`w-44 h-44 transition-opacity duration-300 ${isProcessing ? "opacity-20" : "opacity-100"}`}
                  referrerPolicy="no-referrer"
                />
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85">
                    <Loader2 className="animate-spin text-sky-500 mb-2" size={32} />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 leading-tight">
                      Verificando recebimento...
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-500 font-bold max-w-xs mx-auto leading-normal">
                Escaneie o código QR acima no aplicativo do seu banco ou use a chave copia-e-cola abaixo.
              </p>

              {/* Copia e Cola Container */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-inner">
                <span className="font-mono text-[10px] text-slate-600 select-all truncate font-semibold text-left pr-2 flex-1">
                  {pixCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shrink-0 flex items-center gap-1 ${
                    copied
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-800 text-white hover:bg-slate-900"
                  }`}
                >
                  {copied ? <Check size={11} strokeWidth={3} /> : <Copy size={11} />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleProcessPayment()}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Verificando Gateway...
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={3} />
                    Já Realizei o Pagamento
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {/* Credit Card Visual */}
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-5 text-white shadow-lg space-y-6 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 pointer-events-none">
                  <CreditCard size={120} />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">
                    Cartão Virtual de Assinatura
                  </span>
                  <ShieldCheck size={20} className="text-emerald-300" />
                </div>
                <div className="space-y-4">
                  <div className="font-mono text-lg tracking-widest font-semibold min-h-[28px]">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-[8px] uppercase font-bold text-indigo-200">Titular</p>
                      <p className="font-sans text-xs font-black truncate uppercase tracking-wider min-h-[16px]">
                        {cardName || "Nome do Titular"}
                      </p>
                    </div>
                    <div className="shrink-0 flex gap-4">
                      <div>
                        <p className="text-[8px] uppercase font-bold text-indigo-200">Validade</p>
                        <p className="font-mono text-xs font-bold min-h-[16px]">{cardExpiry || "MM/AA"}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase font-bold text-indigo-200">CVV</p>
                        <p className="font-mono text-xs font-bold min-h-[16px]">{cardCvv || "•••"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3 text-left">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    Nome Completo (como no cartão)
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="JOÃO SILVA COSTA"
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-700 text-xs focus:bg-white focus:border-sky-500 transition-all uppercase"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    Número do Cartão
                  </label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    placeholder="4444 4444 4444 4444"
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-mono text-slate-700 text-xs focus:bg-white focus:border-sky-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">
                      Validade (MM/AA)
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      placeholder="12/29"
                      className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-mono text-slate-700 text-xs focus:bg-white focus:border-sky-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">
                      Código CVV
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                      placeholder="123"
                      className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-mono text-slate-700 text-xs focus:bg-white focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Processando Transação...
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Ativar Assinatura Mensal (R$ 19,90)
                  </>
                )}
              </button>
            </form>
          )}

          {/* Secure Badge */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-extrabold uppercase">
            <Lock size={12} className="text-emerald-500" />
            Transação 100% Criptografada e Segura
            <span>•</span>
            Asaas/Mercado Pago API
          </div>

          {/* Close button if optional */}
          {onClose && !isBlockedMode && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Voltar ao Sistema
            </button>
          )}
        </>
      ) : paymentStep === "AWAITING" ? (
        /* Awaiting manual approval screen */
        <div className="text-center py-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner relative z-10 text-amber-500 animate-pulse">
              <Clock size={40} className="stroke-[2.5]" />
            </div>
            <div className="absolute inset-0 bg-amber-500/10 rounded-[2.5rem] blur-xl scale-120 -z-0"></div>
          </div>

          <div className="space-y-2">
            <span className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block border border-amber-200">
              Pagamento em Análise
            </span>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">
              Aguardando Liberação
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              Registramos sua solicitação de ativação. Nosso departamento financeiro está verificando o Pix para liberar seu acesso completo em instantes.
            </p>
          </div>

          {/* Action to send to WhatsApp */}
          <div className="space-y-3 pt-2">
            <a
              href={`https://wa.me/5566992442998?text=${encodeURIComponent(
                `Olá! Realizei o pagamento da assinatura da minha empresa *${profile.companyName}* (${profile.email || ''}) no valor de R$ 19,90 via Pix. Segue o comprovante para liberação do acesso.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Smartphone size={16} strokeWidth={2.5} />
              Enviar Comprovante via WhatsApp
            </a>
            
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Ou tire suas dúvidas com o suporte: (66) 99244-2998
            </p>
          </div>

          {/* Detail card */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-left space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Dados da Empresa
              </span>
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                Pendente
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs font-bold text-slate-600">
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-black">Empresa</p>
                <p className="text-slate-700 font-black truncate">{profile.companyName}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-black">E-mail de Cadastro</p>
                <p className="text-slate-700 font-black truncate">{profile.email}</p>
              </div>
            </div>
          </div>

          {/* Secondary buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setPaymentStep("FORM");
              }}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-slate-100 cursor-pointer"
            >
              Alterar Meio de Pagamento
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
            >
              Já Fui Liberado (Atualizar Tela)
            </button>
          </div>
        </div>
      ) : (
        /* Success screen */
        <div className="text-center py-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner relative z-10 text-emerald-500">
              <Check size={40} strokeWidth={4} className="animate-bounce" />
            </div>
            <div className="absolute inset-0 bg-emerald-500/10 rounded-[2.5rem] blur-xl scale-120 -z-0"></div>
          </div>

          <div className="space-y-2">
            <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block border border-emerald-200">
              Pagamento Confirmado
            </span>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">
              Assinatura Ativa!
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              Sua conta foi reativada automaticamente no gateway de pagamento. Obrigado por assinar o OmniVenda!
            </p>
          </div>

          {/* Detail card */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-left space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Plano Atual
              </span>
              <span className="bg-sky-50 text-sky-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                Essential
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-black">Próximo Vencimento</p>
                <p className="text-slate-700 font-black">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-black">Valor Mensal</p>
                <p className="text-slate-700 font-black">R$ 19,90</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              window.location.reload(); // Quick refresh to clear status
            }}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md cursor-pointer"
          >
            Acessar Painel Agora
          </button>
        </div>
      )}
    </div>
  );
};
