import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  User,
  Trash2,
  CreditCard,
  Calendar,
  Package,
  Layers,
  FileText,
  Truck,
  Banknote,
  Edit3,
  QrCode,
  Loader2,
} from "lucide-react";
import { Product, Client, CartItem, Sale } from "../types";

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  clients: Client[];
  onFinishSale: (saleData: Partial<Sale>) => void;
  initialData?: Sale | null;
}

const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  clients,
  onFinishSale,
  initialData,
}) => {
  const [step, setStep] = useState<"SELECTION" | "CART">("SELECTION");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<string>("Dinheiro");
  const [paymentType, setPaymentType] = useState<"A_VISTA" | "PARCELADO">(
    "A_VISTA",
  );
  const [installments, setInstallments] = useState<number>(1);
  const [dueDate, setDueDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Status State
  const [isPaid, setIsPaid] = useState(false);
  const [isPendingDelivery, setIsPendingDelivery] = useState(false);
  const [isBudget, setIsBudget] = useState(false);

  const paymentMethods = [
    {
      id: "Dinheiro",
      icon: Banknote,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    { id: "Pix", icon: QrCode, color: "text-teal-600", bg: "bg-teal-50" },
    {
      id: "Boleto",
      icon: FileText,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      id: "Cartão",
      icon: CreditCard,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setStep("SELECTION");
        setCart(initialData.items || []);
        setSearchQuery("");
        const client = clients.find((c) => c.id === initialData.clientId);
        setClientSearchQuery(client?.name.toUpperCase() || "");
        setSelectedClientId(initialData.clientId);
        setPaymentMethod(initialData.paymentMethod || "Dinheiro");
        setIsBudget(initialData.status === "ORCAMENTO");
        setIsPaid(initialData.isPaid ?? false);
        setIsPendingDelivery(initialData.deliveryStatus === "PENDENTE");
        setInstallments(initialData.installments || 1);
        setPaymentType(initialData.installments > 1 ? "PARCELADO" : "A_VISTA");
      } else {
        setStep("SELECTION");
        setCart([]);
        setSearchQuery("");
        setClientSearchQuery("");
        setSelectedClientId("");
        setPaymentMethod("Dinheiro");
        setPaymentType("A_VISTA");
        setInstallments(1);
        setDueDate(new Date().toISOString().split("T")[0]);
        setIsPaid(false);
        setIsPendingDelivery(false);
        setIsBudget(false);
      }
    }
  }, [isOpen, initialData]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery),
    );
  }, [products, searchQuery]);

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [clients]);

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return [];
    return sortedClients.filter((c) =>
      c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()),
    );
  }, [sortedClients, clientSearchQuery]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        { ...product, quantity: 1, useWholesale: false, discount: 0 },
      ];
    });
  };

  const toggleWholesale = (productId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newUseWholesale = !item.useWholesale;
          const product = products.find((p) => p.id === productId);
          const newPrice =
            newUseWholesale && product?.wholesalePrice
              ? product.wholesalePrice
              : product?.price || item.price;
          return {
            ...item,
            useWholesale: newUseWholesale,
            price: newPrice,
            discount: 0,
          };
        }
        return item;
      }),
    );
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          return { ...item, discount: Math.max(0, discount) };
        }
        return item;
      }),
    );
  };

  const cartTotal = cart.reduce(
    (acc, item) =>
      acc +
      ((Number(item.price) || 0) - (Number(item.discount) || 0)) *
        (Number(item.quantity) || 0),
    0,
  );
  const cartCost = cart.reduce(
    (acc, item) =>
      acc + (Number(item.costPrice) || 0) * (Number(item.quantity) || 0),
    0,
  );
  const cartCount = cart.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0),
    0,
  );

  const handleFinish = async (statusOverride?: "ORCAMENTO" | "FINALIZADA") => {
    if (isFinishing) return;
    if (!selectedClientId) {
      alert("Por favor, selecione um cliente.");
      return;
    }
    if (cart.length === 0) {
      alert("O carrinho está vazio.");
      return;
    }

    setIsFinishing(true);
    try {
      let formattedTerms = "";
      const [year, month, day] = dueDate.split("-");
      const dateStr = `${day}/${month}/${year}`;

      if (paymentType === "A_VISTA") {
        formattedTerms = `À vista (${dateStr})`;
      } else {
        formattedTerms = `${installments}x (1ª em ${dateStr})`;
      }

      const finalStatus =
        statusOverride || (isBudget ? "ORCAMENTO" : "FINALIZADA");

      await onFinishSale({
        id: initialData?.id,
        clientId: selectedClientId,
        items: cart,
        total: cartTotal,
        profit: cartTotal - cartCost,
        paymentMethod,
        paymentTerms: formattedTerms,
        installments: paymentType === "PARCELADO" ? installments : 1,
        status: finalStatus,
        isPaid: finalStatus === "ORCAMENTO" ? false : isPaid,
        deliveryStatus: isPendingDelivery ? "PENDENTE" : "ENTREGUE",
      });
      // O fechamento do modal agora é controlado pela função handleFinishSale no App.tsx
    } catch (e: any) {
      console.error(e);
      alert(
        "Houve um problema ao finalizar a venda no modal. Verifique os dados e tente novamente.",
      );
    } finally {
      setIsFinishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-md z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {initialData ? (
              <Edit3 className="text-blue-600" />
            ) : (
              <ShoppingCart className="text-blue-600" />
            )}
            {initialData ? "Editar Pedido" : "Nova Venda"}
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            {step === "SELECTION" ? "Ajuste os itens" : "Confirmação e Status"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 text-gray-600"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
        {step === "SELECTION" && (
          <>
            <div className="p-4 bg-white border-b border-gray-100 space-y-3">
              <div className="relative">
                <User
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="-- Buscar ou Selecionar Cliente --"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-gray-700 font-bold italic uppercase"
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setIsClientDropdownOpen(true);
                    if (!e.target.value) setSelectedClientId("");
                  }}
                  onFocus={() => setIsClientDropdownOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setIsClientDropdownOpen(false), 200)
                  }
                />
                {isClientDropdownOpen && clientSearchQuery && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-2xl z-50 max-h-60 overflow-y-auto">
                    {filteredClients.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 hover:bg-blue-50 cursor-pointer font-black text-slate-700 uppercase italic text-[10px] border-b last:border-0 border-slate-50 flex justify-between items-center"
                        onClick={() => {
                          setSelectedClientId(c.id);
                          setClientSearchQuery(c.name.toUpperCase());
                          setIsClientDropdownOpen(false);
                        }}
                      >
                        <span>{c.name.toUpperCase()}</span>
                        {selectedClientId === c.id && (
                          <Check size={14} className="text-blue-600" />
                        )}
                      </div>
                    ))}
                    {filteredClients.length === 0 && (
                      <div className="p-4 text-slate-400 text-xs font-black uppercase italic">
                        Nenhum cliente encontrado
                      </div>
                    )}
                  </div>
                )}
                {isClientDropdownOpen &&
                  !clientSearchQuery &&
                  sortedClients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-2xl z-50 max-h-60 overflow-y-auto">
                      {sortedClients.map((c) => (
                        <div
                          key={c.id}
                          className="p-4 hover:bg-blue-50 cursor-pointer font-black text-slate-700 uppercase italic text-[10px] border-b last:border-0 border-slate-50 flex justify-between items-center"
                          onClick={() => {
                            setSelectedClientId(c.id);
                            setClientSearchQuery(c.name.toUpperCase());
                            setIsClientDropdownOpen(false);
                          }}
                        >
                          <span>{c.name.toUpperCase()}</span>
                          {selectedClientId === c.id && (
                            <Check size={14} className="text-blue-600" />
                          )}
                        </div>
                      ))}
                      <div className="p-2 text-center bg-slate-50 text-[8px] font-black text-slate-400 uppercase italic border-t border-slate-100">
                        Mostrando todos os {sortedClients.length} clientes cadastrados
                      </div>
                    </div>
                  )}
              </div>

              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Buscar produto por nome..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredProducts.map((product) => {
                const inCart = cart.find((c) => c.id === product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={18} className="text-gray-300" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 uppercase text-xs italic leading-tight">
                          {product.name}
                        </h4>
                        <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">
                          Estoque: {product.stock}
                        </p>
                        <p className="font-black text-blue-600 text-xs mt-0.5">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-3 bg-blue-600 px-3 py-1.5 rounded-xl text-white shadow-md">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="p-1 hover:bg-white/20 rounded"
                        >
                          <Minus size={16} strokeWidth={3} />
                        </button>
                        <span className="font-black min-w-[20px] text-center">
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="p-1 hover:bg-white/20 rounded"
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-white text-blue-600 border-2 border-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === "CART" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-md border-b-4 border-slate-100 space-y-5">
              {/* Método de Pagamento */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-4 gap-3.5">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isActive = paymentMethod === method.id;

                    let activeColorClass = "";
                    let activeBg = "";
                    let activeBorder = "";
                    let baseColorClass = "";

                    if (method.id === "Dinheiro") {
                      activeColorClass =
                        "text-emerald-600 bg-emerald-50 border-emerald-100/80";
                      activeBg = "bg-emerald-50/40";
                      activeBorder =
                        "border-emerald-500 shadow-sm shadow-emerald-50";
                      baseColorClass =
                        "text-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/65 border-emerald-100/30";
                    } else if (method.id === "Pix") {
                      activeColorClass =
                        "text-teal-600 bg-teal-50 border-teal-100/80";
                      activeBg = "bg-teal-50/40";
                      activeBorder =
                        "border-teal-500 shadow-sm shadow-teal-50";
                      baseColorClass =
                        "text-teal-500 bg-teal-50/30 hover:bg-teal-50/65 border-teal-100/30";
                    } else if (method.id === "Boleto") {
                      activeColorClass =
                        "text-amber-600 bg-amber-50 border-amber-100/80";
                      activeBg = "bg-amber-50/40";
                      activeBorder =
                        "border-amber-500 shadow-sm shadow-amber-50";
                      baseColorClass =
                        "text-amber-500 bg-amber-50/30 hover:bg-amber-50/65 border-amber-100/30";
                    } else {
                      // Cartão
                      activeColorClass =
                        "text-indigo-600 bg-indigo-50 border-indigo-100/80";
                      activeBg = "bg-indigo-50/40";
                      activeBorder =
                        "border-indigo-500 shadow-sm shadow-indigo-50";
                      baseColorClass =
                        "text-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/65 border-indigo-100/30";
                    }

                    return (
                      <button
                        type="button"
                        key={method.id}
                        onClick={() => {
                          setPaymentMethod(method.id);
                          if (method.id === "Boleto") {
                            setIsPaid(false);
                          } else if (
                            method.id === "Dinheiro" ||
                            method.id === "Pix"
                          ) {
                            setIsPaid(true);
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all active:scale-95 duration-150 ${
                          isActive
                            ? `${activeBorder} ${activeBg}`
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/20"
                        }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                            isActive
                              ? activeColorClass
                              : `${baseColorClass} opacity-80 hover:opacity-100`
                          }`}
                        >
                          <Icon size={20} className="stroke-[2.5]" />
                        </div>
                        <span
                          className={`text-[10px] sm:text-[11px] font-black uppercase italic tracking-wider mt-2.5 transition-colors ${
                            isActive ? "text-slate-800" : "text-slate-450"
                          }`}
                        >
                          {method.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-2">
                <button
                  type="button"
                  onClick={() => setIsPaid(!isPaid)}
                  className={`relative overflow-hidden flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 active:scale-95 ${
                    isPaid
                      ? "bg-emerald-50/50 border-emerald-500 text-emerald-800 shadow-xs shadow-emerald-50"
                      : "bg-rose-50/50 border-rose-300 text-rose-800 shadow-xs shadow-rose-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isPaid
                        ? "bg-emerald-100/85 text-emerald-600 border border-emerald-250"
                        : "bg-rose-100/85 text-rose-600 border border-rose-250"
                    }`}
                  >
                    {isPaid ? (
                      <Check size={15} strokeWidth={3} />
                    ) : (
                      <Calendar size={15} strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest leading-none mb-0.5">
                      Pagamento
                    </span>
                    <span className="font-black text-[10px] uppercase italic tracking-wider leading-none">
                      {isPaid ? "Valor Recebido" : "A Receber"}
                    </span>
                  </div>
                  <span
                    className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${
                      isPaid ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPendingDelivery(!isPendingDelivery)}
                  className={`relative overflow-hidden flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 active:scale-95 ${
                    isPendingDelivery
                      ? "bg-purple-50/50 border-purple-500 text-purple-800 shadow-xs shadow-purple-50"
                      : "bg-sky-50/50 border-sky-300 text-sky-800 shadow-xs shadow-sky-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isPendingDelivery
                        ? "bg-purple-100/85 text-purple-600 border border-purple-250"
                        : "bg-sky-100/85 text-sky-600 border border-sky-250"
                    }`}
                  >
                    {isPendingDelivery ? (
                      <Layers size={15} strokeWidth={2.5} />
                    ) : (
                      <Truck size={15} strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest leading-none mb-0.5">
                      Entrega
                    </span>
                    <span className="font-black text-[10px] uppercase italic tracking-wider leading-none">
                      {isPendingDelivery ? "Entrega Pendente" : "Entregue"}
                    </span>
                  </div>
                  <span
                    className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${
                      isPendingDelivery
                        ? "bg-purple-500 animate-pulse"
                        : "bg-sky-500"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
                  <button
                    onClick={() => setPaymentType("A_VISTA")}
                    className={`py-2 rounded-xl font-black text-xs uppercase transition-all ${paymentType === "A_VISTA" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
                  >
                    À Vista
                  </button>
                  <button
                    onClick={() => {
                      setPaymentType("PARCELADO");
                      setIsPaid(false);
                    }}
                    className={`py-2 rounded-xl font-black text-xs uppercase transition-all ${paymentType === "PARCELADO" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
                  >
                    Parcelado
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {paymentType === "PARCELADO" && (
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                        Parcelas
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="12"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-slate-800 font-bold"
                        value={installments}
                        onChange={(e) =>
                          setInstallments(parseInt(e.target.value) || 2)
                        }
                      />
                    </div>
                  )}
                  <div
                    className={paymentType === "A_VISTA" ? "col-span-2" : ""}
                  >
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                      Vencimento / Recebimento
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-slate-800 font-bold"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                    
                    {/* Atalhos de Prazos Rápidos */}
                    <div className="mt-2.5 space-y-1.5">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">
                        Definir Prazo (Dias):
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[14, 21, 30].map((days) => {
                          const d = new Date();
                          d.setDate(d.getDate() + days);
                          const targetDate = d.toISOString().split("T")[0];
                          const isActive = dueDate === targetDate;
                          return (
                            <button
                              type="button"
                              key={days}
                              onClick={() => setDueDate(targetDate)}
                              className={`py-2 px-3 rounded-xl text-[10px] font-bold uppercase transition-all duration-150 border active:scale-95 text-center ${
                                isActive
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                              }`}
                            >
                              +{days} dias
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center font-black text-blue-600 text-[10px] border border-blue-100">
                        {item.quantity}x
                      </div>
                      <h4 className="font-black text-slate-800 uppercase italic text-[10px] leading-tight">
                        {item.name}
                      </h4>
                    </div>
                    <span className="font-black text-slate-900 text-[11px] tabular-nums">
                      R${" "}
                      {(
                        (item.price - (item.discount || 0)) *
                        item.quantity
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 bg-red-50/50 p-2 rounded-xl border border-red-100 flex-1 group focus-within:border-red-300 transition-colors">
                      <span className="text-[8px] font-black text-red-400 uppercase ml-1 tracking-wider">
                        Desc. Unit.
                      </span>
                      <div className="flex items-center gap-1 flex-1 justify-end">
                        <span className="text-[10px] font-black text-red-300">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          className="w-16 bg-transparent outline-none text-[11px] font-black text-red-600 text-right placeholder:text-red-200"
                          value={item.discount || ""}
                          onChange={(e) =>
                            updateDiscount(
                              item.id,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                    </div>

                    {item.wholesalePrice && (
                      <button
                        type="button"
                        onClick={() => toggleWholesale(item.id)}
                        className={`text-[9px] font-black px-3 py-2 rounded-xl border transition-all whitespace-nowrap active:scale-95 ${item.useWholesale ? "bg-purple-600 border-purple-600 text-white shadow-md" : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"}`}
                      >
                        {item.useWholesale ? "ATACADO ATIVO" : "USAR ATACADO"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t-4 border-yellow-400 p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-3xl font-black text-blue-600 italic">
            R$ {cartTotal.toFixed(2)}
          </p>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Qtd Itens
            </p>
            <p className="text-xl font-black text-slate-800 leading-none">
              {cartCount}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {step === "SELECTION" ? (
            <button
              onClick={() => setStep("CART")}
              className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl uppercase text-xs italic"
              disabled={cart.length === 0}
            >
              Revisar Alterações
            </button>
          ) : (
            <>
              <button
                disabled={isFinishing}
                onClick={() => setStep("SELECTION")}
                className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl uppercase text-xs italic"
              >
                Voltar
              </button>
              <button
                disabled={isFinishing}
                onClick={() => handleFinish("ORCAMENTO")}
                className="flex-1 bg-amber-100 text-amber-700 font-black py-4 rounded-2xl uppercase text-xs italic flex items-center justify-center gap-1 border-2 border-amber-200"
              >
                {isFinishing ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <FileText size={16} />
                )}{" "}
                Orçamento
              </button>
              <button
                disabled={isFinishing}
                onClick={() => handleFinish("FINALIZADA")}
                className="flex-[1.5] bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 uppercase text-xs italic"
              >
                {isFinishing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Check size={20} strokeWidth={4} />
                )}{" "}
                {initialData ? "Salvar Edição" : "Finalizar"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewSaleModal;
