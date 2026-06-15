import React from 'react';
import { 
  X, 
  Printer, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { Sale, Client, BusinessProfile } from '../types';

interface ClientReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: (Client | { id: string; name: string; phone?: string; email?: string; address?: string; document?: string }) | null;
  sales: Sale[];
  profile: BusinessProfile;
  onTogglePaid?: (saleId: string, isPaid: boolean) => void;
  onViewSale?: (sale: Sale) => void;
}

const ClientReportModal: React.FC<ClientReportModalProps> = ({
  isOpen,
  onClose,
  client,
  sales,
  profile,
  onTogglePaid,
  onViewSale
}) => {
  if (!isOpen || !client) return null;

  // Compute metrics
  const totalSold = sales.reduce((acc, s) => acc + s.total, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  const totalPotes = sales.reduce(
    (sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0), 
    0
  );
  
  const pendingSales = sales.filter(s => !s.isPaid);
  const totalPendingAmount = pendingSales.reduce((acc, s) => acc + s.total, 0);
  
  const paidSales = sales.filter(s => s.isPaid);
  const totalPaidAmount = paidSales.reduce((acc, s) => acc + s.total, 0);

  const averageTicket = sales.length > 0 ? totalSold / sales.length : 0;

  // Breakdown of top products purchased
  const productQuantities: Record<string, { name: string; quantity: number }> = {};
  sales.forEach(sale => {
    (sale.items || []).forEach(item => {
      const id = item.id;
      if (!productQuantities[id]) {
        productQuantities[id] = { name: item.name, quantity: 0 };
      }
      productQuantities[id].quantity += (Number(item.quantity) || 0);
    });
  });

  const topProducts = Object.values(productQuantities)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 4);

  // Print function
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const salesListHTML = sales.map(s => {
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; font-size: 13px;">${s.orderNumber ? "#" + String(s.orderNumber).padStart(4, '0') : "#" + s.id.substring(0, 5)}</td>
          <td style="padding: 12px 8px; font-size: 13px;">${s.date} ${s.time || ''}</td>
          <td style="padding: 12px 8px; font-size: 13px;">${s.paymentMethod}</td>
          <td style="padding: 12px 8px; font-size: 13px;">
            ${s.isPaid 
              ? '<span style="color: #10b981; font-weight: bold; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">PAGO</span>' 
              : '<span style="color: #ef4444; font-weight: bold; background: #fef2f2; padding: 2px 6px; border-radius: 4px;">PENDENTE</span>'}
          </td>
          <td style="padding: 12px 8px; font-size: 13px; text-align: right; font-weight: bold;">R$ ${s.total.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    const topProductsHTML = topProducts.map(p => `
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px;">
        <span>${p.name}</span>
        <strong style="color: #0284c7;">${p.quantity} unid.</strong>
      </div>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório - ${client.name}</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 40px; }
            .header { border-bottom: 3px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: start; }
            .title { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; }
            .subtitle { font-size: 14px; color: #64748b; margin: 5px 0 0 0; }
            .company { font-size: 14px; font-weight: bold; text-align: right; color: #0284c7; }
            .info-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-block { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
            .info-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0; letter-spacing: 0.05em; }
            .info-row { font-size: 13px; margin: 4px 0; display: flex; gap: 6px; align-items: center; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; background: white; }
            .stat-title { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; margin: 0 0 4px 0; }
            .stat-value { font-size: 16px; font-weight: 800; margin: 0; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f1f5f9; color: #475569; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">${client.name}</h1>
              <p class="subtitle">Relatório Consolidado de Vendas • Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="company">
              <div>${profile.companyName || 'Meu Negócio'}</div>
              <div style="font-size: 11px; font-weight: normal; color: #64748b;">${profile.phone || ''}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <p class="info-title">Dados do Cliente</p>
              ${client.phone ? `<div class="info-row">📞 <strong>Whats:</strong> ${client.phone}</div>` : ''}
              ${client.email ? `<div class="info-row">✉️ <strong>Email:</strong> ${client.email}</div>` : ''}
              ${client.address ? `<div class="info-row">📍 <strong>Endereço:</strong> ${client.address}</div>` : ''}
              ${client.document ? `<div class="info-row">📄 <strong>CNPJ/CPF:</strong> ${client.document}</div>` : ''}
            </div>
            <div class="info-block">
              <p class="info-title">Produtos Mais Vendidos</p>
              ${topProductsHTML || '<div style="font-size:12px;color:#94a3b8;">Nenhum produto registrado</div>'}
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card" style="border-left: 4px solid #0284c7;">
              <p class="stat-title">Total Comprado</p>
              <p class="stat-value" style="color: #0284c7;">R$ ${totalSold.toFixed(2)}</p>
            </div>
            <div class="stat-card" style="border-left: 4px solid #ef4444;">
              <p class="stat-title">Saldo Devedor</p>
              <p class="stat-value" style="color: #ef4444;">R$ ${totalPendingAmount.toFixed(2)}</p>
            </div>
            <div class="stat-card" style="border-left: 4px solid #10b981;">
              <p class="stat-title">Total Pago</p>
              <p class="stat-value" style="color: #10b981;">R$ ${totalPaidAmount.toFixed(2)}</p>
            </div>
            <div class="stat-card" style="border-left: 4px solid #f59e0b;">
              <p class="stat-title">Total Itens</p>
              <p class="stat-value">${totalPotes} Unid.</p>
            </div>
          </div>

          <h3 style="font-size: 15px; border-bottom: 2px solid #e1e8f0; padding-bottom: 6px; margin: 30px 0 10px 0; color: #0f172a;">Histórico Detalhado de Vendas (${sales.length} pedidos)</h3>
          <table>
            <thead>
              <tr>
                <th style="padding: 10px 8px;">Nº Pedido</th>
                <th style="padding: 10px 8px;">Data</th>
                <th style="padding: 10px 8px;">Forma Pagmto.</th>
                <th style="padding: 10px 8px;">Status Pagmto.</th>
                <th style="padding: 10px 8px; text-align: right;">Total do Pedido</th>
              </tr>
            </thead>
            <tbody>
              ${salesListHTML || '<tr><td colspan="5" style="padding:20px; text-align:center; color:#94a3b8;">Nenhum pedido registrado para este período</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            <p>Gerado por OmniVenda Cloud — Impressão Segura</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Safe WhatsApp link
  const handleWhatsAppChat = () => {
    if (!client.phone) return;
    const cleanPhone = client.phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length >= 10 ? `55${cleanPhone}` : cleanPhone;
    const message = `Olá, ${client.name}! Gostaria de falar sobre o seu histórico de pedidos.`;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-2xl rounded-[2.2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner Header with sky-gradient */}
        <div className="bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white px-5 py-4 pb-5 flex items-center justify-between relative overflow-hidden border-b-4 border-yellow-400">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-100/90 mb-1">
              Relatório Comercial Consolidado
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight italic drop-shadow-xs max-w-[280px] sm:max-w-[450px] truncate">
              {client.name}
            </h3>
          </div>
          <div className="flex gap-2 relative z-10">
            <button
              onClick={handlePrint}
              title="Imprimir Relatório de Cliente"
              className="bg-white/15 hover:bg-white/25 text-white p-2.5 rounded-xl active:scale-90 transition-all border border-white/5"
            >
              <Printer size={20} className="stroke-[2.5]" />
            </button>
            <button
              onClick={onClose}
              className="bg-white/15 hover:bg-white/25 text-white p-2.5 rounded-xl active:scale-90 transition-all border border-white/5"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Modal content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Quick Profile Cards */}
          <div className="bg-white p-4 rounded-[1.8rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="space-y-1.5 flex-1 font-sans">
              {client.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-650">
                  <Phone size={14} className="text-sky-500" />
                  <span className="font-semibold">{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-xs text-slate-650">
                  <Mail size={14} className="text-sky-500" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{client.email}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin size={14} className="text-sky-500 shrink-0" />
                  <span className="font-medium text-slate-500 leading-snug">{client.address}</span>
                </div>
              )}
            </div>
            
            {client.phone && (
              <button
                onClick={handleWhatsAppChat}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <span>Chamar WhatsApp</span>
                <Phone size={14} className="fill-emerald-600 stroke-none" />
              </button>
            )}
          </div>

          {/* Quick Stats Bento-Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-xs text-center flex flex-col justify-between">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                Total Comprado
              </span>
              <p className="text-base sm:text-lg font-black text-blue-600">
                R$ {totalSold.toFixed(2)}
              </p>
              <span className="text-[7px] font-extrabold text-green-500 block">
                Lucro: R$ {totalProfit.toFixed(2)}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-xs text-center flex flex-col justify-between">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                Potes Comprados
              </span>
              <p className="text-base sm:text-lg font-black text-sky-850">
                {totalPotes} <span className="text-[10px] font-bold text-slate-400">Potes</span>
              </p>
              <span className="text-[7px] font-bold text-slate-400">
                {sales.length} Pedidos
              </span>
            </div>

            <div className="bg-rose-50/45 p-3.5 rounded-3xl border border-rose-100 shadow-xs text-center flex flex-col justify-center gap-1">
              <span className="text-[8px] font-extrabold text-[#f43f5e] uppercase tracking-widest block leading-none">
                Saldo Devedor
              </span>
              <p className="text-base sm:text-lg font-black text-[#e11d48]">
                R$ {totalPendingAmount.toFixed(2)}
              </p>
              <span className="text-[7px] font-bold text-rose-500">
                {pendingSales.length} em aberto
              </span>
            </div>

            <div className="bg-emerald-50/45 p-3.5 rounded-3xl border border-emerald-100 shadow-xs text-center flex flex-col justify-center gap-1">
              <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-widest block leading-none">
                Ticket Médio
              </span>
              <p className="text-base sm:text-lg font-black text-emerald-700">
                R$ {averageTicket.toFixed(2)}
              </p>
              <span className="text-[7px] font-bold text-emerald-500">
                p/ Pedido
              </span>
            </div>
          </div>

          {/* Top Products section (if any) */}
          {topProducts.length > 0 && (
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0ea5e9] mb-3 flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <Package size={14} /> Produtos Mais Comprados
              </h4>
              <div className="grid grid-cols-2 gap-3.5">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <span className="font-extrabold text-slate-800 uppercase italic truncate max-w-[140px]">{p.name}</span>
                    <span className="bg-sky-50 text-[#0284c7] font-black px-2 py-0.5 rounded-lg text-xs shrink-0">{p.quantity} Potes</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order list section */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center justify-between">
              <span>Histórico de Pedidos ({sales.length})</span>
              <span className="text-[8px] text-slate-400 font-bold lowercase">toque para ver detalhes</span>
            </h4>
            
            {sales.length === 0 ? (
              <div className="text-center py-6 bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs font-semibold">
                Nenhum pedido registrado para este cliente.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {sales.map((sale) => (
                  <div 
                    key={sale.id}
                    className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    {/* Left: order details */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black italic text-[10px]">
                        {sale.orderNumber ? `#${String(sale.orderNumber).padStart(4, '0')}` : `#${sale.id.substring(0, 4)}`}
                      </div>
                      <div className="font-sans">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-800 text-xs sm:text-sm">R$ {sale.total.toFixed(2)}</span>
                          <span className="text-[9px] text-slate-400">• {sale.date}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mt-0.5">
                          {sale.paymentMethod} {sale.paymentTerms && `(${sale.paymentTerms})`}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right: toggle / actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                      {/* Payment Toggle */}
                      {onTogglePaid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePaid(sale.id, !sale.isPaid);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                            sale.isPaid
                              ? "bg-emerald-50/40 hover:bg-emerald-50 border-emerald-100 text-emerald-700"
                              : "bg-rose-50/40 hover:bg-rose-50 border-[#fca5a5] text-rose-750"
                          }`}
                          title={sale.isPaid ? "Estornar Pagamento (Mudar para Pendente)" : "Dar baixa (Marcar como Pago)"}
                        >
                          {sale.isPaid ? (
                            <>
                              <CheckCircle2 size={12} className="text-emerald-500" />
                              <span>Pago</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} className="text-rose-500" />
                              <span>Pendente</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* View details */}
                      {onViewSale && (
                        <button
                          onClick={() => onViewSale(sale)}
                          className="text-[#0284c7] hover:text-sky-700 bg-sky-50 hover:bg-sky-100 p-1.5 rounded-lg active:scale-90 transition-all flex items-center justify-center border border-sky-100"
                          title="Ver detalhes do pedido"
                        >
                          <ChevronRight size={16} className="stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-150 flex items-center justify-between font-sans">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase">
            OmniVenda Cloud • Inteligência de Negócio
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 border-b-2 border-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ClientReportModal;
