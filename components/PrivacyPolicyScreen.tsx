import React from "react";
import { Shield, Eye, Database, Trash2, Mail, ArrowLeft, ArrowRight, FileText, CheckCircle2 } from "lucide-react";

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Decorative Top Accent */}
      <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full" />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-md transform rotate-3">
              <Shield size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                OmniVenda
              </h1>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                Política de Privacidade
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            Voltar
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          {/* Cover/Intro Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-10">
              <Shield size={250} />
            </div>
            <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/30">
              Segurança e Transparência
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-4 uppercase tracking-tight">
              Sua Privacidade é Nossa Prioridade
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-2 leading-relaxed">
              Esta política estabelece de forma clara, simples e direta como o aplicativo 
              <strong> OmniVenda</strong> lida com seus dados, garantindo conformidade com a 
              <strong> Lei Geral de Proteção de Dados (LGPD)</strong> e as políticas do <strong>Google Play</strong>.
            </p>
            <div className="text-[10px] font-mono text-slate-400 mt-6 uppercase tracking-wider">
              Última atualização: 23 de Junho de 2026 | Desenvolvido por OmniVenda Cloud
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-8">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                <div className="text-blue-500"><Eye size={24} /></div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-700">Dados Protegidos</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Garantimos sigilo e criptografia em toda a transmissão.</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                <div className="text-green-500"><CheckCircle2 size={24} /></div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-700">Foco em Vendas</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Coletamos apenas dados essenciais para o funcionamento do app.</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                <div className="text-red-500"><Trash2 size={24} /></div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-700">Direito de Apagar</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Exclua sua conta e dados a qualquer momento pelo portal.</p>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-6 text-sm leading-relaxed text-slate-600">
              
              {/* 1. Coleta de Dados */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Database className="text-blue-500" size={18} />
                  <h3 className="font-black text-base uppercase tracking-tight">1. Quais dados são coletados?</h3>
                </div>
                <p>
                  Para disponibilizar as ferramentas de gerenciamento comercial e faturamento do <strong>OmniVenda</strong>, coletamos os seguintes tipos de informações:
                </p>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-2 text-[13px]">
                  <p><strong>• Informações de Cadastro (Conta):</strong> Endereço de e-mail e senha de login (criptografados) para identificação única do desenvolvedor ou usuário administrador.</p>
                  <p><strong>• Perfil da Empresa:</strong> Nome comercial (Razão Social/Fantasia), CNPJ/CPF, número de telefone, endereço físico comercial, chaves Pix para recebimento de pagamentos e link do logotipo da marca.</p>
                  <p><strong>• Catálogo de Produtos e Serviços:</strong> Nomes dos produtos cadastrados, preços de custo, preços de venda, estoque atualizado, código de barras, categorias e fornecedores.</p>
                  <p><strong>• Dados de Vendas e Transações:</strong> Histórico de vendas geradas (valor total, lucro, data, horário, método de pagamento, parcelas, status da entrega e status de pagamento).</p>
                  <p><strong>• Cadastro de Clientes:</strong> Nomes, telefones, e-mails, endereços e documentos fiscais dos clientes finais registrados por você para a emissão de orçamentos e vendas.</p>
                </div>
              </section>

              {/* 2. Uso dos Dados */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <FileText className="text-blue-500" size={18} />
                  <h3 className="font-black text-base uppercase tracking-tight">2. Como utilizamos os seus dados?</h3>
                </div>
                <p>
                  Os dados coletados são utilizados única e exclusivamente para a prestação dos serviços e funcionalidades do próprio aplicativo <strong>OmniVenda</strong>. Isso inclui:
                </p>
                <ul className="list-disc list-inside pl-2 space-y-1 text-[13px]">
                  <li>Autenticação segura de usuários e controle de acessos da sua equipe.</li>
                  <li>Sincronização em nuvem para que seus dados não sejam perdidos caso mude de aparelho.</li>
                  <li>Geração de relatórios de desempenho, gráficos de lucro e controle financeiro diário/mensal.</li>
                  <li>Facilitação no envio de recibos, orçamentos e mensagens rápidas para seus clientes via integração de sistema.</li>
                  <li>Gestão da assinatura ativa e do ciclo de faturamento da sua conta de lojista.</li>
                </ul>
              </section>

              {/* 3. Compartilhamento de Dados */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Eye className="text-blue-500" size={18} />
                  <h3 className="font-black text-base uppercase tracking-tight">3. Compartilhamento e Transferência</h3>
                </div>
                <p>
                  A <strong>OmniVenda Cloud</strong> não vende, não aluga e não compartilha dados de usuários ou de clientes com nenhuma empresa terceira ou parceiro comercial para fins publicitários.
                </p>
                <p>
                  Os dados de seu banco de dados são mantidos em servidores de nuvem altamente seguros e restritos, processados com o único propósito de manter o sistema online e disponível.
                </p>
              </section>

              {/* 4. Retenção e Exclusão de Dados */}
              <section className="bg-red-50/40 border border-red-100 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-red-800">
                  <Trash2 className="text-red-500" size={20} />
                  <h3 className="font-black text-base uppercase tracking-tight">4. Retenção e Exclusão Segura</h3>
                </div>
                <p className="text-red-950/80">
                  Em total conformidade com a <strong>LGPD</strong> brasileira e as exigências do <strong>Google Play Console</strong>, você possui total direito de controle sobre suas informações.
                </p>
                
                <div className="bg-white/80 rounded-2xl p-4 border border-red-100/50 space-y-3 text-[13px] text-slate-700">
                  <p>
                    <strong>• Solicitação Fácil e Rápida:</strong> A exclusão de sua conta e a total eliminação de seus dados podem ser solicitadas diretamente em nosso portal oficial de autoatendimento.
                  </p>
                  <p>
                    <strong>• Período de Armazenamento:</strong> Uma vez solicitada a exclusão automática (via login) ou manual (via formulário), todos os seus registros de vendas, perfis, estoques e clientes são apagados de nossos servidores de produção imediatamente ou em no máximo 24 horas.
                  </p>
                  <p>
                    <strong>• Exceções de Retenção Legal:</strong> De acordo com a legislação tributária brasileira, alguns dados offline referentes a transações financeiras e faturamento podem ser retidos sob criptografia robusta offline para fins exclusivos de auditorias fiscais obrigatórias, sem qualquer tipo de compartilhamento posterior.
                  </p>
                </div>

                {/* Call to Action to exclusion page */}
                <div className="pt-2 text-center">
                  <p className="text-xs font-bold text-red-950/70 mb-3 uppercase tracking-wider">
                    Deseja solicitar a exclusão de sua conta agora mesmo?
                  </p>
                  <a
                    href="/?page=excluir-conta"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-650 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    Ir para Portal de Exclusão de Conta
                    <ArrowRight size={14} />
                  </a>
                </div>
              </section>

              {/* 5. Segurança dos Dados */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Shield className="text-blue-500" size={18} />
                  <h3 className="font-black text-base uppercase tracking-tight">5. Medidas de Segurança</h3>
                </div>
                <p>
                  Utilizamos protocolos modernos de segurança da informação para impedir o acesso não autorizado, alteração, divulgação ou destruição dos seus dados pessoais e de seus negócios. Nossos sistemas contam com criptografia SSL/TLS em trânsito, firewalls ativos e políticas restritas de acesso a dados apenas por colaboradores autorizados para suporte operacional técnico.
                </p>
              </section>

              {/* 6. Fale Conosco / Contato */}
              <section className="border-t border-slate-200 pt-6 space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Mail className="text-blue-500" size={18} />
                  <h3 className="font-black text-base uppercase tracking-tight">6. Contato com o Desenvolvedor</h3>
                </div>
                <p>
                  Para dirimir quaisquer dúvidas em relação a esta política, exercer seus direitos como titular de dados sob a LGPD ou relatar possíveis incidentes, entre em contato diretamente com o nosso Encarregado de Proteção de Dados (DPO):
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Suporte & Privacidade OmniVenda</p>
                    <a 
                      href="mailto:jabasso.pva@gmail.com" 
                      className="text-xs text-blue-500 font-bold hover:underline"
                    >
                      jabasso.pva@gmail.com
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer Section */}
          <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-400 font-medium text-center sm:text-left">
              &copy; 2026 OmniVenda Cloud. Todos os direitos reservados.
            </p>
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Voltar para o Painel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
