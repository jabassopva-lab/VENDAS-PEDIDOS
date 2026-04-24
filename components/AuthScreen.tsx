
import React, { useState } from 'react';
import { supabase, isConfigured } from '../services/supabase';
import { Sun, Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn, Palmtree, Store, Cloud, DatabaseZap, Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (isTest?: boolean, testName?: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

    return identifier.includes('@') 
      ? identifier 
      : `${normalizedIdentifier}@omnivenda.com`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setError("Supabase não configurado. Use o 'Modo de Teste' abaixo.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const loginEmail = getLoginEmail();
    console.log("Iniciando processo de autenticação/recuperação para:", loginEmail);

    try {
      if (isForgotPassword) {
        console.log("Tentando resetPasswordForEmail para:", loginEmail);
        const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        setSuccessMsg(`Link de recuperação enviado para: ${loginEmail}. Verifique sua caixa de entrada e pasta de Spam.`);
        setIsForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email: loginEmail, 
          password,
          options: {
            data: { 
              company_name: identifier,
              username: identifier.toLowerCase().trim()
            }
          }
        });
        if (error) throw error;
        alert('Conta criada com sucesso! Você já pode acessar o sistema.');
      }
      if (!isForgotPassword) onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestMode = () => {
    onAuthSuccess(true, identifier || 'Empresa de Teste');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fffbeb] relative overflow-hidden">
      <div className="absolute -top-20 -right-20 text-yellow-200/50 rotate-12 opacity-50">
        <Palmtree size={300} />
      </div>
      <div className="absolute -bottom-20 -left-20 text-amber-200/50 -rotate-12 opacity-50">
        <Sun size={300} />
      </div>

      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-8 z-10 border-b-8 border-yellow-400">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-[#0ea5e9] rounded-3xl flex items-center justify-center text-white shadow-lg mb-4 transform -rotate-3 border-2 border-yellow-400">
            <Cloud size={40} strokeWidth={3} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">OmniVenda</h1>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">Gestão Cloud • SaaS Premium</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Store className="absolute left-4 top-4 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={isForgotPassword ? "Seu E-mail cadastrado" : "Nome da Empresa ou Usuário"} 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
            />
          </div>

          {isForgotPassword && !identifier.includes('@') && identifier.trim().length > 0 && (
            <p className="text-[10px] text-amber-600 font-bold px-2 italic">
              Aviso: Se você usa um nome de usuário, o e-mail será enviado para {identifier.toLowerCase().trim()}@omnivenda.com
            </p>
          )}

          {!isForgotPassword && (
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
              className="w-full bg-[#0ea5e9] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-blue-700"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                isForgotPassword ? <Mail size={20} /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)
              )}
              {isForgotPassword ? 'Enviar E-mail de Recuperação' : (isLogin ? 'Entrar no Sistema' : 'Cadastrar Empresa')}
            </button>

            {isLogin && !isForgotPassword && (
              <button 
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors py-2"
              >
                Esqueceu sua senha?
              </button>
            )}

            {isForgotPassword && (
              <button 
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors py-2"
              >
                Voltar para o login
              </button>
            )}

            {!isConfigured && !isForgotPassword && (
              <button 
                type="button"
                onClick={handleTestMode}
                className="w-full bg-white text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2 border-2 border-slate-100"
              >
                <DatabaseZap size={20} className="text-amber-500" />
                Acessar Modo de Teste
              </button>
            )}
          </div>
        </form>

        {!isForgotPassword && (
          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              {isLogin ? 'Nova empresa? Criar conta Cloud' : 'Já tem acesso? Fazer login'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-slate-400 max-w-xs">
         <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
           Sua distribuidora em qualquer lugar, a qualquer momento.
         </p>
      </div>
    </div>
  );
};

export default AuthScreen;
