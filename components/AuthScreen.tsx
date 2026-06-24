
import React, { useState } from 'react';
import { supabase, isConfigured } from '../services/supabase';
import { Sun, Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn, Palmtree, Store, Cloud, DatabaseZap, Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (isTest?: boolean, testName?: string) => void;
}

const translateAuthError = (message: string): string => {
  if (!message) return 'Erro ao autenticar. Verifique seus dados.';
  
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('invalid login credentials')) {
    return 'Credenciais de login inválidas. Verifique seu e-mail e senha.';
  }
  if (lowerMessage.includes('email not confirmed')) {
    return 'E-mail não confirmado. Por favor, confirme seu cadastro no link enviado para seu e-mail.';
  }
  if (lowerMessage.includes('user already registered')) {
    return 'Este e-mail já está cadastrado no sistema.';
  }
  if (lowerMessage.includes('password should be at least 6 characters')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (lowerMessage.includes('unable to validate email address') || lowerMessage.includes('invalid email')) {
    return 'E-mail em formato inválido. Use um e-mail válido (ex: seu_nome@dominio.com).';
  }
  if (lowerMessage.includes('email rate limit exceeded')) {
    return 'Muitas tentativas de envio por e-mail. Por favor, aguarde alguns minutos antes de tentar novamente.';
  }
  if (lowerMessage.includes('rate limit exceeded')) {
    return 'Limite de tentativas excedido. Por favor, tente novamente mais tarde.';
  }
  if (lowerMessage.includes('user not found')) {
    return 'Usuário não encontrado.';
  }
  if (lowerMessage.includes('expired_oauth_state')) {
    return 'O estado da sessão expirou. Tente novamente.';
  }
  if (lowerMessage.includes('token has expired') || lowerMessage.includes('token is invalid')) {
    return 'O link ou código de recuperação expirou ou é inválido.';
  }
  if (lowerMessage.includes('new password should be different')) {
    return 'A nova senha deve ser diferente da senha anterior.';
  }
  if (lowerMessage.includes('network error') || lowerMessage.includes('failed to fetch')) {
    return 'Erro de conexão com o servidor. Ao utilizar o navegador em aba privada ou ao faltar conexão com a internet, este erro pode ocorrer.';
  }

  return message;
};

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getLoginEmail = () => {
    const normalizedIdentifier = identifier
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/\s+/g, '.')            
      .replace(/[^a-z0-9._]/g, '');    

    if (identifier.includes('@')) return identifier;
    
    // No cadastro, se o usuário digitou um e-mail separado, esse será o e-mail da conta
    if (!isLogin && email.includes('@')) return email;

    return `${normalizedIdentifier}@omnivenda.com`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
      if (!identifier.trim()) {
        setError("Por favor, digite seu nome ou nome da empresa para testar.");
        return;
      }
      onAuthSuccess(true, identifier.trim());
      return;
    }

    if (!isConfigured) {
      setError("Supabase não configurado. Use o 'Acesso Demo' abaixo.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Na recuperação, enviamos para o que está no campo IDENTIFIER
    const targetEmail = isForgotPassword ? identifier : getLoginEmail();
    console.log("Iniciando processo para:", targetEmail);

    try {
      if (isForgotPassword) {
        if (!targetEmail.includes('@')) {
          throw new Error("Por favor, digite o seu E-mail Real completo para a recuperação.");
        }
        
        console.log("Tentando resetPasswordForEmail para:", targetEmail);
        const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        setSuccessMsg(`Link de recuperação enviado para: ${targetEmail}. Verifique sua caixa de entrada e Spam.`);
        setIsForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: targetEmail, password });
        if (error) throw error;
      } else {
        // CADASTRO
        if (!agreeTerms) {
          throw new Error("Você precisa aceitar os Termos de Uso para continuar.");
        }
        const signupEmail = email.includes('@') ? email : targetEmail;
        
        const { error } = await supabase.auth.signUp({ 
          email: signupEmail, 
          password,
          options: {
            data: { 
              company_name: identifier,
              username: identifier.toLowerCase().trim()
            }
          }
        });
        if (error) throw error;
        alert(`Conta criada com sucesso vinculada ao e-mail: ${signupEmail}. Você já pode acessar o sistema.`);
        setIsLogin(true);
      }
      if (!isForgotPassword && isLogin) onAuthSuccess();
    } catch (err: any) {
      setError(translateAuthError(err.message || 'Erro ao autenticar. Verifique seus dados.'));
    } finally {
      setLoading(false);
    }
  };

  const saasLogoUrl = typeof window !== 'undefined' ? (localStorage.getItem("omnivenda_saas_logo_url") || "") : "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fffbeb] relative overflow-hidden">
      <div className="absolute -top-20 -right-20 text-yellow-200/50 rotate-12 opacity-50">
        <Palmtree size={300} />
      </div>
      <div className="absolute -bottom-20 -left-20 text-amber-200/50 -rotate-12 opacity-50">
        <Sun size={300} />
      </div>

      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-8 z-10 border-b-8 border-yellow-400">
        <div className="flex flex-col items-center mb-6">
          {saasLogoUrl ? (
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center p-2 shadow-lg mb-4 transform -rotate-3 border-2 border-yellow-400 overflow-hidden shrink-0">
              <img src={saasLogoUrl} alt="SaaS Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-[#0ea5e9] rounded-3xl flex items-center justify-center text-white shadow-lg mb-4 transform -rotate-3 border-2 border-yellow-400">
              <Cloud size={40} strokeWidth={3} className="text-white" />
            </div>
          )}
          <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">OmniVenda</h1>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">Gestão Cloud • SaaS Premium</p>
        </div>

        {!isForgotPassword && (
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setIsDemoMode(false)}
              className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                !isDemoMode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LogIn size={14} /> Acesso Oficial
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDemoMode(true);
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                isDemoMode ? 'bg-amber-400 text-amber-950 shadow-sm animate-pulse' : 'text-amber-700 hover:text-amber-800'
              }`}
            >
              <DatabaseZap size={14} /> Modo Demo (Testadores)
            </button>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Store className="absolute left-4 top-4 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={
                isForgotPassword
                  ? "Seu E-mail Real de Recuperação"
                  : isDemoMode
                  ? "Seu Nome (Apenas para teste demo)"
                  : "Nome da Empresa ou Usuário"
              } 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          {!isDemoMode && !isLogin && !isForgotPassword && (
            <div className="relative animate-in slide-in-from-top-2">
              <Mail className="absolute left-4 top-4 text-slate-400" size={18} />
              <input 
                type="email" 
                placeholder="Seu E-mail Real (Para recuperação)" 
                className="w-full pl-12 pr-4 py-4 bg-blue-50 border border-blue-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold placeholder:text-blue-300"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {!isDemoMode && isForgotPassword && !identifier.includes('@') && identifier.trim().length > 0 && (
            <p className="text-[10px] text-amber-600 font-bold px-2 italic">
              Aviso: Se você usa um nome de usuário, o e-mail será enviado para {identifier.toLowerCase().trim()}@omnivenda.com
            </p>
          )}

          {!isDemoMode && !isForgotPassword && (
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Senha de acesso (mín. 6 caracteres)" 
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {!isDemoMode && !isLogin && !isForgotPassword && (
            <div className="flex items-start gap-3 px-2 py-2 animate-in fade-in slide-in-from-left-2">
              <input 
                type="checkbox" 
                id="agreeTerms"
                className="mt-1 w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
              />
              <label htmlFor="agreeTerms" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed cursor-pointer group">
                Eu li e concordo com os <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-500 hover:underline decoration-blue-300">Termos de Uso</button> e <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-500 hover:underline decoration-blue-300">Política de Privacidade</button> da OmniVenda.
              </label>
            </div>
          )}

          {isDemoMode && (
            <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-2xl text-[11px] font-medium text-amber-900 leading-relaxed animate-in fade-in">
              ⚡ <b>Acesso Rápido para Testadores:</b> Não exige senha ou e-mail. Basta digitar qualquer nome e clicar abaixo para abrir o app preenchido com dados de exemplo.
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase border border-red-100 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 text-green-600 p-4 rounded-xl text-[10px] font-black uppercase border border-green-100 animate-in fade-in slide-in-from-top-2">
              {successMsg}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 ${
                isDemoMode
                  ? 'bg-amber-500 hover:bg-amber-600 border-amber-700 shadow-amber-100 text-amber-950'
                  : 'bg-[#0ea5e9] hover:bg-blue-600 border-blue-700 shadow-blue-100'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                isForgotPassword ? <Mail size={20} /> : isDemoMode ? <DatabaseZap size={20} /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)
              )}
              {isForgotPassword
                ? 'Enviar E-mail de Recuperação'
                : isDemoMode
                ? 'Entrar no Modo Demo'
                : isLogin
                ? 'Entrar no Sistema'
                : 'Cadastrar Empresa'}
            </button>

            {!isDemoMode && isLogin && !isForgotPassword && (
              <button 
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors py-2"
              >
                Esqueceu sua senha?
              </button>
            )}

            {!isDemoMode && isForgotPassword && (
              <button 
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors py-2"
              >
                Voltar para o login
              </button>
            )}
          </div>
        </form>

        {!isForgotPassword && !isDemoMode && (
          <div className="mt-8 text-center border-t border-slate-100 pt-6 space-y-4">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors block w-full text-center"
            >
              {isLogin ? 'Nova empresa? Criar conta Cloud' : 'Já tem acesso? Fazer login'}
            </button>
            <button 
              type="button"
              onClick={() => {
                window.location.href = "/?page=excluir-conta";
              }}
              className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors block w-full text-center"
            >
              Exclusão de Conta / LGPD
            </button>
            <button 
              type="button"
              onClick={() => {
                window.location.href = "/?page=politica-privacidade";
              }}
              className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors block w-full text-center"
            >
              Política de Privacidade
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-slate-400 max-w-xs">
         <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
           Sua distribuidora em qualquer lugar, a qualquer momento.
         </p>
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in transition-all">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] border-b-8 border-blue-500 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Termos de Uso</h2>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">OmniVenda Cloud Service</p>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all active:scale-95"
              >
                ✕
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto text-slate-600 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <section className="space-y-3">
                <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">1. Aceitação dos Termos</h3>
                <p className="text-xs leading-relaxed font-medium">Ao acessar e utilizar o OmniVenda Cloud, você concorda em cumprir estes termos. O sistema é fornecido "como está" para facilitar a gestão comercial de distribuidoras e empresas de vendas.</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">2. Uso do Serviço</h3>
                <p className="text-xs leading-relaxed font-medium">O usuário é integralmente responsável pela veracidade dos dados inseridos, incluindo preços, estoques e informações de clientes. A OmniVenda não se responsabiliza por erros operacionais cometidos pelos usuários.</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">3. Privacidade e Dados</h3>
                <p className="text-xs leading-relaxed font-medium">Seus dados são armazenados de forma segura em infraestrutura cloud (Supabase/PostgreSQL). Não compartilhamos suas informações comerciais com terceiros. Você tem total controle sobre seus produtos, clientes e histórico de vendas.</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">4. Segurança da Conta</h3>
                <p className="text-xs leading-relaxed font-medium">Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta cloud.</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">5. Modificações</h3>
                <p className="text-xs leading-relaxed font-medium">Reservamo-nos o direito de atualizar estes termos e as funcionalidades do sistema para melhoria contínua da experiência do usuário.</p>
              </section>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => {
                  setAgreeTerms(true);
                  setShowTermsModal(false);
                }}
                className="bg-blue-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all border-b-4 border-blue-700 active:scale-95"
              >
                Aceito os Termos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthScreen;
