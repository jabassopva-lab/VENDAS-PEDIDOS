import React from 'react';
import { X, Printer, Package, Building2, Calendar, Clock, CreditCard, User, Palmtree, Sun, ShoppingBag, MessageSquare, Share2, Edit3, Trash2, ChevronLeft, ChevronRight, Sliders } from 'lucide-react';
import { Sale, BusinessProfile, Client } from '../types';
import { convertDriveLink } from '../App.tsx';

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  profile: BusinessProfile;
  clients: Client[];
  onEdit: (sale: Sale) => void;
  onDelete: (saleId: string) => void;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ isOpen, onClose, sale, profile, clients, onEdit, onDelete }) => {
  if (!isOpen || !sale) return null;

  const clientData = clients.find(c => c.id === sale.clientId);

  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'VIEW' | 'ACTIONS'>('VIEW');

  React.useEffect(() => {
    if (isOpen) {
      setViewMode('VIEW');
      setShowConfirmDelete(false);
    }
  }, [isOpen, sale]);

  const handleDelete = () => {
    console.log("SaleDetailModal - Clique no botão excluir - solicitando confirmação");
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    console.log("SaleDetailModal - Confirmado! Excluindo venda:", sale.id);
    onDelete(sale.id);
    onClose();
  };

  const handleShareWhatsApp = () => {
    const companyName = profile.companyName || 'OMNIVENDA';
    const itemsText = sale.items.map(item => {
      const unitPrice = item.price - (item.discount || 0);
      return `• ${item.quantity}x ${item.name} - R$ ${(unitPrice * item.quantity).toFixed(2)}`;
    }).join('\n');
    
    const message = `*${companyName} - Pedido ${sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : sale.id}*
---------------------------
👤 *Cliente:* ${sale.clientName}
📅 *Data:* ${sale.date} às ${sale.time}

📦 *Itens:*
${itemsText}

💰 *Total: R$ ${sale.total.toFixed(2)}*
💳 *Pagamento:* ${sale.paymentMethod || 'Não informado'}
🗓️ *Condição:* ${sale.paymentTerms || 'À vista'}

Obrigado pela preferência!`;

    const encodedText = encodeURIComponent(message);
    const cleanPhone = clientData?.phone ? clientData.phone.replace(/\D/g, '') : '';
    const finalPhone = cleanPhone.length >= 10 ? `55${cleanPhone}` : cleanPhone;
    
    const whatsappUrl = finalPhone 
      ? `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  const handlePrint = () => {
    const logoUrl = convertDriveLink(profile.logoUrl || '');
    const companyName = profile.companyName || 'OMNIVENDA';
    const logoHtml = logoUrl ? `<img src="${logoUrl}" style="max-height: 80px; max-width: 180px; margin-bottom: 8px; object-fit: contain;">` : '';
    const clientPhone = clientData?.phone || '';
    const clientAddress = clientData?.address || '';

    const printContent = `
      <html>
        <head>
          <title>Pedido ${sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : sale.id}</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 12mm; }
            body { 
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
              color: #1e293b; 
              margin: 0; 
              padding: 0; 
              background: #f8fafc;
              -webkit-font-smoothing: antialiased;
            }
            .ticket {
              max-width: 750px;
              margin: 20px auto;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
              overflow: hidden;
              position: relative;
            }
            .brand-bar {
              height: 6px;
              background: linear-gradient(90deg, #0ea5e9, #0284c7);
            }
            .header { 
              padding: 30px 40px; 
              border-bottom: 1px solid #f1f5f9;
              background: #fafafb;
            }
            .header-main {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 20px;
            }
            .header-company {
              flex: 1;
            }
            .header-company h1 { 
              margin: 0; 
              font-size: 22px; 
              font-weight: 800; 
              color: #0f172a; 
              letter-spacing: -0.5px;
              text-transform: uppercase;
            }
            .company-doc { 
              margin: 6px 0 2px 0; 
              color: #64748b; 
              font-size: 11px; 
              font-weight: 500; 
            }
            .company-contact {
              margin: 0;
              color: #64748b;
              font-size: 11px;
              font-weight: 500;
            }
            .header-meta {
              text-align: right;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 8px;
            }
            .badge {
              padding: 6px 12px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              display: inline-block;
            }
            .badge-budget {
              background-color: #fef3c7;
              color: #d97706;
            }
            .badge-finalized {
              background-color: #d1fae5;
              color: #065f46;
            }
            .order-id {
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              letter-spacing: 0.5px;
            }
            .order-id span {
              font-size: 18px;
              color: #0f172a;
              font-weight: 800;
            }
            .order-date {
              font-size: 11px;
              color: #94a3b8;
              font-weight: 500;
            }

            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 25px;
              padding: 25px 40px;
              border-bottom: 1px solid #f1f5f9;
            }
            .details-column {
              display: flex;
              flex-direction: column;
            }
            .section-title { 
              font-size: 10px; 
              font-weight: 800; 
              color: #94a3b8; 
              text-transform: uppercase; 
              margin-bottom: 8px; 
              letter-spacing: 0.5px;
            }
            .details-box {
              background-color: #f8fafc;
              padding: 16px;
              border-radius: 12px;
              border: 1px solid #f1f5f9;
              flex: 1;
            }
            .client-name {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
              margin: 0 0 6px 0;
              text-transform: uppercase;
            }
            .client-detail {
              font-size: 12px;
              color: #475569;
              margin: 4px 0;
              line-height: 1.4;
            }
            .client-detail strong {
              color: #64748b;
              font-weight: 600;
              font-size: 11px;
            }

            .table-section {
              padding: 25px 40px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
            }
            th { 
              text-align: left; 
              padding: 12px 10px; 
              font-size: 10px; 
              color: #64748b; 
              text-transform: uppercase; 
              border-bottom: 2px solid #f1f5f9; 
              letter-spacing: 0.5px;
              font-weight: 700;
            }
            td { 
              padding: 14px 10px; 
              border-bottom: 1px solid #f8fafc; 
              font-size: 13px; 
              color: #1e293b;
            }
            .item-name {
              font-weight: 600;
              color: #0f172a;
            }

            .total-section {
              padding: 25px 40px;
              background-color: #fafafb;
              border-top: 1px solid #f1f5f9;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 8px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              width: 280px;
              font-size: 12px;
              color: #64748b;
            }
            .total-row-main {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              width: 320px;
              padding-top: 10px;
              border-top: 1px solid #e2e8f0;
              margin-top: 5px;
            }
            .total-label-main {
              font-size: 11px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: 0.5px;
            }
            .total-val-main {
              font-size: 24px;
              font-weight: 800;
              color: #0ea5e9;
            }

            .footer { 
              text-align: center; 
              padding: 25px; 
              color: #94a3b8; 
              font-size: 10px; 
              font-weight: 600; 
              text-transform: uppercase; 
              letter-spacing: 1px; 
            }

            @media print {
              body {
                background: #ffffff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .ticket {
                border: none;
                box-shadow: none;
                margin: 0;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
            <div class="ticket">
                <div class="brand-bar"></div>
                <div class="header">
                    <div class="header-main">
                        <div class="header-company">
                            ${logoHtml}
                            <h1>${companyName}</h1>
                            <p class="company-doc">${profile.document || ''}</p>
                            <p class="company-contact">${profile.phone || ''}</p>
                        </div>
                        <div class="header-meta">
                            <div class="badge ${sale.status === 'ORCAMENTO' ? 'badge-budget' : 'badge-finalized'}">
                                ${sale.status === 'ORCAMENTO' ? 'ORÇAMENTO' : 'COMPROVANTE DE PEDIDO'}
                            </div>
                            <div class="order-id">PEDIDO NO. <span>${sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : sale.id}</span></div>
                            <div class="order-date">${sale.date} às ${sale.time}</div>
                        </div>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="details-column">
                        <div class="section-title">Cliente</div>
                        <div class="details-box">
                            <p class="client-name">${sale.clientName}</p>
                            ${clientPhone ? `<p class="client-detail"><strong>WhatsApp / Tel:</strong> ${clientPhone}</p>` : ''}
                            ${clientAddress ? `<p class="client-detail"><strong>Endereço:</strong> ${clientAddress}</p>` : ''}
                        </div>
                    </div>
                    <div class="details-column">
                        <div class="section-title">Informações de Venda</div>
                        <div class="details-box">
                            <p class="client-detail"><strong>Forma de Pagamento:</strong> ${sale.paymentMethod || 'Dinheiro'}</p>
                            <p class="client-detail"><strong>Condição de Pagamento:</strong> ${sale.paymentTerms || 'À vista'}</p>
                            <p class="client-detail"><strong>Validade / Tipo:</strong> Documento sem valor fiscal</p>
                        </div>
                    </div>
                </div>

                <div class="table-section">
                    <div class="section-title">Produtos do Pedido</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item / Especificação</th>
                                <th style="text-align: center; width: 60px;">Qtd</th>
                                <th style="text-align: right; width: 120px;">Vl. Unitário</th>
                                <th style="text-align: right; width: 120px;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.items.map(item => {
                                const unitPrice = item.price - (item.discount || 0);
                                return `
                                <tr>
                                    <td>
                                        <div class="item-name">${item.name}</div>
                                    </td>
                                    <td style="text-align: center; font-weight: 500;">${item.quantity}</td>
                                    <td style="text-align: right; color: #475569;">R$ ${unitPrice.toFixed(2)}</td>
                                    <td style="text-align: right; font-weight: 700; color: #0f172a;">R$ ${(unitPrice * item.quantity).toFixed(2)}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="total-section">
                    <div class="total-row-main">
                        <span class="total-label-main">VALOR TOTAL DO PEDIDO:</span>
                        <span class="total-val-main">R$ ${sale.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                Agradecemos a preferência e confiança!
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
      }, 800);
    }
  };

  React.useEffect(() => {
    if (isOpen && sale) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sale?.id]);

  const currentLogo = convertDriveLink(profile.logoUrl || '');

  return (
    <div className="fixed inset-0 bg-black/65 sm:backdrop-blur-sm z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[2rem] sm:max-w-2xl shadow-2xl overflow-hidden flex flex-col border-0 sm:border border-slate-200 animate-in zoom-in-95 relative">
        {/* Confirmação de Exclusão Overlay */}
        {showConfirmDelete && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">EXCLUIR PEDIDO?</h3>
            <p className="text-sm text-slate-500 mb-8">Esta ação não pode ser desfeita e o estoque será devolvido.</p>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all font-sans"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="py-4 bg-red-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 font-sans"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        )}
        
        {/* Header Conditional */}
        {viewMode === 'VIEW' ? (
          <div className="bg-white px-6 py-5 flex justify-between items-center border-b border-slate-100">
             <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                   <ShoppingBag className="text-slate-400" size={20} />
                </div>
                <div>
                   <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Visualizar Pedido</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Pedido: {sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : '...'}</p>
                   <p className="text-[7px] font-medium text-slate-300 uppercase">Ref: {sale.id}</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode('ACTIONS')} 
                  className="bg-blue-50 hover:bg-blue-100 p-2 rounded-xl text-blue-600 transition-colors flex items-center gap-1.5 px-3" 
                  title="Ações do Pedido"
                >
                  <Sliders size={16} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Opções</span>
                </button>
                <button onClick={onClose} className="bg-slate-50 p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
                   <X size={20} />
                </button>
             </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 py-5 flex justify-between items-center shadow-md">
             <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2.5 rounded-xl">
                   <Sliders className="text-white" size={20} />
                </div>
                <div>
                   <h2 className="text-xs font-black uppercase tracking-widest text-white">Gerenciar Pedido</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Pedido: {sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : '...'}</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode('VIEW')} 
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-colors flex items-center gap-1.5 px-3" 
                  title="Voltar para o Pedido"
                >
                  <ChevronLeft size={16} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Ver Pedido</span>
                </button>
                <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white/80 transition-colors">
                   <X size={20} />
                </button>
             </div>
          </div>
        )}

        {viewMode === 'VIEW' ? (
          <div className="overflow-y-auto p-3 sm:p-5 bg-slate-50 flex-1 space-y-4">
            
            {/* The Document Sheet */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden flex flex-col relative">
              {/* Brand Top bar */}
              <div className="h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7]"></div>
              
              {/* Receipt Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex flex-col items-start mt-1">
                  {profile.logoUrl && (
                    <img 
                      src={currentLogo} 
                      className="max-h-12 max-w-[140px] mb-2 object-contain" 
                      alt="Logo" 
                      referrerPolicy="no-referrer" 
                    />
                  )}
                  <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tighter leading-none">{profile.companyName || 'OMNIVENDA'}</h3>
                  {profile.document && <p className="text-[8px] text-slate-400 font-bold mt-1.5 leading-none">CNPJ/CPF: {profile.document}</p>}
                  {profile.phone && <p className="text-[8px] text-slate-400 font-bold mt-1 leading-none">TEL: {profile.phone}</p>}
                </div>
                
                <div className="flex flex-col items-end text-right self-stretch sm:self-auto justify-between sm:justify-start gap-1">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${sale.status === 'ORCAMENTO' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {sale.status === 'ORCAMENTO' ? 'ORÇAMENTO' : 'COMPROVANTE DE PEDIDO'}
                  </span>
                  <div className="mt-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">PEDIDO NO.</p>
                    <p className="text-lg font-black text-slate-800 leading-none mt-1">
                      {sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : '...'}
                    </p>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">
                    {sale.date} às {sale.time}
                  </p>
                </div>
              </div>

              {/* Grid: Cliente & Informações de Venda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-4 sm:p-5 border-b border-slate-100 bg-[#fafafb]">
                {/* Column: Cliente */}
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">CLIENTE</span>
                  <div className="bg-white rounded-xl border border-slate-100 p-3 flex-1">
                    <p className="font-black text-slate-800 text-xs uppercase italic">{sale.clientName}</p>
                    {clientData?.phone && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        <strong className="text-slate-400 font-bold">WhatsApp / Tel:</strong> {clientData.phone}
                      </p>
                    )}
                    {clientData?.address && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        <strong className="text-slate-400 font-bold">Endereço:</strong> {clientData.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Column: Info Venda */}
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">INFORMAÇÕES DE VENDAS</span>
                  <div className="bg-white rounded-xl border border-slate-100 p-3 flex-1 space-y-1">
                    <p className="text-[10px] text-slate-500">
                      <strong className="text-slate-400 font-bold">Forma de Pagamento:</strong> {sale.paymentMethod || 'Dinheiro'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      <strong className="text-slate-400 font-bold">Condição de Pagamento:</strong> {sale.paymentTerms || 'À vista'}
                    </p>
                    <p className="text-[9px] text-slate-400 italic">
                      Documento sem valor fiscal
                    </p>
                  </div>
                </div>
              </div>

              {/* Table of items */}
              <div className="p-4 sm:p-5 border-b border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-2.5 block">PRODUTOS DO PEDIDO</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[320px]">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-1.5 font-black text-[8px] text-slate-400 uppercase tracking-widest">ITEM / ESPECIFICAÇÃO</th>
                        <th className="pb-1.5 text-center font-black text-[8px] text-slate-400 uppercase tracking-widest w-12">QTD</th>
                        <th className="pb-1.5 text-right font-black text-[8px] text-slate-400 uppercase tracking-widest w-20">VL. UNITÁRIO</th>
                        <th className="pb-1.5 text-right font-black text-[8px] text-slate-400 uppercase tracking-widest w-20">SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sale.items.map((item, idx) => {
                        const unitPrice = item.price - (item.discount || 0);
                        return (
                          <tr key={idx} className="text-slate-700 text-[11px]">
                            <td className="py-2.5 font-bold uppercase text-slate-800">
                              {item.name}
                              {item.discount > 0 && (
                                <span className="block text-[8px] font-black text-red-500 uppercase mt-0.5">Desc. R$ {item.discount.toFixed(2)} un.</span>
                              )}
                            </td>
                            <td className="py-2.5 text-center font-bold text-slate-500">{item.quantity}</td>
                            <td className="py-2.5 text-right text-slate-500">R$ {unitPrice.toFixed(2)}</td>
                            <td className="py-2.5 text-right font-black text-slate-800">R$ {(unitPrice * item.quantity).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Row */}
              <div className="p-4 sm:p-5 bg-[#fafafb] flex justify-end items-center">
                <div className="flex items-baseline gap-2 text-right">
                  <span className="text-[9px] font-black uppercase text-[#475569] tracking-wider">VALOR TOTAL DO PEDIDO:</span>
                  <span className="text-xl sm:text-2xl font-black text-[#0ea5e9]">R$ {sale.total.toFixed(2)}</span>
                </div>
              </div>

            </div>

            <p className="text-center text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Agradecemos a preferência e confiança!
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto p-6 space-y-4 bg-slate-50 flex-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Opções disponíveis para o pedido:</p>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Imprimir */}
              <button 
                onClick={handlePrint}
                className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between active:scale-95 transition-all group hover:border-sky-300"
              >
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                     <Printer size={24} />
                   </div>
                   <div className="text-left font-sans">
                     <p className="font-black text-slate-800 uppercase text-xs italic leading-tight">Imprimir Comprovante</p>
                     <p className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-widest mt-1">Imprimir pedido ou gerar PDF de via</p>
                   </div>
                 </div>
                 <ChevronRight size={20} className="text-slate-300" />
              </button>

              {/* WhatsApp */}
              <button 
                onClick={handleShareWhatsApp}
                className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between active:scale-95 transition-all group hover:border-emerald-300"
              >
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                     <MessageSquare size={24} />
                   </div>
                   <div className="text-left font-sans">
                     <p className="font-black text-slate-800 uppercase text-xs italic leading-tight">Enviar por WhatsApp</p>
                     <p className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-widest mt-1">Compartilhar recibo formatado com o cliente</p>
                   </div>
                 </div>
                 <ChevronRight size={20} className="text-slate-300" />
              </button>

              {/* Editar */}
              <button 
                onClick={() => {
                  onEdit(sale);
                  onClose();
                }}
                className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between active:scale-95 transition-all group hover:border-blue-300"
              >
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                     <Edit3 size={24} />
                   </div>
                   <div className="text-left font-sans">
                     <p className="font-black text-slate-800 uppercase text-xs italic leading-tight">Editar Pedido</p>
                     <p className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-widest mt-1">Modificar itens, preços, cliente ou pagamento</p>
                   </div>
                 </div>
                 <ChevronRight size={20} className="text-slate-300" />
              </button>

              {/* Excluir */}
              <button 
                onClick={handleDelete}
                className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between active:scale-95 transition-all group hover:border-red-300 hover:bg-red-50/10"
              >
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                     <Trash2 size={24} />
                   </div>
                   <div className="text-left font-sans">
                     <p className="font-black text-red-600 uppercase text-xs italic leading-tight">Excluir Registro</p>
                     <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mt-1">Apagar pedido permanentemente e devolver estoque</p>
                   </div>
                 </div>
                 <ChevronRight size={20} className="text-slate-300" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Minimalist Buttons */}
        {viewMode === 'VIEW' ? (
          <div className="p-6 bg-white border-t border-slate-50">
            <button 
              onClick={() => setViewMode('ACTIONS')}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all text-center group font-sans"
            >
              <Sliders size={16} className="group-hover:rotate-12 transition-transform" />
              <span>Gerenciar / Opções do Pedido</span>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <button 
              onClick={() => setViewMode('VIEW')}
              className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition-all text-center font-sans"
            >
              <ChevronLeft size={16} />
              <span>Voltar para o Pedido</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleDetailModal;
