
import React from 'react';
import { X, Printer, Package, Building2, Calendar, Clock, CreditCard, User, Palmtree, Sun, ShoppingBag, MessageSquare, Share2 } from 'lucide-react';
import { Sale, BusinessProfile, Client } from '../types';
import { convertDriveLink } from '../App';

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  profile: BusinessProfile;
  clients: Client[];
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ isOpen, onClose, sale, profile, clients }) => {
  if (!isOpen || !sale) return null;

  const clientData = clients.find(c => c.id === sale.clientId);

  const handleShareWhatsApp = () => {
    const companyName = profile.companyName || 'DOCE BOM';
    const itemsText = sale.items.map(item => `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`).join('\n');
    
    const message = `*${companyName} - Pedido #${sale.id}*
---------------------------
👤 *Cliente:* ${sale.clientName}
📅 *Data:* ${sale.date} às ${sale.time}

📦 *Itens:*
${itemsText}

💰 *Total: R$ ${sale.total.toFixed(2)}*
💳 *Pagamento:* ${sale.paymentMethod || 'Não informado'}
🗓️ *Vencimento:* ${sale.paymentTerms || 'À vista'}

Obrigado pela preferência!`;

    const encodedText = encodeURIComponent(message);
    // Limpa o telefone para conter apenas números
    const cleanPhone = clientData?.phone ? clientData.phone.replace(/\D/g, '') : '';
    
    // Se o telefone tiver 10 ou 11 dígitos, adiciona o DDI 55 (Brasil)
    const finalPhone = cleanPhone.length >= 10 ? `55${cleanPhone}` : cleanPhone;
    
    const whatsappUrl = finalPhone 
      ? `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  const handlePrint = () => {
    const logoUrl = convertDriveLink(profile.logoUrl || '');
    const companyName = profile.companyName || 'DOCE BOM';
    const logoHtml = logoUrl ? `<img src="${logoUrl}" style="height: 100px; margin-bottom: 10px; object-fit: contain;">` : '';

    const printContent = `
      <html>
        <head>
          <title>DOCE BOM - Pedido #${sale.id}</title>
          <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
              font-family: 'Fredoka', sans-serif; 
              color: #1e293b; 
              margin: 0; 
              padding: 0; 
              background: #fff;
            }
            .ticket {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #f1f5f9;
              border-radius: 20px;
              overflow: hidden;
            }
            .header { 
              background: #0ea5e9; 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
              border-bottom: 8px solid #fbbf24;
              position: relative;
            }
            .header h1 { margin: 0; font-size: 32px; text-transform: uppercase; font-style: italic; font-weight: 800; }
            .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; font-weight: 600; }
            
            .info-bar { 
              display: flex; 
              justify-content: space-between; 
              padding: 20px 30px; 
              background: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-item h4 { margin: 0; font-size: 9px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; }
            .info-item p { margin: 2px 0 0; font-size: 13px; font-weight: 700; }

            .section { padding: 25px 30px; }
            .section-title { font-size: 10px; font-weight: 800; color: #0ea5e9; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
            
            .client-card {
              background: #f0f9ff;
              border: 2px solid #e0f2fe;
              border-radius: 15px;
              padding: 15px;
              display: grid;
              grid-template-cols: 1fr 1fr;
            }

            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { text-align: left; padding: 12px; font-size: 10px; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .qty { font-weight: 800; color: #0ea5e9; }
            
            .total-box {
              background: #1e293b;
              color: white;
              padding: 25px 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-radius: 0 0 18px 18px;
            }
            .total-label { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #94a3b8; }
            .total-value { font-size: 32px; font-weight: 800; color: #fbbf24; }

            .footer { text-align: center; padding: 30px; color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; }
            
            @media print {
              .header { -webkit-print-color-adjust: exact; }
              .total-box { -webkit-print-color-adjust: exact; background: #1e293b !important; }
              .client-card { -webkit-print-color-adjust: exact; background: #f0f9ff !important; }
            }
          </style>
        </head>
        <body>
            <div class="ticket">
                <div class="header">
                    ${logoHtml}
                    <h1>${companyName}</h1>
                    <p>${profile.document || ''} • ${profile.phone || ''}</p>
                </div>

                <div class="info-bar">
                    <div class="info-item">
                        <h4>Pedido No.</h4>
                        <p>#${sale.id}</p>
                    </div>
                    <div class="info-item" style="text-align: center;">
                        <h4>Data/Hora</h4>
                        <p>${sale.date} ${sale.time}</p>
                    </div>
                    <div class="info-item" style="text-align: right;">
                        <h4>Vencimento</h4>
                        <p style="color: #0ea5e9;">${sale.paymentTerms || 'À vista'}</p>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Dados do Cliente</div>
                    <div class="client-card">
                        <div>
                            <p style="font-size: 16px; margin: 0;">${sale.clientName}</p>
                            <p style="font-size: 11px; color: #64748b; margin: 4px 0 0;">${clientData?.phone || 'Sem telefone'}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 11px; color: #64748b; margin: 0;">${clientData?.address || ''}</p>
                        </div>
                    </div>
                </div>

                <div class="section" style="padding-top: 0;">
                    <div class="section-title">Itens do Pedido</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th style="text-align: center;">Qtd</th>
                                <th style="text-align: right;">Preço</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.items.map(item => `
                            <tr>
                                <td style="font-weight: 700;">${item.name}</td>
                                <td style="text-align: center;" class="qty">${item.quantity}</td>
                                <td style="text-align: right;">R$ ${item.price.toFixed(2)}</td>
                                <td style="text-align: right; font-weight: 700;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="total-box">
                    <div>
                        <div class="total-label">Pagamento: ${sale.paymentMethod || 'Dinheiro'}</div>
                        <div style="font-size: 10px; margin-top: 4px; opacity: 0.7;">Documento sem valor fiscal</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="total-label">Total do Pedido</div>
                        <div class="total-value">R$ ${sale.total.toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                Obrigado pela preferência!
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

  const currentLogo = convertDriveLink(profile.logoUrl || '');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-x border-t border-slate-100 animate-in zoom-in-95">
        
        {/* Modal Header Tropical */}
        <div className="bg-[#0ea5e9] text-white p-6 relative overflow-hidden border-b-4 border-yellow-400">
           <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 pointer-events-none">
              <Palmtree size={80} />
           </div>
           <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                 <div className="bg-white p-2 rounded-2xl shadow-lg">
                    <ShoppingBag className="text-[#0ea5e9]" size={20} />
                 </div>
                 <div>
                    <h2 className="text-sm font-black uppercase tracking-tighter italic">Detalhes do Pedido</h2>
                    <p className="text-[10px] font-bold opacity-80 uppercase">Registro #${sale.id}</p>
                 </div>
              </div>
              <button onClick={onClose} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors">
                 <X size={20} />
              </button>
           </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Logo & Company Section */}
          <div className="flex flex-col items-center text-center pb-6 border-b-2 border-dashed border-slate-100">
             <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center overflow-hidden mb-3 border-2 border-slate-50 shadow-inner group transition-transform hover:scale-105">
                {(profile.logoUrl) ? (
                  <img src={currentLogo} className="w-full h-full object-contain p-2" alt="Logo" />
                ) : (
                  <Sun size={48} className="text-yellow-400" />
                )}
             </div>
             <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{profile.companyName || 'DOCE BOM'}</h3>
             <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{profile.document || '00.000.000/0001-00'}</p>
          </div>

          {/* Client & Terms Section */}
          <div className="grid grid-cols-1 gap-3">
             <div className="bg-sky-50 p-4 rounded-[2rem] border-2 border-sky-100 flex items-start gap-4 shadow-sm">
                <div className="bg-[#0ea5e9] text-white p-2.5 rounded-2xl shadow-lg">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] font-black text-sky-600 uppercase tracking-widest block mb-0.5">Cliente Selecionado</span>
                  <p className="font-black text-slate-800 text-base truncate uppercase italic">{sale.clientName}</p>
                  <div className="flex gap-3 mt-1">
                    {clientData?.phone && <span className="text-[9px] text-slate-400 font-black uppercase">Tel: {clientData.phone}</span>}
                    <span className="text-[9px] text-[#0ea5e9] font-black uppercase italic">Vencto: {sale.paymentTerms || 'À vista'}</span>
                  </div>
                </div>
             </div>
          </div>

          {/* Items List Style */}
          <div className="space-y-3">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Produtos no Carrinho</h3>
            <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] overflow-hidden shadow-md">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 border-b last:border-0 border-slate-50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500">
                         {item.quantity}x
                      </div>
                      <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-xs uppercase italic">{item.name}</span>
                          <span className="text-[9px] text-slate-400 font-black uppercase">R$ {item.price.toFixed(2)} p/ {item.unit || 'un'}</span>
                      </div>
                  </div>
                  <span className="font-black text-slate-900 text-sm">R$ {(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}
              <div className="bg-[#1e293b] text-white p-6 flex justify-between items-center">
                 <div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.3em]">Total Bruto</span>
                    <p className="text-[9px] font-bold text-yellow-400 uppercase italic mt-1">{sale.paymentMethod || 'Dinheiro'}</p>
                 </div>
                 <div className="text-right">
                    <span className="text-2xl font-black text-white italic">R$ {sale.total.toFixed(2)}</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-3xl border-2 border-yellow-100 flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center text-yellow-600">
                <Clock size={20} />
             </div>
             <div>
                <p className="text-[8px] font-black text-amber-900 uppercase tracking-widest">Registrado em</p>
                <p className="text-[10px] font-black text-amber-800 uppercase italic">{sale.date} às {sale.time}</p>
             </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row gap-3">
          <button 
            onClick={handleShareWhatsApp}
            className="flex-1 bg-emerald-500 text-white py-4 rounded-[1.8rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all"
          >
            <MessageSquare size={18} /> 
            Enviar WhatsApp
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 bg-white border-b-4 border-slate-200 py-4 rounded-[1.8rem] flex items-center justify-center gap-3 font-black text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-xs uppercase tracking-widest shadow-sm"
          >
            <Printer size={18} className="text-[#0ea5e9]" /> 
            Gerar Comprovante
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailModal;
