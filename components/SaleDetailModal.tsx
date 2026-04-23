
import React from 'react';
import { X, Printer, Package, Building2, Calendar, Clock, CreditCard, User, Palmtree, Sun, ShoppingBag, MessageSquare, Share2, Edit3, Trash2 } from 'lucide-react';
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
    
    const message = `*${companyName} - Pedido #${sale.id}*
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
    const logoHtml = logoUrl ? `<img src="${logoUrl}" style="height: 60px; margin-bottom: 10px; object-fit: contain;">` : '';

    const printContent = `
      <html>
        <head>
          <title>Pedido #${sale.id}</title>
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
              border: 1px solid #f1f5f9;
              border-radius: 8px;
            }
            .header { 
              padding: 30px; 
              text-align: center;
              border-bottom: 1px solid #f1f5f9;
            }
            .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; font-weight: 800; color: #0f172a; }
            .header p { margin: 4px 0 0; color: #94a3b8; font-size: 12px; font-weight: 500; }
            
            .info-bar { 
              display: flex; 
              justify-content: space-between; 
              padding: 15px 30px; 
              border-bottom: 1px solid #f1f5f9;
            }
            .info-item h4 { margin: 0; font-size: 9px; text-transform: uppercase; color: #cbd5e1; letter-spacing: 1px; }
            .info-item p { margin: 2px 0 0; font-size: 13px; font-weight: 700; }

            .section { padding: 20px 30px; }
            .section-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; display: inline-block; }
            
            .client-card {
              display: grid;
              grid-template-columns: 1fr 1fr;
              padding: 10px 0;
            }

            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th { text-align: left; padding: 10px; font-size: 10px; color: #cbd5e1; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
            td { padding: 10px; border-bottom: 1px solid #f8fafc; font-size: 13px; }
            
            .total-box {
              padding: 25px 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid #f1f5f9;
            }
            .total-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; }
            .total-value { font-size: 24px; font-weight: 800; color: #0f172a; }

            .footer { text-align: center; padding: 20px; color: #e2e8f0; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
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
                        <h4>Condição</h4>
                        <p>${sale.paymentTerms || 'À vista'}</p>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Cliente</div>
                    <div class="client-card">
                        <div>
                            <p style="font-size: 14px; font-weight: 700; margin: 0;">${sale.clientName}</p>
                            <p style="font-size: 11px; color: #94a3b8; margin: 2px 0 0;">${clientData?.phone || ''}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 11px; color: #94a3b8; margin: 0;">${clientData?.address || ''}</p>
                        </div>
                    </div>
                </div>

                <div class="section" style="padding-top: 0;">
                    <div class="section-title">Itens do Pedido</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style="text-align: center;">Qtd</th>
                                <th style="text-align: right;">un.</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.items.map(item => {
                                const unitPrice = item.price - (item.discount || 0);
                                return `
                                <tr>
                                    <td style="font-weight: 600;">${item.name}</td>
                                    <td style="text-align: center;">${item.quantity}</td>
                                    <td style="text-align: right;">R$ ${unitPrice.toFixed(2)}</td>
                                    <td style="text-align: right; font-weight: 700;">R$ ${(unitPrice * item.quantity).toFixed(2)}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="total-box">
                    <div>
                        <div class="total-label">Pagamento: ${sale.paymentMethod || 'Dinheiro'}</div>
                        <div style="font-size: 8px; margin-top: 2px; color: #e2e8f0;">Não é documento fiscal</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="total-label">Total do Pedido</div>
                        <div class="total-value">R$ ${sale.total.toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                Agradecemos a sua compra!
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
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-in zoom-in-95 relative">
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
        
        {/* Header Minimalist */}
        <div className="bg-white px-6 py-5 flex justify-between items-center border-b border-slate-100">
           <div className="flex items-center gap-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                 <ShoppingBag className="text-slate-400" size={20} />
              </div>
              <div>
                 <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Visualizar Pedido</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Ref: #{sale.id}</p>
              </div>
           </div>
           <div className="flex gap-2">
              <button onClick={handleDelete} className="bg-red-50 p-2 rounded-xl hover:bg-red-100 transition-colors text-red-600" title="Excluir Pedido">
                <Trash2 size={20} />
              </button>
              <button onClick={() => onEdit(sale)} className="bg-blue-50 p-2 rounded-xl hover:bg-blue-100 transition-colors text-blue-600" title="Editar Pedido">
                <Edit3 size={20} />
              </button>
              <button onClick={onClose} className="bg-slate-50 p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
                <X size={20} />
              </button>
           </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 bg-white">
          
          {/* Company Section */}
          <div className="flex flex-col items-center text-center pb-2">
             <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden mb-3 border border-slate-100">
                {(profile.logoUrl) ? (
                  <img src={currentLogo} className="w-full h-full object-cover" alt="Logo" />
                ) : (
                  <Sun size={24} className="text-yellow-400" />
                )}
             </div>
             <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tighter leading-none">{profile.companyName || 'OMNIVENDA'}</h3>
             <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest mt-1">{profile.document}</p>
          </div>

          {/* Client Details Minimalist */}
          <div className="p-5 rounded-2xl border border-slate-100 space-y-4">
             <div className="flex items-center gap-2">
                <User size={14} className="text-slate-300" />
                <span className="font-black text-slate-800 text-xs uppercase italic">{sale.clientName}</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Meio de Pagamento</p>
                   <p className="text-[10px] font-bold text-slate-600">{sale.paymentMethod}</p>
                </div>
                <div>
                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Condições</p>
                   <p className="text-[10px] font-bold text-slate-600">{sale.paymentTerms}</p>
                </div>
             </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <h3 className="text-[9px] font-black text-slate-200 uppercase tracking-widest ml-1">Itens Adicionados</h3>
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 border-b last:border-0 border-slate-50">
                  <div className="flex items-center gap-3">
                      <div className="text-[10px] font-black text-slate-300 w-6">
                         {item.quantity}x
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-xs uppercase italic">{item.name}</span>
                        {item.discount > 0 && (
                          <span className="text-[8px] font-black text-red-500 uppercase">Desc. R$ {item.discount.toFixed(2)} un.</span>
                        )}
                      </div>
                  </div>
                  <span className="font-black text-slate-900 text-xs">R$ {((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              
              {/* Total Box Minimalist */}
              <div className="p-5 flex justify-between items-center border-t border-slate-100">
                 <div>
                    <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Valor do Pedido</span>
                    {sale.installments && sale.installments > 1 && (
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{sale.installments}x de R$ {(sale.total/sale.installments).toFixed(2)}</p>
                    )}
                 </div>
                 <div className="text-right">
                    <span className="text-2xl font-black text-slate-800 italic leading-none">R$ {sale.total.toFixed(2)}</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="text-center">
             <p className="text-[8px] text-slate-200 font-bold uppercase tracking-widest">Registrado em {sale.date} às {sale.time}</p>
          </div>

        </div>

        {/* Footer Minimalist Buttons */}
        <div className="p-6 bg-white border-t border-slate-50 flex gap-3">
          <button 
            onClick={handleShareWhatsApp}
            className="flex-1 bg-white border border-emerald-100 text-emerald-600 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-emerald-50 active:scale-95 transition-all"
          >
            <MessageSquare size={16} /> WhatsApp
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all"
          >
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailModal;
