import React, { useMemo, useState } from 'react';
import { 
  X, 
  Printer, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Coins,
  CreditCard,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Sale, Client, BusinessProfile } from '../types';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  clients: Client[];
  profile: BusinessProfile;
  onTogglePaid?: (saleId: string, isPaid: boolean) => void;
  onViewSale?: (sale: Sale) => void;
}

const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  sales,
  clients,
  profile,
  onTogglePaid,
  onViewSale
}) => {
  if (!isOpen) return null;

  // Safe client-side local ISO string (YYYY-MM-DD)
  const [selectedISO, setSelectedISO] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Calculate DD/MM/YYYY of the active date
  const activeDateBR = useMemo(() => {
    if (!selectedISO) return "";
    const [year, month, day] = selectedISO.split("-");
    return `${day}/${month}/${year}`;
  }, [selectedISO]);

  // Navigate to previous day
  const handlePrevDay = () => {
    const [year, month, day] = selectedISO.split("-").map(Number);
    const current = new Date(year, month - 1, day);
    current.setDate(current.getDate() - 1);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setSelectedISO(`${yyyy}-${mm}-${dd}`);
  };

  // Navigate to next day
  const handleNextDay = () => {
    const [year, month, day] = selectedISO.split("-").map(Number);
    const current = new Date(year, month - 1, day);
    current.setDate(current.getDate() + 1);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setSelectedISO(`${yyyy}-${mm}-${dd}`);
  };

  // Jump back to today
  const handleSetToday = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedISO(`${yyyy}-${mm}-${dd}`);
  };

  // Filter selected date's sales
  const todaySales = useMemo(() => {
    return sales.filter((s) => {
      if (!s.date) return false;
      // Allow FINALIZADA and PENDENTE for the main report stats (exclude speculative ORCAMENTO)
      return s.date === activeDateBR && ["FINALIZADA", "PENDENTE"].includes(s.status);
    });
  }, [sales, activeDateBR]);

  // Selected date's budgets/drafts
  const todayBudgets = useMemo(() => {
    return sales.filter((s) => s.date === activeDateBR && s.status === "ORCAMENTO");
  }, [sales, activeDateBR]);

  // Parse safety helpers
  const safeNumber = (val: any) => {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (typeof val === "string") {
      let cleaned = val.replace(/[R$\s]/g, "");
      if (cleaned.includes(",") && cleaned.includes(".")) {
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      } else if (cleaned.includes(",")) {
        cleaned = cleaned.replace(",", ".");
      }
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return Number(val) || 0;
  };

  // Perform calculations
  const stats = useMemo(() => {
    let totalVendido = 0;
    let totalLucro = 0;
    let totalRecebido = 0;
    let totalAReceber = 0;

    todaySales.forEach((s) => {
      const total = safeNumber(s.total);
      const profit = safeNumber(s.profit || 0);
      const isPaid = s.isPaid === true || String(s.isPaid) === "true" || Number(s.isPaid) === 1;

      totalVendido += total;
      totalLucro += profit;
      if (isPaid) {
        totalRecebido += total;
      } else {
        totalAReceber += total;
      }
    });

    const budgetsTotal = todayBudgets.reduce((acc, s) => acc + safeNumber(s.total), 0);

    return {
      vendasCount: todaySales.length,
      vendasTotal: totalVendido,
      lucro: totalLucro,
      recebidoTotal: totalRecebido,
      aReceberTotal: totalAReceber,
      budgetsCount: todayBudgets.length,
      budgetsTotal
    };
  }, [todaySales, todayBudgets]);

  // Breakdown of Payment Methods
  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, { total: number; count: number }> = {};
    todaySales.forEach((s) => {
      const method = s.paymentMethod || "Não Definido";
      const total = safeNumber(s.total);
      if (!methods[method]) {
        methods[method] = { total: 0, count: 0 };
      }
      methods[method].total += total;
      methods[method].count += 1;
    });
    return Object.entries(methods)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [todaySales]);

  // Top Products of Today
  const topProducts = useMemo(() => {
    const productsMap: Record<string, { name: string; quantity: number; totalSold: number }> = {};
    todaySales.forEach((s) => {
      s.items.forEach((item) => {
        const id = item.id || item.name;
        if (!productsMap[id]) {
          productsMap[id] = { name: item.name, quantity: 0, totalSold: 0 };
        }
        productsMap[id].quantity += item.quantity;
        productsMap[id].totalSold += item.quantity * safeNumber(item.price);
      });
    });
    return Object.values(productsMap).sort((a, b) => b.quantity - a.quantity);
  }, [todaySales]);

  // Printable Report Generation
  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <title>Relatório do Dia - ${activeDateBR}</title>
          <style>
              body {
                  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  color: #334155;
                  margin: 20px;
                  font-size: 11px;
                  line-height: 1.4;
              }
              .header {
                  text-align: center;
                  padding-bottom: 20px;
                  border-bottom: 2px dashed #cbd5e1;
                  margin-bottom: 20px;
              }
              .header h1 {
                  font-size: 18px;
                  margin: 0;
                  font-weight: 800;
                  color: #0f172a;
                  text-transform: uppercase;
                  letter-spacing: -0.5px;
              }
              .header p {
                  margin: 5px 0 0;
                  color: #64748b;
                  font-size: 10px;
                  font-weight: 700;
                  text-transform: uppercase;
              }
              .section-title {
                  font-size: 10px;
                  font-weight: 900;
                  text-transform: uppercase;
                  color: #475569;
                  letter-spacing: 0.5px;
                  border-bottom: 1px solid #e2e8f0;
                  padding-bottom: 4px;
                  margin-top: 20px;
                  margin-bottom: 8px;
              }
              .kpi-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 15px;
              }
              .kpi-table td {
                  padding: 8px;
                  border: 1px solid #e2e8f0;
              }
              .kpi-label {
                  font-weight: 700;
                  color: #64748b;
                  font-size: 9px;
                  text-transform: uppercase;
              }
              .kpi-value {
                  font-size: 13px;
                  font-weight: 850;
                  color: #0f172a;
                  text-align: right;
              }
              .kpi-value.green {
                  color: #16a34a;
              }
              .kpi-value.blue {
                  color: #0284c7;
              }
              .kpi-value.amber {
                  color: #d97706;
              }
              .details-table {
                  width: 100%;
                  border-collapse: collapse;
              }
              .details-table th {
                  background-color: #f8fafc;
                  padding: 6px 8px;
                  font-weight: 800;
                  text-transform: uppercase;
                  font-size: 8px;
                  color: #64748b;
                  text-align: left;
                  border-bottom: 1px solid #cbd5e1;
              }
              .details-table td {
                  padding: 8px;
                  border-bottom: 1px solid #f1f5f9;
                  font-size: 9px;
              }
              .text-right {
                  text-align: right;
              }
              .text-center {
                  text-align: center;
              }
              .font-bold {
                  font-weight: 700;
              }
              .badge {
                  display: inline-block;
                  padding: 2px 5px;
                  border-radius: 4px;
                  font-size: 7px;
                  font-weight: 900;
                  text-transform: uppercase;
              }
              .badge-pago {
                  background-color: #dcfce7;
                  color: #15803d;
              }
              .badge-pendente {
                  background-color: #fee2e2;
                  color: #b91c1c;
              }
              .footer {
                  text-align: center;
                  font-size: 8px;
                  color: #94a3b8;
                  margin-top: 30px;
                  border-top: 1px dashed #cbd5e1;
                  padding-top: 10px;
                  font-weight: 700;
                  text-transform: uppercase;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>${profile.companyName || 'OMNIVENDA'}</h1>
              <p>Relatório de Fechamento de Caixa</p>
              <div style="font-size: 10px; font-weight: 800; margin-top: 6px; color: #0184c7;">DATA: ${activeDateBR}</div>
          </div>

          <div class="section-title">Resumo Financeiro</div>
          <table class="kpi-table">
              <tr>
                  <td><span class="kpi-label">Vendas Finalizadas</span></td>
                  <td class="kpi-value">${stats.vendasCount}</td>
                  <td><span class="kpi-label">Total Vendido</span></td>
                  <td class="kpi-value text-right blue">R$ ${stats.vendasTotal.toFixed(2)}</td>
              </tr>
              <tr>
                  <td><span class="kpi-label">Recibos Pagos</span></td>
                  <td class="kpi-value text-right green">R$ ${stats.recebidoTotal.toFixed(2)}</td>
                  <td><span class="kpi-label">Contas a Receber</span></td>
                  <td class="kpi-value text-right amber">R$ ${stats.aReceberTotal.toFixed(2)}</td>
              </tr>
              <tr>
                  <td><span class="kpi-label">Lucro Estimado</span></td>
                  <td class="kpi-value text-right green" style="color: #16a34a;">R$ ${stats.lucro.toFixed(2)}</td>
                  <td><span class="kpi-label">Novos Orçamentos</span></td>
                  <td class="kpi-value text-right">${stats.budgetsCount} (R$ ${stats.budgetsTotal.toFixed(2)})</td>
              </tr>
          </table>

          <div class="section-title">Meios de Pagamento Utilizados</div>
          <table class="details-table">
              <thead>
                  <tr>
                      <th>Meio de Pagamento</th>
                      <th class="text-center" style="width: 80px;">Transações</th>
                      <th class="text-right" style="width: 120px;">Total</th>
                  </tr>
              </thead>
              <tbody>
                  ${paymentBreakdown.length === 0 ? `
                      <tr><td colspan="3" class="text-center" style="color: #94a3b8; font-weight: 700;">Nenhuma transação registrada.</td></tr>
                  ` : paymentBreakdown.map(method => `
                      <tr>
                          <td class="font-bold">${method.name}</td>
                          <td class="text-center">${method.count}</td>
                          <td class="text-right font-bold">R$ ${method.total.toFixed(2)}</td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>

          <div class="section-title">Produtos mais Vendidos Hoje</div>
          <table class="details-table">
              <thead>
                  <tr>
                      <th>Produto</th>
                      <th class="text-center" style="width: 80px;">Quantidade</th>
                      <th class="text-right" style="width: 120px;">Subtotal</th>
                  </tr>
              </thead>
              <tbody>
                  ${topProducts.length === 0 ? `
                      <tr><td colspan="3" class="text-center" style="color: #94a3b8; font-weight: 700;">Nenhum item vendido.</td></tr>
                  ` : topProducts.map(product => `
                      <tr>
                          <td class="font-bold">${product.name}</td>
                          <td class="text-center">${product.quantity}</td>
                          <td class="text-right">R$ ${product.totalSold.toFixed(2)}</td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>

          <div class="section-title">Lista Geral de Vendas - Hoje</div>
          <table class="details-table">
              <thead>
                  <tr>
                      <th style="width: 50px;">Hora</th>
                      <th>Cliente</th>
                      <th>Pagamento</th>
                      <th class="text-center" style="width: 70px;">Status</th>
                      <th class="text-right" style="width: 90px;">Total</th>
                  </tr>
              </thead>
              <tbody>
                  ${todaySales.length === 0 ? `
                      <tr><td colspan="5" class="text-center" style="color: #94a3b8; font-weight: 700;">Nenhuma venda lançada hoje.</td></tr>
                  ` : todaySales.map(s => {
                      const isPaid = s.isPaid === true || String(s.isPaid) === "true" || Number(s.isPaid) === 1;
                      return `
                      <tr>
                          <td>${s.time || '--:--'}</td>
                          <td class="font-bold">${s.clientName}</td>
                          <td>${s.paymentMethod} (${s.paymentTerms})</td>
                          <td class="text-center">
                              <span class="badge ${isPaid ? 'badge-pago' : 'badge-pendente'}">${isPaid ? 'Pago' : 'Pendente'}</span>
                          </td>
                          <td class="text-right font-bold">R$ ${safeNumber(s.total).toFixed(2)}</td>
                      </tr>
                      `;
                  }).join('')}
              </tbody>
          </table>

          <div class="footer">
              OMNIVENDA CO-PILOTO DIGITAL • GERANDO RESULTADOS DE VERDADE
          </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[95] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-in zoom-in-95">
        
        {/* Header Ribbon styled with gradient background */}
        <div className="bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="bg-white/20 p-2.5 rounded-2xl border border-white/15 shadow-inner">
              <FileSpreadsheet size={22} className="text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-[#f5f3ff]">Consolidado Diário</h2>
              <p className="text-sm font-black italic tracking-tight text-white flex items-center gap-1.5 uppercase mt-0.5">
                <Calendar size={13} className="text-sky-200" />
                Vendas de {activeDateBR}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center relative z-10">
            <button
              onClick={handlePrint}
              className="bg-white/15 text-white hover:bg-white/25 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 border border-white/10"
              title="Imprimir Relatório"
            >
              <Printer size={16} /> <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-950/20 hover:bg-slate-950/30 text-white p-2.5 rounded-xl transition-all active:scale-95 border border-white/5"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row gap-3 items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Período:</span>
            <div className="flex bg-white rounded-xl border border-slate-200 p-0.5">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1 px-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                title="Dia Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleSetToday}
                className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-colors ${
                  activeDateBR === new Date().toLocaleDateString("pt-BR")
                    ? "bg-indigo-50 text-indigo-600"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1 px-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                title="Próximo Dia"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0">Consultar Data:</span>
            <input
              type="date"
              value={selectedISO}
              onChange={(e) => {
                if (e.target.value) setSelectedISO(e.target.value);
              }}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto p-6 space-y-6 bg-slate-50 flex-1">
          
          {/* Quick Metrics (Bento-grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">Vendas Realizadas</span>
                <span className="w-5 h-5 bg-sky-50 rounded-lg flex items-center justify-center text-sky-500 font-black text-[9px]">{stats.vendasCount}</span>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-400 font-extrabold uppercase leading-none">Total Faturado</p>
                <h4 className="text-lg font-black text-slate-800 tracking-tight mt-1">R$ {stats.vendasTotal.toFixed(2)}</h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">Recebido Digital</span>
                <span className="w-5 h-5 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 font-black text-[9px]">💳</span>
              </div>
              <div className="mt-3">
                <p className="text-xs text-emerald-600 font-extrabold uppercase leading-none">Pago (Liquidado)</p>
                <h4 className="text-lg font-black text-emerald-600 tracking-tight mt-1">R$ {stats.recebidoTotal.toFixed(2)}</h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">A Receber</span>
                <span className="w-5 h-5 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 font-black text-[9px]">⏳</span>
              </div>
              <div className="mt-3">
                <p className="text-xs text-amber-600 font-extrabold uppercase leading-none">A prazo pendente</p>
                <h4 className="text-lg font-black text-amber-600 tracking-tight mt-1">R$ {stats.aReceberTotal.toFixed(2)}</h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">Margem Líquida</span>
                <span className="w-5 h-5 bg-[#dcfce7] rounded-lg flex items-center justify-center text-green-600"><TrendingUp size={12} /></span>
              </div>
              <div className="mt-3">
                <p className="text-xs text-green-600 font-extrabold uppercase leading-none">Lucro Estimado</p>
                <h4 className="text-lg font-black text-green-600 tracking-tight mt-1">R$ {stats.lucro.toFixed(2)}</h4>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Payment breakdowns */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Coins size={14} className="text-[#0ea5e9]" />
                Breakdown de Pagamentos
              </h3>
              <div className="space-y-2.5">
                {paymentBreakdown.length === 0 ? (
                  <p className="text-[10px] font-black text-slate-400 uppercase italic text-center py-4">Sem faturamento registrado hoje.</p>
                ) : (
                  paymentBreakdown.map((method) => {
                    const percentage = stats.vendasTotal > 0 ? (method.total / stats.vendasTotal) * 100 : 0;
                    return (
                      <div key={method.name} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-extrabold text-slate-700 uppercase italic">{method.name} ({method.count}x)</span>
                          <span className="font-black text-slate-800">R$ {method.total.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#0ea5e9] h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Top items sold */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag size={14} className="text-pink-500" />
                Produtos Vendidos Hoje
              </h3>
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                {topProducts.length === 0 ? (
                  <p className="text-[10px] font-black text-slate-400 uppercase italic text-center py-4">Nenhum produto listado hoje.</p>
                ) : (
                  topProducts.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase italic">{p.name}</h4>
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">{p.quantity} unidades vendidas</p>
                      </div>
                      <span className="font-black text-slate-800 text-xs">R$ {p.totalSold.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Today's comprehensive sales list */}
          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} className="text-violet-500" />
              Cronologia das Vendas do Dia
            </h3>
            <div className="space-y-3">
              {todaySales.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl">⚡</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase italic mt-1">Nenhuma venda faturada hoje.</p>
                </div>
              ) : (
                todaySales.map((sale) => {
                  const isPaid = sale.isPaid === true || String(sale.isPaid) === "true" || Number(sale.isPaid) === 1;
                  return (
                    <div 
                      key={sale.id}
                      onClick={() => onViewSale?.(sale)}
                      className="group p-3.5 rounded-2xl border border-slate-100 hover:border-[#0ea5e9] bg-slate-50/50 hover:bg-white cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-white rounded-xl flex flex-col items-center justify-center font-black text-slate-400 text-[10px] shadow-sm shrink-0">
                          <span className="text-slate-800 text-[10px] leading-tight">{sale.time || '--:--'}</span>
                          <span className="text-[6px] font-black uppercase text-slate-300">Resumo</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-700 text-xs uppercase italic group-hover:text-[#0ea5e9] transition-colors truncate">
                            {sale.clientName}
                          </h4>
                          <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                            {sale.paymentMethod} • {sale.paymentTerms || 'À Vista'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-800 italic">R$ {safeNumber(sale.total).toFixed(2)}</span>
                          <div className="mt-0.5">
                            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {isPaid ? 'Pago' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-[#0ea5e9] transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full bg-[#f1f5f9] hover:bg-slate-200 text-slate-600 sm:py-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-95"
          >
            Fechar Relatório
          </button>
        </div>

      </div>
    </div>
  );
};

export default DailyReportModal;
