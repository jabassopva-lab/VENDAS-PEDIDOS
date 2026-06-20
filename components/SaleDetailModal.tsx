import React from 'react';
import { X, Printer, Package, Building2, Calendar, Clock, CreditCard, User, Palmtree, Sun, ShoppingBag, MessageSquare, Share2, Edit3, Trash2, ChevronLeft, ChevronRight, Sliders, CheckCircle2, AlertCircle, Download, FileText } from 'lucide-react';
import { Sale, BusinessProfile, Client } from '../types';
import { convertDriveLink } from '../App.tsx';
import { jsPDF } from 'jspdf';

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  profile: BusinessProfile;
  clients: Client[];
  onEdit: (sale: Sale) => void;
  onDelete: (saleId: string) => void;
  onTogglePaid?: (saleId: string, isPaid: boolean) => void;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  sale, 
  profile, 
  clients, 
  onEdit, 
  onDelete,
  onTogglePaid
}) => {
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

  const generateSalePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let y = 15;

    // Header brand bar
    doc.setFillColor(14, 165, 233); // #0ea5e9
    doc.rect(0, 0, 210, 5, 'F');

    y = 20;

    // Company Name
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // #0f172a
    const companyName = profile.companyName || 'OMNIVENDA';
    doc.text(companyName.toUpperCase(), 15, y);

    // Document status badge
    const isBudget = sale.status === 'ORCAMENTO';
    const statusLabel = isBudget ? 'ORCAMENTO' : 'COMPROVANTE DE PEDIDO';
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(isBudget ? 180 : 21, isBudget ? 83 : 128, isBudget ? 9 : 61);
    doc.setFillColor(isBudget ? 254 : 220, isBudget ? 243 : 252, isBudget ? 199 : 231);
    doc.rect(135, y - 5, 60, 6, 'F');
    doc.text(statusLabel, 165, y - 1, { align: 'center' });

    y += 7;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    if (profile.document) {
      doc.text(`CNPJ/CPF: ${profile.document}`, 15, y);
      y += 5;
    }
    if (profile.phone) {
      doc.text(`WhatsApp: ${profile.phone}`, 15, y);
      y += 5;
    }

    // Right side header info (Order #, Date)
    const orderNum = sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : sale.id.substring(0, 8).toUpperCase();
    doc.text(`PEDIDO N.: #${orderNum}`, 135, y - 5);
    doc.text(`Data: ${sale.date} ${sale.time || ''}`, 135, y);

    y += 5;
    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(15, y, 195, y);
    y += 7;

    // Client card
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 26, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.rect(15, y, 180, 26, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('CLIENTE', 20, y + 5);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(2, 132, 199);
    doc.text(sale.clientName.toUpperCase(), 20, y + 11);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const addressText = clientData?.address || 'Não informado';
    const phoneText = clientData?.phone || 'Não informado';
    doc.text(`WhatsApp/Tel: ${phoneText}`, 20, y + 16);
    doc.text(`Endereço: ${addressText}`, 20, y + 21);

    y += 32;

    // Payment Box
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 14, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.rect(15, y, 180, 14, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('DADOS DE PAGAMENTO', 20, y + 5);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Forma: ${sale.paymentMethod || 'Dinheiro'}`, 20, y + 10);
    doc.text(`Vencimento: ${sale.paymentTerms || 'À vista'}`, 90, y + 10);
    if (sale.installments && sale.installments > 1) {
      doc.text(`Parcelas: ${sale.installments}x de R$ ${(sale.total / sale.installments).toFixed(2)}`, 145, y + 10);
    }

    y += 20;

    // Table of products header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('PRODUTOS DO PEDIDO', 15, y);

    y += 3;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y, 195, y);
    y += 5;

    // Columns
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('DESCRIÇÃO DO PRODUTO', 15, y);
    doc.text('QTD', 115, y, { align: 'center' });
    doc.text('VL. UNITÁRIO', 145, y, { align: 'right' });
    doc.text('SUBTOTAL', 195, y, { align: 'right' });

    y += 3;
    doc.line(15, y, 195, y);
    y += 6;

    // Items
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    sale.items.forEach((item) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
        doc.line(15, y, 195, y);
        y += 5;
      }

      doc.setFont('Helvetica', 'bold');
      doc.text(item.name.toUpperCase(), 15, y);

      doc.setFont('Helvetica', 'normal');
      const unitPrice = item.price - (item.discount || 0);
      doc.text(String(item.quantity), 115, y, { align: 'center' });
      doc.text(`R$ ${unitPrice.toFixed(2)}`, 145, y, { align: 'right' });
      doc.setFont('Helvetica', 'bold');
      doc.text(`R$ ${(unitPrice * item.quantity).toFixed(2)}`, 195, y, { align: 'right' });

      y += 5;
      if (item.discount > 0) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(239, 68, 68);
        doc.text(`Desconto de R$ ${item.discount.toFixed(2)} por un.`, 15, y);
        y += 4;
      }

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      doc.setDrawColor(241, 245, 249);
      doc.line(15, y, 195, y);
      y += 5;
    });

    if (y > 255) {
      doc.addPage();
      y = 20;
    }

    y += 2;
    doc.setFillColor(250, 250, 251);
    doc.rect(15, y, 180, 16, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, y, 180, 16, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('VALOR TOTAL DO PEDIDO:', 20, y + 10);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(14, 165, 233);
    doc.text(`R$ ${sale.total.toFixed(2)}`, 190, y + 11.5, { align: 'right' });

    y += 25;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('DOCUMENTO AUXILIAR DE VENDA E DESCRITIVO DE PRODUTOS • SEM VALOR FISCAL', 105, y, { align: 'center' });
    doc.text('Gerado pelo OmniVenda Digital', 105, y + 4, { align: 'center' });

    return doc;
  };

  const handleDownloadPDF = () => {
    try {
      const doc = generateSalePDF();
      const orderNum = sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : sale.id.substring(0, 8).toUpperCase();
      doc.save(`pedido_${orderNum}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF", err);
      alert("Houve um problema ao gerar o arquivo PDF.");
    }
  };

  const handleSharePDFWhatsApp = async () => {
    const orderNum = sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : sale.id.substring(0, 8).toUpperCase();
    try {
      const doc = generateSalePDF();
      const filename = `pedido_${orderNum}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      // Check if browser/tab can natively share files
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Pedido #${orderNum}`,
          text: `Segue o comprovante em PDF do seu pedido.`
        });
        return;
      }
    } catch (shareErr) {
      console.log("Native share failed/unsupported", shareErr);
    }

    // Fallback: download PDF + open WhatsApp and inform user
    try {
      const doc = generateSalePDF();
      doc.save(`pedido_${orderNum}.pdf`);
      
      // Let user know their PDF was downloaded and that they can attach it
      alert(`📄 PDF do Pedido #${orderNum} foi baixado com sucesso!\n\nAgora abriremos o WhatsApp. Basta anexar o arquivo PDF baixado (clipe de papel) na conversa do WhatsApp.`);
      
      // Open WhatsApp with text summary as well
      handleShareWhatsApp();
    } catch (err) {
      console.error("Erro no compartilhamento fallback", err);
      handleShareWhatsApp();
    }
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
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                            <p class="client-detail"><strong>Vencimento:</strong> <strong>${(() => {
                                const terms = sale.paymentTerms || 'À vista';
                                const match = terms.match(/(\d{2}\/\d{2}\/\d{4})/);
                                return match ? match[1] : terms;
                            })()}</strong></p>
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
    <div className="fixed inset-0 bg-sky-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:rounded-[2rem] sm:max-w-2xl shadow-2xl overflow-hidden flex flex-col border-0 sm:border border-slate-200 animate-in zoom-in-95 relative">
        {/* Confirmação de Exclusão Overlay */}
        {showConfirmDelete && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">EXCLUIR PEDIDO?</h3>
            <p className="text-sm text-slate-500 mb-8">Esta ação não pode ser desfeita e os itens retornarão ao controle de estoque.</p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
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
          <div className="bg-white px-6 py-5 flex justify-between items-center border-b border-slate-100 shrink-0">
             <div className="flex items-center gap-3.5">
                <div className="bg-sky-50 p-2.5 rounded-2xl border border-sky-100/50 text-[#0ea5e9]">
                   <ShoppingBag size={22} className="stroke-[2.5]" />
                </div>
                <div>
                   <h2 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">Visualizar Pedido</h2>
                   <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pedido No. {sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : '...'}</span>
                     <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                     <span className="text-[10px] font-medium text-slate-400 font-mono select-all">Ref: {sale.id.slice(0, 8)}</span>
                   </div>
                </div>
             </div>
             <div className="flex gap-2.5">
                <button 
                  onClick={() => setViewMode('ACTIONS')} 
                  className="bg-sky-50 hover:bg-sky-100 p-2.5 rounded-xl text-[#0ea5e9] transition-all flex items-center gap-2 px-4 shadow-sm active:scale-95 border border-sky-100" 
                  title="Ações do Pedido"
                >
                  <Sliders size={15} />
                  <span className="text-xs font-bold">Opções</span>
                </button>
                <button onClick={onClose} className="bg-slate-50 p-2.5 rounded-xl hover:bg-slate-100 transition-all text-slate-400 active:scale-95 border border-slate-100">
                   <X size={18} />
                </button>
             </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-5 flex justify-between items-center shadow-md shrink-0">
             <div className="flex items-center gap-3.5">
                <div className="bg-white/15 p-2.5 rounded-2xl">
                   <Sliders className="text-white" size={22} />
                </div>
                <div>
                   <h2 className="text-sm sm:text-base font-extrabold tracking-tight">Gerenciar Pedido</h2>
                   <p className="text-xs font-medium text-sky-100 mt-0.5">Número de pedido: #{sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : '...'}</p>
                </div>
             </div>
             <div className="flex gap-2.5">
                <button 
                  onClick={() => setViewMode('VIEW')} 
                  className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-white transition-all flex items-center gap-2 px-4 border border-white/10 active:scale-95 text-xs font-bold" 
                  title="Voltar para o Pedido"
                >
                  <ChevronLeft size={16} />
                  <span>Ver Pedido</span>
                </button>
                <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-white/95 transition-all active:scale-95">
                   <X size={18} />
                </button>
             </div>
          </div>
        )}

        {viewMode === 'VIEW' ? (
          <div className="overflow-y-auto p-4 sm:p-6 bg-slate-50/50 flex-1 space-y-5">
            
            {/* The Document Sheet */}
            <div className="bg-white rounded-[2rem] border border-slate-150 shadow-md overflow-hidden flex flex-col relative">
              {/* Brand Top bar */}
              <div className="h-2 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7]"></div>
              
              {/* Receipt Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex flex-col items-start">
                  {profile.logoUrl && (
                    <img 
                      src={currentLogo} 
                      className="max-h-14 max-w-[160px] mb-3 object-contain" 
                      alt="Logo" 
                      referrerPolicy="no-referrer" 
                    />
                  )}
                  <h3 className="text-base font-extrabold text-slate-800 uppercase italic tracking-tight leading-none">{profile.companyName || 'OMNIVENDA'}</h3>
                  {profile.document && <p className="text-xs text-slate-500 font-medium mt-2 leading-none">CNPJ/CPF: {profile.document}</p>}
                  {profile.phone && <p className="text-xs text-slate-500 font-medium mt-1 leading-none">WhatsApp: {profile.phone}</p>}
                </div>
                
                <div className="flex flex-col items-end text-right self-stretch sm:self-auto justify-between sm:justify-start gap-1 w-full sm:w-auto mt-2 sm:mt-0">
                  <span className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full ${sale.status === 'ORCAMENTO' ? 'bg-amber-100/80 text-amber-800' : 'bg-green-100/80 text-green-800'}`}>
                    {sale.status === 'ORCAMENTO' ? 'ORÇAMENTO' : 'COMPROVANTE DE PEDIDO'}
                  </span>
                  <div className="mt-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">PEDIDO NO.</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">
                      {sale.orderNumber ? String(sale.orderNumber).padStart(4, '0') : '...'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-1 bg-slate-100/50 px-2 py-0.5 rounded">
                    {sale.date} às {sale.time}
                  </p>
                </div>
              </div>

              {/* Grid: Cliente & Informações de Venda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 sm:p-6 border-b border-slate-100 bg-[#fafafb]">
                {/* Column: Cliente */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2 block">CLIENTE</span>
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 flex-1 shadow-sm">
                    <p className="font-extrabold text-[#0284c7] text-sm uppercase italic">{sale.clientName}</p>
                    {clientData?.phone && (
                      <p className="text-xs text-slate-600 mt-2">
                        <strong className="text-slate-400 font-bold mr-1">WhatsApp / Tel:</strong> {clientData.phone}
                      </p>
                    )}
                    {clientData?.address && (
                      <p className="text-xs text-slate-600 mt-1">
                        <strong className="text-slate-400 font-bold mr-1">Endereço:</strong> {clientData.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Column: Info Venda */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2 block">DADOS DE PAGAMENTO</span>
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 flex-1 space-y-1.5 shadow-sm">
                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-400 font-bold mr-1">Forma de Pagamento:</strong> {sale.paymentMethod || 'Dinheiro'}
                    </p>
                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-400 font-bold mr-1">Vencimento:</strong> 
                      <strong className="text-slate-900 font-bold">
                        {(() => {
                          const terms = sale.paymentTerms || 'À vista';
                          const match = terms.match(/(\d{2}\/\d{2}\/\d{4})/);
                          return match ? match[1] : terms;
                        })()}
                      </strong>
                    </p>
                    <div className="pt-1.5 border-t border-slate-50 mt-1">
                      <p className="text-[10px] text-slate-400 italic">
                        Documento sem valor fiscal
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table of items */}
              <div className="p-5 sm:p-6 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-3.5 block">PRODUTOS DO PEDIDO</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[340px]">
                    <thead>
                      <tr className="border-b border-slate-100/80">
                        <th className="pb-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">ITEM / ESPECIFICAÇÃO</th>
                        <th className="pb-2 text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider w-14">QTD</th>
                        <th className="pb-2 text-right font-bold text-[10px] text-slate-400 uppercase tracking-wider w-24">VL. UNITÁRIO</th>
                        <th className="pb-2 text-right font-bold text-[10px] text-slate-400 uppercase tracking-wider w-24">SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sale.items.map((item, idx) => {
                        const unitPrice = item.price - (item.discount || 0);
                        return (
                          <tr key={idx} className="text-slate-700 text-xs sm:text-sm">
                            <td className="py-3 font-semibold uppercase text-slate-800">
                              {item.name}
                              {item.discount > 0 && (
                                <span className="block text-[10px] font-bold text-red-500 uppercase mt-0.5">Desc. R$ {item.discount.toFixed(2)} un.</span>
                              )}
                            </td>
                            <td className="py-3 text-center text-slate-500 font-medium">{item.quantity}</td>
                            <td className="py-3 text-right text-slate-500">R$ {unitPrice.toFixed(2)}</td>
                            <td className="py-3 text-right font-extrabold text-slate-800">R$ {(unitPrice * item.quantity).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Row */}
              <div className="p-5 sm:p-6 bg-[#fafafb] flex justify-end items-center">
                <div className="flex items-baseline gap-3 text-right">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">VALOR TOTAL DO PEDIDO:</span>
                  <span className="text-2xl sm:text-3xl font-black text-[#0ea5e9]">R$ {sale.total.toFixed(2)}</span>
                </div>
              </div>

            </div>

            <p className="text-center text-xs text-slate-450 font-bold uppercase tracking-wider mt-2">
              Agradecemos a preferência e confiança!
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/50 flex-1">
            <p className="text-xs font-bold text-slate-500 ml-1.5 block">Opções disponíveis para o pedido:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Imprimir */}
              <button 
                onClick={handlePrint}
                className="bg-white p-5 rounded-[2rem] border border-slate-150 flex flex-col justify-between items-stretch text-left active:scale-98 transition-all group hover:border-[#0ea5e9] hover:shadow-lg hover:shadow-sky-50 shadow-sm"
              >
                 <div className="w-11 h-11 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform mb-4 border border-sky-100">
                   <Printer size={22} className="stroke-[2.5]" />
                 </div>
                 <div className="text-left font-sans">
                   <p className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">Imprimir Comprovante</p>
                   <p className="text-xs text-slate-500 mt-1.5 leading-snug">Imprimir o pedido termicamente ou gerar PDF da via de venda.</p>
                 </div>
              </button>

              {/* WhatsApp Text */}
              <button 
                onClick={handleShareWhatsApp}
                className="bg-white p-5 rounded-[2rem] border border-slate-150 flex flex-col justify-between items-stretch text-left active:scale-98 transition-all group hover:border-[#0284c7] hover:shadow-lg hover:shadow-sky-50 shadow-sm"
              >
                 <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform mb-4 border border-sky-100">
                   <MessageSquare size={22} className="stroke-[2.5]" />
                 </div>
                 <div className="text-left font-sans">
                   <p className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">Enviar no WhatsApp (Texto)</p>
                   <p className="text-xs text-slate-500 mt-1.5 leading-snug">Compartilhar recibo de venda em formato de texto.</p>
                 </div>
              </button>

              {/* Send PDF on WhatsApp */}
              <button 
                onClick={handleSharePDFWhatsApp}
                className="bg-white p-5 rounded-[2rem] border border-slate-150 flex flex-col justify-between items-stretch text-left active:scale-98 transition-all group hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-50 shadow-sm"
              >
                 <div className="w-11 h-11 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform mb-4 border border-emerald-100">
                   <Share2 size={22} className="stroke-[2.5]" />
                 </div>
                 <div className="text-left font-sans">
                   <p className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">Enviar PDF no WhatsApp</p>
                   <p className="text-xs text-slate-500 mt-1.5 leading-snug">Gerar PDF e compartilhar diretamente ou via download + envio rápido.</p>
                 </div>
              </button>

              {/* Download PDF directly */}
              <button 
                onClick={handleDownloadPDF}
                className="bg-white p-5 rounded-[2rem] border border-slate-150 flex flex-col justify-between items-stretch text-left active:scale-98 transition-all group hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-50 shadow-sm"
              >
                 <div className="w-11 h-11 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform mb-4 border border-indigo-100">
                   <Download size={22} className="stroke-[2.5]" />
                 </div>
                 <div className="text-left font-sans">
                   <p className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">Baixar PDF do Pedido</p>
                   <p className="text-xs text-slate-500 mt-1.5 leading-snug">Gerar e salvar o arquivo PDF em formato A4 profissional no seu dispositivo.</p>
                 </div>
              </button>

              {/* Editar */}
              <button 
                onClick={() => {
                  onEdit(sale);
                  onClose();
                }}
                className="bg-white p-5 rounded-[2rem] border border-slate-150 flex flex-col justify-between items-stretch text-left active:scale-98 transition-all group hover:border-blue-500 hover:shadow-lg hover:shadow-blue-50 shadow-sm"
              >
                 <div className="w-11 h-11 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform mb-4 border border-blue-100">
                   <Edit3 size={22} className="stroke-[2.5]" />
                 </div>
                 <div className="text-left font-sans">
                   <p className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">Editar Pedido</p>
                   <p className="text-xs text-slate-500 mt-1.5 leading-snug">Modificar itens do pedido, alterar quantidades, pagamentos ou descontos.</p>
                 </div>
              </button>

              {/* Dar baixa / Estornar Pagamento */}
              {onTogglePaid && (
                <button 
                  onClick={() => onTogglePaid(sale.id, !sale.isPaid)}
                  className={`bg-white p-5 rounded-[2rem] border border-slate-150 flex flex-col justify-between items-stretch text-left active:scale-98 transition-all group hover:shadow-lg shadow-sm ${
                    sale.isPaid 
                      ? 'hover:border-amber-500 hover:shadow-amber-50 hover:bg-amber-50/10' 
                      : 'hover:border-green-500 hover:shadow-green-50 hover:bg-green-50/10'
                  }`}
                >
                   <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform mb-4 border ${
                     sale.isPaid 
                       ? 'bg-amber-50 text-amber-550 border-amber-100' 
                       : 'bg-green-50 text-green-500 border-green-100'
                   }`}>
                     {sale.isPaid ? (
                       <AlertCircle size={22} className="stroke-[2.5]" />
                     ) : (
                       <CheckCircle2 size={22} className="stroke-[2.5]" />
                     )}
                   </div>
                   <div className="text-left font-sans">
                     <p className={`font-extrabold text-sm sm:text-base leading-tight ${sale.isPaid ? 'text-amber-750' : 'text-green-600'}`}>
                       {sale.isPaid ? 'Estornar Pagamento' : 'Dar Baixa (Pago)'}
                     </p>
                     <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                       {sale.isPaid 
                         ? 'Definir o status deste pedido de volta para PENDENTE de pagamento.' 
                         : 'Registrar o recebimento deste pedido, marcando-o como Pago.'}
                     </p>
                   </div>
                </button>
              )}

              {/* Excluir */}
              <button 
                onClick={handleDelete}
                className="bg-white p-5 rounded-[2rem] border border-slate-150 flex flex-col justify-between items-stretch text-left active:scale-98 transition-all group hover:border-red-500 hover:shadow-lg hover:shadow-red-50 hover:bg-red-50/10 shadow-sm"
              >
                 <div className="w-11 h-11 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform mb-4 border border-red-100">
                   <Trash2 size={22} className="stroke-[2.5]" />
                 </div>
                 <div className="text-left font-sans">
                   <p className="font-extrabold text-red-600 text-sm sm:text-base leading-tight font-sans">Excluir Registro</p>
                   <p className="text-xs text-slate-500 mt-1.5 leading-snug">Apagar pedido de forma permanente e restabelecer o estoque.</p>
                 </div>
              </button>
            </div>
          </div>
        )}

        {/* Footer Minimalist Buttons */}
        {viewMode === 'VIEW' ? (
          <div className="p-6 bg-white border-t border-slate-50 shrink-0">
            <button 
              onClick={() => setViewMode('ACTIONS')}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 hover:shadow-xl hover:shadow-sky-100/50 py-4.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm text-white tracking-wide active:scale-95 transition-all text-center group font-sans shadow-md shadow-sky-100"
            >
              <Sliders size={16} className="group-hover:rotate-12 transition-transform" />
              <span>Opções e Gerenciamento do Pedido</span>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
            <button 
              onClick={() => setViewMode('VIEW')}
              className="w-full bg-white border border-slate-200 text-slate-600 py-4.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm tracking-wide hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all text-center font-sans shadow-sm"
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
