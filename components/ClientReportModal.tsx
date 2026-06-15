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
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Cell
} from 'recharts';
import { Sale, Client, BusinessProfile } from '../types';

interface ClientReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: (Client | { id: string; name: string; phone?: string; email?: string; address?: string; document?: string }) | null;
  sales: Sale[];
  profile: BusinessProfile;
  onTogglePaid?: (saleId: string, isPaid: boolean) => void;
  onViewSale?: (sale: Sale) => void;
  rankingFilterType?: "MENSAL" | "PERIODO";
  rankingMonth?: string;
  rankingStartDate?: string;
  rankingEndDate?: string;
}

const ClientReportModal: React.FC<ClientReportModalProps> = ({
  isOpen,
  onClose,
  client,
  sales,
  profile,
  onTogglePaid,
  onViewSale,
  rankingFilterType,
  rankingMonth,
  rankingStartDate,
  rankingEndDate
}) => {
  if (!isOpen || !client) return null;

  // Format period
  const getPeriodString = () => {
    if (!rankingFilterType) return "";
    if (rankingFilterType === "MENSAL" && rankingMonth) {
      const [yr, mn] = rankingMonth.split("-");
      const lastDay = new Date(Number(yr), Number(mn), 0).getDate();
      return `Período: 01/${mn}/${yr} até ${String(lastDay).padStart(2, "0")}/${mn}/${yr}`;
    } else if (rankingFilterType === "PERIODO" && rankingStartDate && rankingEndDate) {
      const formatIsoToPtBr = (isoStr: string) => {
        if (!isoStr) return "";
        const parts = isoStr.split("-");
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return isoStr;
      };
      return `Período: ${formatIsoToPtBr(rankingStartDate)} até ${formatIsoToPtBr(rankingEndDate)}`;
    }
    return "";
  };

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

  // Helper to parse date in Brazilian format (DD/MM/YYYY)
  const parseBrDate = (dateStr?: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split("/");
    if (parts.length >= 3) {
      const datePart = parts[0].trim();
      const monthPart = parts[1].trim();
      const yearTime = parts[2].trim().split(" ");
      const yearPart = yearTime[0];
      const timePart = yearTime[1] || "00:00";
      const [hour, min] = timePart.split(":");
      return new Date(
        Number(yearPart),
        Number(monthPart) - 1,
        Number(datePart),
        Number(hour || 0),
        Number(min || 0)
      ).getTime();
    }
    return 0;
  };

  // Sort sales chronologically (oldest to newest)
  const chronologicalSales = [...sales].sort((a, b) => parseBrDate(a.date) - parseBrDate(b.date));

  // We compute variation data if we have at least 2 sales
  const hasMultipleSales = chronologicalSales.length >= 2;
  
  let variationData: Array<{ name: string; variation: number; olderQty: number; newerQty: number }> = [];

  if (hasMultipleSales) {
    const midIndex = Math.ceil(chronologicalSales.length / 2);
    const olderHalf = chronologicalSales.slice(0, midIndex);
    const newerHalf = chronologicalSales.slice(midIndex);

    const checkProductQuantities = (salesList: Sale[]) => {
      const counts: Record<string, { name: string; quantity: number }> = {};
      salesList.forEach(sale => {
        (sale.items || []).forEach(item => {
          const key = item.id || item.name.trim().toUpperCase();
          if (!counts[key]) {
            counts[key] = { name: item.name, quantity: 0 };
          }
          counts[key].quantity += (Number(item.quantity) || 0);
        });
      });
      return counts;
    };

    const olderCounts = checkProductQuantities(olderHalf);
    const newerCounts = checkProductQuantities(newerHalf);

    // Get union of keys
    const allKeys = Array.from(new Set([
      ...Object.keys(olderCounts),
      ...Object.keys(newerCounts)
    ]));

    variationData = allKeys.map(key => {
      const olderQty = olderCounts[key]?.quantity || 0;
      const newerQty = newerCounts[key]?.quantity || 0;
      const name = olderCounts[key]?.name || newerCounts[key]?.name || key;
      return {
        name,
        variation: newerQty - olderQty,
        olderQty,
        newerQty
      };
    })
    .filter(item => item.variation !== 0 || item.olderQty > 0 || item.newerQty > 0)
    .sort((a, b) => b.variation - a.variation);
  }

  // Custom Tooltip component for the trend chart
  const CustomTooltipInner = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const sign = data.variation > 0 ? "+" : "";
      const colorClass = data.variation > 0 ? "text-emerald-400 font-extrabold" : data.variation < 0 ? "text-rose-450 font-extrabold" : "text-slate-300 font-bold";
      return (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-3 shadow-xl text-xs space-y-1 font-sans">
          <p className="font-extrabold text-[#0ea5e9] text-[10px] uppercase tracking-wide truncate max-w-[190px]">{data.name}</p>
          <div className="flex justify-between gap-4 text-[11px] text-slate-350">
            <span>1ª Metade:</span>
            <span className="font-bold">{data.olderQty} und</span>
          </div>
          <div className="flex justify-between gap-4 text-[11px] text-slate-350">
            <span>2ª Metade:</span>
            <span className="font-bold">{data.newerQty} und</span>
          </div>
          <div className="border-t border-slate-805 pt-1 mt-1 flex justify-between gap-4 text-[11px]">
            <span className="font-semibold text-slate-400">Variação:</span>
            <span className={`font-black ${colorClass}`}>{sign}{data.variation} und</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Print function
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const salesListHTML = sales.map(s => {
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px 8px; font-size: 11px;">${s.orderNumber ? String(s.orderNumber).padStart(4, '0') : s.id.substring(0, 5)}</td>
          <td style="padding: 6px 8px; font-size: 11px;">${s.date} ${s.time || ''}</td>
          <td style="padding: 6px 8px; font-size: 11px; text-align: right; font-weight: bold;">R$ ${s.total.toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    const topProductsHTML = topProducts.map(p => `
      <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0; font-size: 11px;">
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;">${p.name}</span>
        <strong style="color: #0284c7; white-space: nowrap;">${p.quantity} un.</strong>
      </div>
    `).join("");

    const hasTrends = hasMultipleSales && variationData.length > 0;
    const trendsHTML = hasTrends ? variationData.map(v => {
      const isPositive = v.variation > 0;
      const isNegative = v.variation < 0;
      const color = isPositive ? '#10b981' : isNegative ? '#f43f5e' : '#64748b';
      const badgeBg = isPositive ? '#ecfdf5' : isNegative ? '#fdf2f8' : '#f1f5f9';
      const indicatorText = isPositive ? `▲ +${v.variation}` : isNegative ? `▼ ${v.variation}` : `● ${v.variation}`;
      
      const maxAbsVar = Math.max(...variationData.map(d => Math.abs(d.variation)), 1);
      const barPercent = Math.min(100, Math.round((Math.abs(v.variation) / maxAbsVar) * 100));

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f8fafc; font-size: 11px; gap: 10px; page-break-inside: avoid;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1e293b;">${v.name}</div>
            <div style="font-size: 9px; color: #64748b; display: flex; gap: 8px; margin-top: 1px;">
              <span>1ª metade: <strong>${v.olderQty} un.</strong></span>
              <span>2ª metade: <strong>${v.newerQty} un.</strong></span>
            </div>
          </div>
          
          <div style="width: 130px; display: flex; align-items: center; gap: 8px; justify-content: flex-end;">
            <div style="flex: 1; background: #f1f5f9; height: 5px; border-radius: 2px; overflow: hidden; display: flex; justify-content: ${isNegative ? 'flex-end' : 'flex-start'};">
              <div style="background: ${color}; width: ${barPercent}%; height: 100%; border-radius: 2px;"></div>
            </div>
            <span style="font-weight: 800; font-size: 8px; padding: 2px 4px; border-radius: 6px; background: ${badgeBg}; color: ${color}; white-space: nowrap; text-align: center; min-width: 44px; display: inline-block;">
              ${indicatorText}
            </span>
          </div>
        </div>
      `;
    }).join("") : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório - ${client.name}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              color: #1e293b; 
              margin: 15px 25px; 
              font-size: 12px;
              line-height: 1.3;
            }
            .header { 
              border-bottom: 2px solid #0284c7; 
              padding-bottom: 6px; 
              margin-bottom: 12px; 
              display: flex; 
              justify-content: space-between; 
              align-items: start; 
            }
            .title { 
              font-size: 18px; 
              font-weight: 850; 
              color: #0f172a; 
              margin: 0; 
              text-transform: uppercase; 
              letter-spacing: -0.02em;
            }
            .subtitle { 
              font-size: 10px; 
              color: #64748b; 
              margin: 2px 0 0 0; 
            }
            .company { 
              font-size: 11px; 
              font-weight: bold; 
              text-align: right; 
              color: #0284c7; 
              line-height: 1.25;
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: 1.4fr 1fr; 
              gap: 12px; 
              margin-bottom: 12px; 
            }
            .info-block { 
              background: #f8fafc; 
              border: 1px solid #e2e8f0; 
              padding: 8px 12px; 
              border-radius: 8px; 
              page-break-inside: avoid;
            }
            .info-title { 
              font-size: 9px; 
              font-weight: bold; 
              text-transform: uppercase; 
              color: #64748b; 
              margin: 0 0 4px 0; 
              letter-spacing: 0.05em; 
            }
            .info-row { 
              font-size: 11px; 
              margin: 2px 0; 
              display: flex; 
              gap: 4px; 
              align-items: center; 
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 10px; 
              margin-bottom: 12px; 
              page-break-inside: avoid;
            }
            .stat-card { 
              border: 1px solid #e2e8f0; 
              border-radius: 8px; 
              padding: 6px 10px; 
              text-align: center; 
              background: white; 
            }
            .stat-title { 
              font-size: 8px; 
              font-weight: 800; 
              text-transform: uppercase; 
              color: #64748b; 
              margin: 0 0 2px 0; 
            }
            .stat-value { 
              font-size: 14px; 
              font-weight: 800; 
              margin: 0; 
              color: #0f172a; 
            }
            .section-title {
              font-size: 12px; 
              text-transform: uppercase; 
              letter-spacing: 0.05em; 
              color: #0284c7; 
              margin: 14px 0 6px 0; 
              border-bottom: 1.5px solid #e2e8f0; 
              padding-bottom: 3px;
              page-break-after: avoid;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 6px; 
            }
            th { 
              background: #f1f5f9; 
              color: #475569; 
              padding: 6px 8px; 
              text-align: left; 
              font-size: 10px; 
              text-transform: uppercase; 
              font-weight: bold; 
            }
            tr {
              page-break-inside: avoid;
            }
            .footer { 
              margin-top: 20px; 
              text-align: center; 
              font-size: 9px; 
              color: #94a3b8; 
              border-top: 1px solid #e2e8f0; 
              padding-top: 8px; 
              page-break-inside: avoid;
            }
            @media print {
              body {
                margin: 0.8cm 1cm;
              }
              @page {
                size: portrait;
                margin: 0.8cm 1cm;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">${client.name}</h1>
              <p class="subtitle">Relatório Consolidado de Vendas • Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
              ${getPeriodString() ? `<p class="subtitle" style="font-weight: bold; margin-top: 2px; color: #0284c7;">${getPeriodString()}</p>` : ''}
            </div>
            <div class="company">
              <div>${profile.companyName || 'Meu Negócio'}</div>
              <div style="font-size: 10px; font-weight: normal; color: #64748b;">${profile.phone || ''}</div>
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
              ${topProductsHTML || '<div style="font-size:11px;color:#94a3b8;">Nenhum produto registrado</div>'}
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card" style="border-left: 3px solid #0284c7;">
              <p class="stat-title">Total Comprado</p>
              <p class="stat-value" style="color: #0284c7;">R$ ${totalSold.toFixed(2)}</p>
            </div>
            <div class="stat-card" style="border-left: 3px solid #f59e0b;">
              <p class="stat-title">Total Itens</p>
              <p class="stat-value">${totalPotes} Unid.</p>
            </div>
          </div>

          <!-- Growth & Retraction Trends section -->
          <h3 class="section-title">Crescimento e Retração por Produto</h3>
          ${hasTrends ? `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px; margin-bottom: 12px; page-break-inside: avoid;">
              ${trendsHTML}
            </div>
          ` : `
            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 8px 12px; border-radius: 8px; text-align: center; color: #64748b; font-size: 11px; margin-bottom: 12px; page-break-inside: avoid;">
              💡 Histórico de tendência não disponível. Requer pelo menos 2 pedidos neste período.
            </div>
          `}

          <h3 class="section-title">Histórico Detalhado de Vendas (${sales.length} pedidos)</h3>
          <table>
            <thead>
              <tr>
                <th style="padding: 6px 8px;">Nº Pedido</th>
                <th style="padding: 6px 8px;">Data</th>
                <th style="padding: 6px 8px; text-align: right;">Total do Pedido</th>
              </tr>
            </thead>
            <tbody>
              ${salesListHTML || '<tr><td colspan="3" style="padding:15px; text-align:center; color:#94a3b8;">Nenhum pedido registrado para este período</td></tr>'}
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
              Relatório Comercial Consolidado {getPeriodString() ? `• ${getPeriodString()}` : ''}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          {/* Desempenho de Vendas por Produto (Gráfico de Aumento e Retração) */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-550 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[#0ea5e9]" /> Crescimento e Retração por Produto
              </h4>
              <span className="text-[8px] font-black tracking-widest uppercase bg-sky-50 text-[#0284c7] px-2.5 py-0.5 rounded-lg">
                Tendência de Pedidos
              </span>
            </div>

            {hasMultipleSales && variationData.length > 0 ? (
              <>
                <p className="text-[10px] font-medium text-slate-500 leading-normal pl-0.5">
                  Compara a quantidade comprada na primeira metade do período versus a segunda metade. Valores positivos indicam <span className="text-emerald-700 font-extrabold text-[9px] uppercase">aumento</span> e negativos indicam <span className="text-rose-700 font-extrabold text-[9px] uppercase">retração</span> de pedidos.
                </p>

                <div className="h-56 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={variationData}
                      layout="vertical"
                      margin={{ top: 5, right: 15, left: -15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#475569" 
                        fontSize={9} 
                        fontWeight="extrabold" 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 16)}...` : value}
                      />
                      <Tooltip content={<CustomTooltipInner />} cursor={{ fill: 'rgba(14, 165, 233, 0.04)' }} />
                      <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
                      <Bar dataKey="variation" radius={[4, 4, 4, 4]} barSize={12}>
                        {variationData.map((entry, index) => {
                          const isPositive = entry.variation > 0;
                          const isNegative = entry.variation < 0;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={isPositive ? '#10b981' : isNegative ? '#f43f5e' : '#94a3b8'} 
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend bar indicators */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[8.5px] pt-1 font-extrabold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#10b981] rounded-xs block shadow-xs"></span>
                    <span>Aumento (Ascensão)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#f43f5e] rounded-xs block shadow-xs"></span>
                    <span>Retração (Queda)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#94a3b8] rounded-xs block shadow-xs"></span>
                    <span>Estável (Sem Alteração)</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-7 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80 space-y-2">
                <TrendingUp size={24} className="text-slate-300 stroke-[1.8]" />
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-tight">Histórico de Tendência Indisponível</p>
                <p className="text-[10px] text-slate-400 max-w-[280px] leading-relaxed pl-1 pr-1">
                  Requer pelo menos 2 pedidos finalizados/pendentes neste período para poder calcular e traçar a evolução de aumento ou retração por produto.
                </p>
              </div>
            )}
          </div>

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
                        {sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : sale.id.substring(0, 4)}
                      </div>
                      <div className="font-sans flex items-center">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-800 text-xs sm:text-sm">R$ {sale.total.toFixed(2)}</span>
                          <span className="text-[9px] text-slate-400">• {sale.date}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
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
