
import React from 'react';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Package, 
  ClipboardList, 
  BarChart3, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';

interface OrientationGuideProps {
  onBack: () => void;
}

const OrientationGuide: React.FC<OrientationGuideProps> = ({ onBack }) => {
  const steps = [
    {
      icon: <Plus className="text-yellow-500" />,
      title: "Novo Pedido",
      description: "Comece aqui para realizar uma venda. Selecione os produtos, defina o cliente e finalize o pagamento."
    },
    {
      icon: <Package className="text-red-500" />,
      title: "Gerenciar Estoque",
      description: "Cadastre seus produtos com preço de custo e venda para que o sistema calcule seu lucro automaticamente."
    },
    {
      icon: <Users className="text-sky-500" />,
      title: "Cadastro de Clientes",
      description: "Mantenha uma base de dados dos seus clientes para agilizar as vendas e gerar relatórios personalizados."
    },
    {
      icon: <ClipboardList className="text-green-500" />,
      title: "Histórico de Vendas",
      description: "Acompanhe todas as transações realizadas, filtre por data e veja os detalhes de cada pedido."
    },
    {
      icon: <BarChart3 className="text-amber-500" />,
      title: "Relatórios Inteligentes",
      description: "Analise o desempenho do seu negócio com gráficos de faturamento, lucro e produtos mais vendidos."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fffbeb] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 pb-12 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-8 -mt-8"></div>
        <button 
          onClick={onBack}
          className="bg-white/10 p-2 rounded-xl mb-4 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-slate-900">
            <BookOpen size={24} />
          </div>
          <h1 className="text-xl font-black uppercase italic tracking-tighter">Guia de Uso</h1>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Aprenda a dominar o OmniVenda Cloud</p>
      </div>

      {/* Content */}
      <div className="px-6 -mt-6 space-y-4 pb-10">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border-b-4 border-slate-100">
          <h2 className="text-sm font-black text-slate-800 uppercase italic mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500" />
            Como Funciona?
          </h2>
          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">{step.title}</h3>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl">
          <h3 className="font-black uppercase italic text-xs mb-2">Dica de Ouro!</h3>
          <p className="text-[10px] font-bold opacity-90 leading-relaxed">
            No modo Demo, os dados são fictícios para você testar todas as funcionalidades sem preocupação. Quando estiver pronto, crie sua conta real para salvar seus próprios dados na nuvem!
          </p>
        </div>

        <button 
          onClick={onBack}
          className="w-full bg-white text-slate-800 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border-b-4 border-slate-200 active:scale-95 transition-all shadow-md"
        >
          Entendi, vamos lá!
        </button>
      </div>
    </div>
  );
};

export default OrientationGuide;
