import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Package,
  Plus,
  Search,
  ArrowLeft,
  Loader2,
  TrendingUp,
  ClipboardList,
  Calendar,
  Clock,
  ShoppingBag,
  Settings as SettingsIcon,
  Filter,
  ChevronRight,
  Eye,
  Sparkles,
  ArrowUpRight,
  Wallet,
  Sun,
  Palmtree,
  CheckCircle2,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Database,
  BarChart3,
  ChevronLeft,
  FileText,
  ArrowRight,
  LogOut,
  Store,
  Info,
  Printer,
  RefreshCw,
  Trash2,
  Bell,
  ExternalLink,
  Ban,
  Smartphone,
  Mail,
  MoreVertical,
  ShieldAlert,
  DatabaseZap,
  Cloud,
  Lock,
  EyeOff,
  UserPlus,
  LogIn,
  X,
  DollarSign,
  LayoutDashboard,
  Edit3,
  MessageSquare,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import ProductModal from "./components/ProductModal.tsx";
import ClientForm from "./components/ClientForm.tsx";
import NewSaleModal from "./components/NewSaleModal.tsx";
import SaleDetailModal from "./components/SaleDetailModal.tsx";
import ClientReportModal from "./components/ClientReportModal.tsx";
import SettingsForm from "./components/SettingsForm.tsx";
import CostCorrectionTool from "./components/CostCorrectionTool.tsx";
import AuthScreen from "./components/AuthScreen.tsx";
import {
  supabase,
  db,
  isConfigured,
  setImpersonatedUserId,
} from "./services/supabase.ts";
import {
  Product,
  Client,
  ModalType,
  Screen,
  Sale,
  BusinessProfile,
  SalesData,
} from "./types.ts";

const DEFAULT_PROFILE: BusinessProfile = {
  companyName: "Minha Empresa",
  document: "",
  phone: "",
  email: "",
  address: "",
  logoUrl: "",
  planStatus: "START",
  nextBilling: "-",
};

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const convertDriveLink = (url: string): string => {
  if (!url || typeof url !== "string") return "";
  if (url.includes("drive.google.com")) {
    const matches =
      url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (matches && matches[1]) {
      const fileId = matches[1];
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  }
  return url;
};

const EmptyState = ({
  message,
  icon: Icon = Store,
}: {
  message: string;
  icon?: any;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in zoom-in duration-500">
    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-200 mb-4">
      <Icon size={40} />
    </div>
    <h3 className="text-lg font-black text-amber-900/40 uppercase tracking-widest leading-tight">
      {message}
    </h3>
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>("HOME");
  const [saveNotify, setSaveNotify] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const salesHistoryWithNumbers = useMemo(() => {
    const getTimestamp = (s: Sale) => {
      if (s.created_at) {
        const t = new Date(s.created_at).getTime();
        if (!isNaN(t)) return t;
      }
      if (s.date) {
        const parts = s.date.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          let h = 0, m = 0;
          if (s.time) {
            const tParts = s.time.split(":");
            if (tParts.length >= 2) {
              h = parseInt(tParts[0], 10);
              m = parseInt(tParts[1], 10);
            }
          }
          const parsedMs = new Date(year, month, day, h, m).getTime();
          if (!isNaN(parsedMs)) return parsedMs;
        }
      }
      return 0;
    };

    const sortedAsc = [...salesHistory].sort((a, b) => {
      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);
      if (timeA !== timeB) return timeA - timeB;
      const dateComp = (a.date || "").localeCompare(b.date || "");
      if (dateComp !== 0) return dateComp;
      return (a.time || "").localeCompare(b.time || "");
    });

    return sortedAsc
      .map((sale, index) => ({
        ...sale,
        orderNumber: index + 1,
      }))
      .reverse();
  }, [salesHistory]);
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile>(DEFAULT_PROFILE);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    if (newPassword.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      alert("Senha atualizada com sucesso!");
      setIsResettingPassword(false);
    } catch (err: any) {
      alert("Erro ao atualizar senha: " + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const [reportTab, setReportTab] = useState<"DIARIO" | "MENSAL" | "ANUAL">(
    "MENSAL",
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [productModal, setProductModal] = useState<{
    type: ModalType;
    data?: Product;
  }>({ type: ModalType.NONE });
  const [clientModal, setClientModal] = useState<{
    type: ModalType;
    data?: Client;
  }>({ type: ModalType.NONE });
  const [saleModal, setSaleModal] = useState<boolean>(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedClientReport, setSelectedClientReport] = useState<{
    client: Client | { id: string; name: string; phone?: string; email?: string; address?: string; document?: string };
    sales: Sale[];
  } | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [filterClientId, setFilterClientId] = useState<string>("ALL");
  const [filterProductId, setFilterProductId] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [allBusinessesStats, setAllBusinessesStats] = useState<any[]>([]);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [subscriptionModal, setSubscriptionModal] = useState<{
    isOpen: boolean;
    business: any | null;
  }>({ isOpen: false, business: null });

  const resetBusinessData = () => {
    setProducts([]);
    setClients([]);
    setSalesHistory([]);
    setBusinessProfile(DEFAULT_PROFILE);
    setImpersonatedUserId(null);
    setIsImpersonating(false);
  };

  const handleExitImpersonation = () => {
    setImpersonatedUserId(null);
    setIsImpersonating(false);
    setCurrentScreen("DEVELOPER_PANEL");
    fetchAllData();
    triggerNotify("Voltando ao Painel Admin");
  };

  const isDeveloper = useMemo(() => {
    const email = session?.user?.email?.toLowerCase();
    const companyName = businessProfile.companyName?.toUpperCase();
    const isDevEmail =
      email === "jabasso.pva@gmail.com" ||
      email === "omnvenda_adm@omnivenda.com";
    const isDevCompany = companyName === "OMNVENDA_ADM";
    return isDevEmail || isDevCompany || businessProfile.role === "DEVELOPER";
  }, [session, businessProfile]);

  const isPureAdmin = useMemo(() => {
    return session?.user?.email?.toLowerCase() === "omnvenda_adm@omnivenda.com";
  }, [session]);

  const isProfileIncomplete = useMemo(() => {
    if (isPureAdmin || isImpersonating || isResettingPassword) return false;
    return (
      !businessProfile.companyName ||
      businessProfile.companyName === "MINHA EMPRESA" ||
      !businessProfile.phone ||
      businessProfile.phone.trim() === ""
    );
  }, [businessProfile, isPureAdmin, isImpersonating, isResettingPassword]);

  useEffect(() => {
    if (
      isProfileIncomplete &&
      session &&
      !loading &&
      currentScreen !== "SETTINGS"
    ) {
      setCurrentScreen("SETTINGS");
      triggerNotify("Complete seu cadastro para continuar");
    }
  }, [isProfileIncomplete, session, loading, currentScreen]);

  useEffect(() => {
    if (isPureAdmin && currentScreen !== "DEVELOPER_PANEL") {
      setCurrentScreen("DEVELOPER_PANEL");
    }
  }, [isPureAdmin, currentScreen]);

  useEffect(() => {
    if (currentScreen === "DEVELOPER_PANEL" && isDeveloper) {
      db.admin.getBusinessStats().then(setAllBusinessesStats);
    }
  }, [currentScreen, isDeveloper]);

  useEffect(() => {
    const savedTest = localStorage.getItem("omnivenda_test_session");
    if (savedTest) {
      setSession({ user: { email: "demo@omnivenda.com" } });
      setIsTestMode(true);
      fetchAllData();
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Verifica se é um redirecionamento de recuperação de senha pelo URL (hash ou query)
        if (
          window.location.hash.includes("type=recovery") ||
          window.location.href.includes("type=recovery")
        ) {
          setIsResettingPassword(true);
        }
        fetchAllData();
      } else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event:", event);
      setSession(session);

      if (event === "PASSWORD_RECOVERY") {
        setIsResettingPassword(true);
      }

      if (session) {
        fetchAllData();
      } else {
        resetBusinessData();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [p, c, s, prof] = await Promise.all([
        db.products.getAll(),
        db.clients.getAll(),
        db.sales.getAll(),
        db.profile.get(),
      ]);
      setProducts(p || []);
      setClients(c || []);
      setSalesHistory(s || []);

      if (prof) {
        setBusinessProfile(prof);
      } else if (session?.user) {
        const email = session.user.email || "";
        const emailPrefix = email
          .split("@")[0]
          .toUpperCase()
          .replace(/[._]/g, " ");
        const detectedName =
          session.user.user_metadata?.company_name ||
          session.user.user_metadata?.username ||
          emailPrefix ||
          "MINHA EMPRESA";
        const initialProfile = {
          ...DEFAULT_PROFILE,
          companyName: detectedName,
          email: email,
          role:
            email === "omnvenda_adm@omnivenda.com" ||
            email === "jabasso.pva@gmail.com"
              ? "DEVELOPER"
              : "USER",
        };
        setBusinessProfile(initialProfile);
        db.profile.update(initialProfile).then((saved) => {
          if (saved) setBusinessProfile(saved);
        });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (isTest?: boolean, testName?: string) => {
    if (isTest) {
      setIsTestMode(true);
      setSession({
        user: {
          email: "demo@omnivenda.com",
          user_metadata: { company_name: testName },
        },
      });
      localStorage.setItem("omnivenda_test_session", "active");
      fetchAllData();
    } else {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (currentSession) {
        setSession(currentSession);
        setTimeout(() => fetchAllData(), 500);
      }
    }
  };

  const triggerNotify = (msg: string = "Dados Salvos!") => {
    setSaveNotify({ show: true, msg });
    setTimeout(() => setSaveNotify({ show: false, msg: "" }), 2000);
  };

  const handleSaveProduct = async (data: Omit<Product, "id">) => {
    try {
      const isEdit =
        productModal.type === ModalType.EDIT && !!productModal.data;
      const editId = productModal.data?.id;
      const payload = isEdit ? { ...data, id: editId } : { ...data };
      const saved = await db.products.upsert(payload);
      setProducts((prev) =>
        isEdit
          ? prev.map((p) => (p.id === editId ? (saved as Product) : p))
          : [saved as Product, ...prev],
      );
      setProductModal({ type: ModalType.NONE });
      triggerNotify("Produto Salvo!");
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar produto.");
    }
  };

  const handleSaveClient = async (data: Omit<Client, "id">) => {
    try {
      const isEdit = clientModal.type === ModalType.EDIT && !!clientModal.data;
      const editId = clientModal.data?.id;
      const payload = isEdit ? { ...data, id: editId } : { ...data };
      const saved = await db.clients.upsert(payload);
      setClients((prev) =>
        isEdit
          ? prev.map((c) => (c.id === editId ? (saved as Client) : c))
          : [saved as Client, ...prev],
      );
      setClientModal({ type: ModalType.NONE });
      triggerNotify("Cliente Salvo!");
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar cliente.");
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const recalculateRetroactiveProfits = async () => {
    if (
      !confirm(
        "Isso irá recalcular o lucro de TODAS as vendas baseando-se nos custos ATUAIS dos produtos. Deseja continuar?",
      )
    )
      return;
    setIsSyncing(true);
    try {
      const allSales = await db.sales.getAll();
      const allProducts = await db.products.getAll();
      let updatedCount = 0;
      for (const sale of allSales) {
        let newProfit = 0;
        const newItems = sale.items.map((item: any) => {
          const product = allProducts.find((p: any) => p.id === item.id);
          if (product) {
            const currentCost = product.cost_price || product.costPrice || 0;
            newProfit += (item.price - currentCost) * item.quantity;
            return { ...item, costPrice: currentCost };
          }
          newProfit += item.profit || 0;
          return item;
        });
        await db.sales.update({ ...sale, items: newItems, profit: newProfit });
        updatedCount++;
      }
      const refreshedSales = await db.sales.getAll();
      setSalesHistory(refreshedSales);
      triggerNotify(`${updatedCount} vendas atualizadas!`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const printSale = (sale: Sale) => {
    const logoUrl = convertDriveLink(businessProfile.logoUrl || "");
    const companyName = businessProfile.companyName || "OMNIVENDA";
    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" style="max-height: 80px; max-width: 180px; margin-bottom: 8px; object-fit: contain;">`
      : "";
    const clientPhone =
      clients.find((c) => c.id === sale.clientId)?.phone || "";
    const clientAddress =
      clients.find((c) => c.id === sale.clientId)?.address || "";

    const printContent = `
      <html>
        <head>
          <title>Pedido ${sale.orderNumber ? String(sale.orderNumber).padStart(4, "0") : sale.id}</title>
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
                            <p class="company-doc">${businessProfile.document || ""}</p>
                            <p class="company-contact">${businessProfile.phone || ""}</p>
                        </div>
                        <div class="header-meta">
                            <div class="badge ${sale.status === "ORCAMENTO" ? "badge-budget" : "badge-finalized"}">
                                ${sale.status === "ORCAMENTO" ? "ORÇAMENTO" : "COMPROVANTE DE PEDIDO"}
                            </div>
                            <div class="order-id">PEDIDO NO. <span>${sale.orderNumber ? String(sale.orderNumber).padStart(4, "0") : sale.id}</span></div>
                            <div class="order-date">${sale.date} às ${sale.time}</div>
                        </div>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="details-column">
                        <div class="section-title">Cliente</div>
                        <div class="details-box">
                            <p class="client-name">${sale.clientName}</p>
                            ${clientPhone ? `<p class="client-detail"><strong>WhatsApp / Tel:</strong> ${clientPhone}</p>` : ""}
                            ${clientAddress ? `<p class="client-detail"><strong>Endereço:</strong> ${clientAddress}</p>` : ""}
                        </div>
                    </div>
                    <div class="details-column">
                        <div class="section-title">Informações de Venda</div>
                        <div class="details-box">
                            <p class="client-detail"><strong>Forma de Pagamento:</strong> ${sale.paymentMethod || "Dinheiro"}</p>
                            <p class="client-detail"><strong>Condição de Pagamento:</strong> ${sale.paymentTerms || "À vista"}</p>
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
                            ${sale.items
                              .map((item) => {
                                const unitPrice =
                                  item.price - (item.discount || 0);
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
                              })
                              .join("")}
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

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 800);
    }
  };

  const handleFinishSale = async (data: Partial<Sale>) => {
    try {
      const isUpdate = !!data.id;
      const client = clients.find((c) => c.id === data.clientId);
      const cleanItems = (data.items || []).map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        costPrice: Number(item.costPrice) || 0,
        quantity: Number(item.quantity) || 0,
        discount: Number(item.discount) || 0,
      }));

      const todayBR = new Date().toLocaleDateString("pt-BR");
      const salePayload = {
        ...data,
        clientName: client?.name || "Venda Avulsa",
        items: cleanItems as any,
        date: isUpdate
          ? salesHistory.find((s) => s.id === data.id)?.date || todayBR
          : todayBR,
        time: isUpdate
          ? salesHistory.find((s) => s.id === data.id)?.time || "00:00"
          : new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
      };

      let savedSale;
      if (isUpdate) savedSale = await db.sales.update(salePayload);
      else savedSale = await db.sales.create(salePayload);

      setSalesHistory((prev) =>
        isUpdate
          ? prev.map((s) => (s.id === savedSale.id ? savedSale : s))
          : [savedSale, ...prev],
      );

      // Update stock if finished
      if (savedSale.status === "FINALIZADA") {
        const oldItems = isUpdate
          ? salesHistory.find((s) => s.id === data.id)?.items || []
          : [];
        const newItems = data.items || [];
        const allProductIds = Array.from(
          new Set([...oldItems.map((i) => i.id), ...newItems.map((i) => i.id)]),
        );
        const productUpdates = [...products];
        for (let i = 0; i < productUpdates.length; i++) {
          const p = productUpdates[i];
          if (allProductIds.includes(p.id)) {
            const oldQty =
              oldItems.find((item) => item.id === p.id)?.quantity || 0;
            const newQty =
              newItems.find((item) => item.id === p.id)?.quantity || 0;
            const delta = newQty - oldQty;
            if (delta !== 0) {
              const newStock = Math.max(0, p.stock - delta);
              const updatedProduct = { ...p, stock: newStock };
              await db.products.upsert(updatedProduct);
              productUpdates[i] = updatedProduct;
            }
          }
        }
        setProducts(productUpdates);
      }

      setSaleModal(false);
      setEditingSale(null);
      if (!isUpdate && savedSale) {
        const nextOrderNumber = salesHistory.length + 1;
        const saleWithNumber = { ...savedSale, orderNumber: nextOrderNumber };
        setSelectedSale(saleWithNumber);
        printSale(saleWithNumber);
      }
      triggerNotify("Venda Salva!");
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar venda.");
    }
  };

  const handleOpenEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSelectedSale(null);
    setSaleModal(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.",
      )
    )
      return;

    try {
      const saleToDelete = salesHistory.find(
        (s) => String(s.id) === String(saleId),
      );
      if (!saleToDelete) {
        console.warn("Venda não encontrada para exclusão:", saleId);
        return;
      }

      // Tenta restaurar o estoque se a venda estiver finalizada
      try {
        if (saleToDelete.status === "FINALIZADA") {
          const productUpdates = [...products];
          for (let i = 0; i < productUpdates.length; i++) {
            const p = productUpdates[i];
            const item = (saleToDelete.items || []).find(
              (it) => it.id === p.id,
            );
            if (item) {
              const newStock =
                Number(p.stock || 0) + Number(item.quantity || 0);
              const updatedProduct = { ...p, stock: newStock };
              await db.products.upsert(updatedProduct);
              productUpdates[i] = updatedProduct;
            }
          }
          setProducts(productUpdates);
        }
      } catch (stockError) {
        console.warn("Erro ao restaurar estoque durante exclusão:", stockError);
      }

      await db.sales.delete(saleId);

      // Atualiza o estado local garantindo comparação segura de tipos (ID pode ser número no DB)
      setSalesHistory((prev) =>
        prev.filter((s) => String(s.id) !== String(saleId)),
      );
      setSelectedSale(null);
      triggerNotify("Venda Excluída!");
    } catch (e: any) {
      console.error("Erro ao excluir venda:", e);
      alert(`Erro ao excluir venda: ${e.message || "Verifique sua conexão."}`);
    }
  };

  const handleTogglePaid = async (saleId: string, isPaid: boolean) => {
    try {
      const saleToUpdate = salesHistory.find((s) => String(s.id) === String(saleId));
      if (!saleToUpdate) {
        console.warn("Venda não encontrada para alteração de status de pagamento:", saleId);
        return;
      }

      const updatedSale = { ...saleToUpdate, isPaid };
      await db.sales.update(updatedSale);

      setSalesHistory((prev) =>
        prev.map((s) => (String(s.id) === String(saleId) ? updatedSale : s))
      );

      setSelectedSale((prev) => {
        if (prev && String(prev.id) === String(saleId)) {
          return { ...prev, isPaid };
        }
        return prev;
      });

      setSelectedClientReport((prev) => {
        if (prev) {
          const updatedSales = prev.sales.map((s) =>
            String(s.id) === String(saleId) ? { ...s, isPaid } : s
          );
          return { ...prev, sales: updatedSales };
        }
        return prev;
      });

      triggerNotify(isPaid ? "Baixa realizada! Pedido Pago." : "Status alterado para Pendente.");
    } catch (e: any) {
      console.error("Erro ao alterar status de pagamento da venda:", e);
      alert(`Erro ao atualizar pagamento: ${e.message || "Verifique sua conexão."}`);
    }
  };

  const handleOpenClientReport = (clientName: string, clientId?: string) => {
    let matchedClient = clients.find(
      (c) =>
        c.id === clientId ||
        c.name.trim().toUpperCase() === clientName.trim().toUpperCase()
    );

    if (!matchedClient) {
      matchedClient = {
        id: clientId || `fallback_${Date.now()}`,
        name: clientName,
        phone: "",
        email: "",
        address: "",
        document: "",
      };
    }

    const clientSales = salesHistory.filter((s) => {
      const nameMatch =
        s.clientName &&
        s.clientName.trim().toUpperCase() === clientName.trim().toUpperCase();
      const idMatch = s.clientId && s.clientId === matchedClient?.id;
      return (
        (idMatch || nameMatch) &&
        (s.status === "FINALIZADA" || s.status === "PENDENTE" || s.status === "ORCAMENTO")
      );
    });

    setSelectedClientReport({
      client: matchedClient,
      sales: clientSales,
    });
  };

  const handlePrintSaleDirect = (sale: Sale) => {
    const profile = businessProfile;
    const clientData = clients.find((c) => c.id === sale.clientId);
    const logoUrl = convertDriveLink(profile.logoUrl || "");
    const companyName = profile.companyName || "OMNIVENDA";
    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" style="max-height: 80px; max-width: 180px; margin-bottom: 8px; object-fit: contain;">`
      : "";
    const clientPhone = clientData?.phone || "";
    const clientAddress = clientData?.address || "";

    const printContent = `
      <html>
        <head>
          <title>Pedido ${sale.orderNumber ? String(sale.orderNumber).padStart(4, "0") : sale.id}</title>
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
                            <p class="company-doc">${profile.document || ""}</p>
                            <p class="company-contact">${profile.phone || ""}</p>
                        </div>
                        <div class="header-meta">
                            <div class="badge ${sale.status === "ORCAMENTO" ? "badge-budget" : "badge-finalized"}">
                                ${sale.status === "ORCAMENTO" ? "ORÇAMENTO" : "COMPROVANTE DE PEDIDO"}
                            </div>
                            <div class="order-id">PEDIDO NO. <span>${sale.orderNumber ? String(sale.orderNumber).padStart(4, "0") : sale.id}</span></div>
                            <div class="order-date">${sale.date} às ${sale.time}</div>
                        </div>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="details-column">
                        <div class="section-title">Cliente</div>
                        <div class="details-box">
                            <p class="client-name">${sale.clientName}</p>
                            ${clientPhone ? `<p class="client-detail"><strong>WhatsApp / Tel:</strong> ${clientPhone}</p>` : ""}
                            ${clientAddress ? `<p class="client-detail"><strong>Endereço:</strong> ${clientAddress}</p>` : ""}
                        </div>
                    </div>
                    <div class="details-column">
                        <div class="section-title">Informações de Venda</div>
                        <div class="details-box">
                            <p class="client-detail"><strong>Forma de Pagamento:</strong> ${sale.paymentMethod || "Dinheiro"}</p>
                            <p class="client-detail"><strong>Condição de Pagamento:</strong> ${sale.paymentTerms || "À vista"}</p>
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
                            ${(sale.items || [])
                              .map((item) => {
                                const unitPrice =
                                  item.price - (item.discount || 0);
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
                              })
                              .join("")}
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

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 800);
    }
  };

  const handleShareWhatsAppDirect = (sale: Sale) => {
    const profile = businessProfile;
    const clientData = clients.find((c) => c.id === sale.clientId);
    const companyName = profile.companyName || "OMNIVENDA";
    const itemsText = (sale.items || [])
      .map((item) => {
        const unitPrice = item.price - (item.discount || 0);
        return `• ${item.quantity}x ${item.name} - R$ ${(unitPrice * item.quantity).toFixed(2)}`;
      })
      .join("\n");

    const message = `*${companyName} - Pedido ${sale.orderNumber ? String(sale.orderNumber).padStart(4, "0") : sale.id}*
---------------------------
👤 *Cliente:* ${sale.clientName}
📅 *Data:* ${sale.date} às ${sale.time}

📦 *Itens:*
${itemsText}

💰 *Total: R$ ${sale.total.toFixed(2)}*
💳 *Pagamento:* ${sale.paymentMethod || "Não informado"}
🗓️ *Condição:* ${sale.paymentTerms || "À vista"}

Obrigado pela preferência!`;

    const encodedText = encodeURIComponent(message);
    const cleanPhone = clientData?.phone
      ? clientData.phone.replace(/\D/g, "")
      : "";
    const finalPhone = cleanPhone.length >= 10 ? `55${cleanPhone}` : cleanPhone;

    const whatsappUrl = finalPhone
      ? `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, "_blank");
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!clientId) {
      alert("ID do cliente não encontrado.");
      return;
    }

    try {
      // 1. Verifica se o cliente tem vendas antes de permitir excluir
      // Compara convertendo para string para evitar problemas de tipo (UUID vs Number)
      const hasSales = salesHistory.some(
        (s) => String(s.clientId) === String(clientId),
      );

      if (hasSales) {
        alert(
          "Este cliente possui vendas registradas. Exclua as vendas dele primeiro para poder removê-lo.",
        );
        return;
      }

      // 2. Tenta excluir no banco
      await db.clients.delete(clientId);

      // 3. Atualiza estado local imediatamente
      setClients((prev) =>
        prev.filter((c) => String(c.id) !== String(clientId)),
      );

      // 4. Fecha modal se ainda estiver aberto (geralmente fechado pelo componente, mas por garantia)
      setClientModal({ type: ModalType.NONE });

      triggerNotify("Cliente Excluído!");
    } catch (e: any) {
      console.error("Erro Crítico ao excluir cliente:", e);
      const msg = e.message || "Erro desconhecido";
      if (
        msg.includes("foreign key") ||
        msg.includes("violates foreign key constraint")
      ) {
        alert(
          "Não é possível excluir: existem registros vinculados a este cliente no banco de dados.",
        );
      } else {
        alert(`Erro ao excluir: ${msg}`);
      }
    }
  };

  const handleImpersonate = (userId: string) => {
    setImpersonatedUserId(userId);
    setIsImpersonating(true);
    fetchAllData();
    setCurrentScreen("HOME");
  };

  const handleLogout = async () => {
    if (isImpersonating) {
      handleExitImpersonation();
      return;
    }
    setLoading(true);
    if (isTestMode) {
      localStorage.removeItem("omnivenda_test_session");
      setIsTestMode(false);
    } else {
      await supabase.auth.signOut();
    }
    resetBusinessData();
    setSession(null);
    setCurrentScreen("HOME");
    setLoading(false);
  };

  const currentSummary = useMemo(() => {
    const d = currentDate;
    const dayStr = d.toLocaleDateString("pt-BR");
    const monthStr =
      (d.getMonth() + 1).toString().padStart(2, "0") + "/" + d.getFullYear();
    const yearStr = d.getFullYear().toString();
    const safeNumber = (val: any) => {
      if (typeof val === "number") return isNaN(val) ? 0 : val;
      if (typeof val === "string") {
        let cleaned = val.replace(/[R$\s]/g, "");
        if (cleaned.includes(",") && cleaned.includes(".")) {
          // Formato pt-BR: 1.234,56
          cleaned = cleaned.replace(/\./g, "").replace(",", ".");
        } else if (cleaned.includes(",")) {
          // Formato apenas com vírgula: 1234,56
          cleaned = cleaned.replace(",", ".");
        }
        const num = Number(cleaned);
        return isNaN(num) ? 0 : num;
      }
      return Number(val) || 0;
    };

    const filtered = salesHistory.filter((s) => {
      if (!s.date) return false;
      // Considera FINALIZADA e PENDENTE como vendas válidas para o resumo
      if (!["FINALIZADA", "PENDENTE"].includes(s.status)) return false;
      if (reportTab === "TOTAL") return true;
      if (reportTab === "DIARIO") return s.date === dayStr;
      if (reportTab === "MENSAL") return s.date.endsWith(monthStr);
      if (reportTab === "ANUAL") return s.date.endsWith(yearStr);
      return false;
    });
    const stats = {
      vendasCount: 0,
      vendasTotal: 0,
      lucro: 0,
      recebidoCount: 0,
      recebidoTotal: 0,
      aReceberCount: 0,
      aReceberTotal: 0,
      orcamentosCount: 0,
      orcamentosTotal: 0,
      entregaCount: 0,
      entregaTotal: 0,
    };
    filtered.forEach((s) => {
      const total = safeNumber(s.total);
      const profit = safeNumber(s.profit || 0);
      const isPaid =
        s.isPaid === true ||
        String(s.isPaid) === "true" ||
        Number(s.isPaid) === 1;

      if (s.status === "FINALIZADA" || s.status === "PENDENTE") {
        stats.vendasCount++;
        stats.vendasTotal += total;
        stats.lucro += profit;
        if (isPaid) {
          stats.recebidoCount++;
          stats.recebidoTotal += total;
        } else {
          stats.aReceberCount++;
          stats.aReceberTotal += total;
        }
        if (s.deliveryStatus === "PENDENTE") {
          stats.entregaCount++;
          stats.entregaTotal += total;
        }
      } else {
        stats.orcamentosCount++;
        stats.orcamentosTotal += total;
      }
    });
    return stats;
  }, [salesHistory, reportTab, currentDate]);

  const clientRanking = useMemo(() => {
    const d = currentDate;
    const dayStr = d.toLocaleDateString("pt-BR");
    const monthStr =
      (d.getMonth() + 1).toString().padStart(2, "0") + "/" + d.getFullYear();
    const yearStr = d.getFullYear().toString();

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

    const filtered = salesHistory.filter((s) => {
      // Incluímos FINALIZADA e PENDENTE no ranking
      if (!["FINALIZADA", "PENDENTE"].includes(s.status) || !s.date)
        return false;
      if (reportTab === "TOTAL") return true;
      if (reportTab === "DIARIO") return s.date === dayStr;
      if (reportTab === "MENSAL") return s.date.endsWith(monthStr);
      if (reportTab === "ANUAL") return s.date.endsWith(yearStr);
      return false;
    });

    const clientsMap: Record<string, any> = {};
    filtered.forEach((sale) => {
      const rawName = (sale.clientName || "Venda Avulsa").trim();
      // Agrupamento por nome normalizado para unir vendas com/sem ID do mesmo cliente
      const groupKey =
        rawName === "Venda Avulsa" ? `anon_${sale.id}` : rawName.toUpperCase();

      if (!clientsMap[groupKey]) {
        clientsMap[groupKey] = {
          name: rawName,
          clientId: sale.clientId || "",
          salesCount: 0,
          totalPotes: 0,
          totalSold: 0,
          totalProfit: 0,
          totalPendingAmount: 0,
        };
      } else if (sale.clientId && !clientsMap[groupKey].clientId) {
        clientsMap[groupKey].clientId = sale.clientId;
      }

      const total = safeNumber(sale.total);
      const profit = safeNumber(sale.profit || 0);
      const isPaid =
        sale.isPaid === true ||
        String(sale.isPaid) === "true" ||
        Number(sale.isPaid) === 1;
      const salePotes = (sale.items || []).reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0,
      );

      clientsMap[groupKey].salesCount++;
      clientsMap[groupKey].totalPotes += salePotes;
      clientsMap[groupKey].totalSold += total;
      clientsMap[groupKey].totalProfit += profit;
      if (!isPaid) clientsMap[groupKey].totalPendingAmount += total;
    });

    return Object.values(clientsMap).sort((a, b) => b.totalSold - a.totalSold);
  }, [salesHistory, currentDate, reportTab]);

  const productRanking = useMemo(() => {
    const d = currentDate;
    const dayStr = d.toLocaleDateString("pt-BR");
    const monthStr =
      (d.getMonth() + 1).toString().padStart(2, "0") + "/" + d.getFullYear();
    const yearStr = d.getFullYear().toString();

    const filtered = salesHistory.filter((s) => {
      if (!["FINALIZADA", "PENDENTE"].includes(s.status) || !s.date)
        return false;
      if (reportTab === "DIARIO") return s.date === dayStr;
      if (reportTab === "MENSAL") return s.date.endsWith(monthStr);
      if (reportTab === "ANUAL") return s.date.endsWith(yearStr);
      return false;
    });

    const productsMap: Record<string, any> = {};
    filtered.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        if (!productsMap[item.id]) {
          productsMap[item.id] = {
            name: item.name,
            salesCount: 0,
            totalSold: 0,
            totalProfit: 0,
          };
        }
        const qty = Number(item.quantity) || 0;
        productsMap[item.id].salesCount += qty;
        productsMap[item.id].totalSold += (Number(item.price) || 0) * qty;
        productsMap[item.id].totalProfit +=
          ((Number(item.price) || 0) - (Number(item.costPrice) || 0)) * qty;
      });
    });
    return Object.values(productsMap).sort(
      (a, b) => b.salesCount - a.salesCount,
    );
  }, [salesHistory, currentDate, reportTab]);

  const dashboardChartData = useMemo(() => {
    const d = currentDate;
    const dayStr = d.toLocaleDateString("pt-BR");
    const monthStr =
      (d.getMonth() + 1).toString().padStart(2, "0") + "/" + d.getFullYear();
    const yearStr = d.getFullYear().toString();

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

    const filtered = salesHistory.filter((s) => {
      if (!s.date) return false;
      if (!["FINALIZADA", "PENDENTE"].includes(s.status)) return false;
      if (reportTab === "TOTAL") return true;
      if (reportTab === "DIARIO") return s.date === dayStr;
      if (reportTab === "MENSAL") return s.date.endsWith(monthStr);
      if (reportTab === "ANUAL") return s.date.endsWith(yearStr);
      return false;
    });

    if (reportTab === "MENSAL") {
      const dailySums: Record<
        string,
        { label: string; dayNum: number; total: number; profit: number }
      > = {};
      const year = d.getFullYear();
      const month = d.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthLabel = String(month + 1).padStart(2, "0");
      for (let i = 1; i <= daysInMonth; i++) {
        const dayKey = String(i).padStart(2, "0");
        const label = `${dayKey}/${monthLabel}`;
        dailySums[dayKey] = { label, dayNum: i, total: 0, profit: 0 };
      }

      filtered.forEach((s) => {
        const parts = s.date.split("/");
        if (parts.length === 3) {
          const day = parts[0];
          if (dailySums[day]) {
            dailySums[day].total += safeNumber(s.total);
            dailySums[day].profit += safeNumber(s.profit || 0);
          }
        }
      });
      return Object.values(dailySums).sort((a, b) => a.dayNum - b.dayNum);
    } else if (reportTab === "ANUAL") {
      const MONTH_LABELS = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      const monthlySums = MONTH_LABELS.map((label, idx) => ({
        label,
        total: 0,
        profit: 0,
      }));

      filtered.forEach((s) => {
        const parts = s.date.split("/");
        if (parts.length === 3) {
          const m = Number(parts[1]);
          if (m >= 1 && m <= 12) {
            monthlySums[m - 1].total += safeNumber(s.total);
            monthlySums[m - 1].profit += safeNumber(s.profit || 0);
          }
        }
      });
      return monthlySums;
    } else if (reportTab === "DIARIO") {
      const hourlySums: Record<
        string,
        { label: string; total: number; profit: number }
      > = {};
      for (let i = 0; i < 24; i += 3) {
        const label = String(i).padStart(2, "0") + ":00";
        hourlySums[label] = { label, total: 0, profit: 0 };
      }

      filtered.forEach((s) => {
        const time = s.time || "12:00";
        const hour = Number(time.split(":")[0]) || 12;
        const roundedHour = Math.floor(hour / 3) * 3;
        const label = String(roundedHour).padStart(2, "0") + ":00";
        if (hourlySums[label]) {
          hourlySums[label].total += safeNumber(s.total);
          hourlySums[label].profit += safeNumber(s.profit || 0);
        }
      });
      return Object.values(hourlySums).sort((a, b) =>
        a.label.localeCompare(b.label),
      );
    } else {
      const groups: Record<
        string,
        { label: string; total: number; profit: number; sortKey: string }
      > = {};
      filtered.forEach((s) => {
        const parts = s.date.split("/");
        if (parts.length === 3) {
          const groupKey = parts[1] + "/" + parts[2];
          if (!groups[groupKey]) {
            groups[groupKey] = {
              label: groupKey,
              total: 0,
              profit: 0,
              sortKey: parts[2] + parts[1],
            };
          }
          groups[groupKey].total += safeNumber(s.total);
          groups[groupKey].profit += safeNumber(s.profit || 0);
        }
      });
      return Object.values(groups).sort((a, b) =>
        a.sortKey.localeCompare(b.sortKey),
      );
    }
  }, [salesHistory, reportTab, currentDate]);

  const paymentMethodsBreakdown = useMemo(() => {
    const d = currentDate;
    const dayStr = d.toLocaleDateString("pt-BR");
    const monthStr =
      (d.getMonth() + 1).toString().padStart(2, "0") + "/" + d.getFullYear();
    const yearStr = d.getFullYear().toString();

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

    const filtered = salesHistory.filter((s) => {
      if (!s.date) return false;
      if (!["FINALIZADA", "PENDENTE"].includes(s.status)) return false;
      if (reportTab === "TOTAL") return true;
      if (reportTab === "DIARIO") return s.date === dayStr;
      if (reportTab === "MENSAL") return s.date.endsWith(monthStr);
      if (reportTab === "ANUAL") return s.date.endsWith(yearStr);
      return false;
    });

    const map: Record<string, number> = {};
    let grandTotal = 0;
    filtered.forEach((s) => {
      const val = safeNumber(s.total);
      const m = s.paymentMethod || "Não Definido";
      map[m] = (map[m] || 0) + val;
      grandTotal += val;
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        percent: grandTotal > 0 ? (value / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [salesHistory, currentDate, reportTab]);

  const flavorAndIntelligenceData = useMemo(() => {
    const d = currentDate;
    const dayStr = d.toLocaleDateString("pt-BR");
    const monthStr =
      (d.getMonth() + 1).toString().padStart(2, "0") + "/" + d.getFullYear();
    const yearStr = d.getFullYear().toString();

    // Determine previous date object based on reportTab
    const prevDateObj = new Date(d);
    if (reportTab === "DIARIO") prevDateObj.setDate(prevDateObj.getDate() - 1);
    else if (reportTab === "MENSAL")
      prevDateObj.setMonth(prevDateObj.getMonth() - 1);
    else if (reportTab === "ANUAL")
      prevDateObj.setFullYear(prevDateObj.getFullYear() - 1);

    const prevDayStr = prevDateObj.toLocaleDateString("pt-BR");
    const prevMonthStr =
      (prevDateObj.getMonth() + 1).toString().padStart(2, "0") +
      "/" +
      prevDateObj.getFullYear();
    const prevYearStr = prevDateObj.getFullYear().toString();

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

    const extractFlavor = (name: string): string => {
      if (!name) return "Outros";
      let clean = name.trim();
      clean = clean
        .replace(/cocada de /gi, "")
        .replace(/cocada d'/gi, "")
        .replace(/cocada /gi, "")
        .replace(/pote /gi, "")
        .replace(/display /gi, "")
        .replace(/unidade /gi, "")
        .replace(/\d+\s*(kg|g|ml|l|potes|pote|un|cx|unid)/gi, "")
        .replace(/[-|()]/g, "")
        .trim();

      clean = clean
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      if (!clean || clean.length < 2) return "Tradicional";
      return clean;
    };

    // Filter current period sales
    const currFiltered = salesHistory.filter((s) => {
      if (!s.date) return false;
      if (!["FINALIZADA", "PENDENTE"].includes(s.status)) return false;
      if (reportTab === "TOTAL") return true;
      if (reportTab === "DIARIO") return s.date === dayStr;
      if (reportTab === "MENSAL") return s.date.endsWith(monthStr);
      if (reportTab === "ANUAL") return s.date.endsWith(yearStr);
      return false;
    });

    // Filter previous period sales
    const prevFiltered = salesHistory.filter((s) => {
      if (!s.date) return false;
      if (!["FINALIZADA", "PENDENTE"].includes(s.status)) return false;
      if (reportTab === "TOTAL") return false;
      if (reportTab === "DIARIO") return s.date === prevDayStr;
      if (reportTab === "MENSAL") return s.date.endsWith(prevMonthStr);
      if (reportTab === "ANUAL") return s.date.endsWith(prevYearStr);
      return false;
    });

    // Group current flavor items
    const currentFlavorMap: Record<
      string,
      { revenue: number; quantity: number; profit: number; salesCount: number }
    > = {};
    currFiltered.forEach((s) => {
      (s.items || []).forEach((item) => {
        const flav = extractFlavor(item.name);
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const cost = Number(item.costPrice) || 0;
        const totalItem = qty * price;
        const profitItem = qty * (price - cost);
        if (!currentFlavorMap[flav]) {
          currentFlavorMap[flav] = {
            revenue: 0,
            quantity: 0,
            profit: 0,
            salesCount: 0,
          };
        }
        currentFlavorMap[flav].revenue += totalItem;
        currentFlavorMap[flav].quantity += qty;
        currentFlavorMap[flav].profit += profitItem;
        currentFlavorMap[flav].salesCount += 1;
      });
    });

    // Group previous flavor items
    const previousFlavorMap: Record<
      string,
      { revenue: number; quantity: number; profit: number }
    > = {};
    prevFiltered.forEach((s) => {
      (s.items || []).forEach((item) => {
        const flav = extractFlavor(item.name);
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const cost = Number(item.costPrice) || 0;
        const totalItem = qty * price;
        const profitItem = qty * (price - cost);
        if (!previousFlavorMap[flav]) {
          previousFlavorMap[flav] = { revenue: 0, quantity: 0, profit: 0 };
        }
        previousFlavorMap[flav].revenue += totalItem;
        previousFlavorMap[flav].quantity += qty;
        previousFlavorMap[flav].profit += profitItem;
      });
    });

    // Produce flavor list
    const allFlavorsSet = new Set([
      ...Object.keys(currentFlavorMap),
      ...Object.keys(previousFlavorMap),
    ]);
    const flavorList = Array.from(allFlavorsSet)
      .map((flav) => {
        const curr = currentFlavorMap[flav] || {
          revenue: 0,
          quantity: 0,
          profit: 0,
          salesCount: 0,
        };
        const prev = previousFlavorMap[flav] || {
          revenue: 0,
          quantity: 0,
          profit: 0,
        };

        const revChange =
          prev.revenue > 0
            ? ((curr.revenue - prev.revenue) / prev.revenue) * 100
            : curr.revenue > 0
              ? 100
              : 0;
        const qtyChange =
          prev.quantity > 0
            ? ((curr.quantity - prev.quantity) / prev.quantity) * 100
            : curr.quantity > 0
              ? 100
              : 0;
        const margin =
          curr.revenue > 0 ? (curr.profit / curr.revenue) * 100 : 0;

        return {
          flavor: flav,
          currRevenue: curr.revenue,
          prevRevenue: prev.revenue,
          revChange,
          currQuantity: curr.quantity,
          prevQuantity: prev.quantity,
          qtyChange,
          currProfit: curr.profit,
          margin,
          salesCount: curr.salesCount,
        };
      })
      .sort((a, b) => b.currRevenue - a.currRevenue);

    // General overall analytics
    const currTotalRevenue = currFiltered.reduce(
      (sum, s) => sum + safeNumber(s.total),
      0,
    );
    const prevTotalRevenue = prevFiltered.reduce(
      (sum, s) => sum + safeNumber(s.total),
      0,
    );

    const currTotalProfit = currFiltered.reduce(
      (sum, s) => sum + safeNumber(s.profit || 0),
      0,
    );
    const prevTotalProfit = prevFiltered.reduce(
      (sum, s) => sum + safeNumber(s.profit || 0),
      0,
    );

    const currClients = new Set(
      currFiltered.map((s) => s.clientId).filter(Boolean),
    );
    const prevClients = new Set(
      prevFiltered.map((s) => s.clientId).filter(Boolean),
    );

    const currClientCount = currClients.size;
    const prevClientCount = prevClients.size;

    const revChangePercent =
      prevTotalRevenue > 0
        ? ((currTotalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
        : currTotalRevenue > 0
          ? 100
          : 0;
    const profitChangePercent =
      prevTotalProfit > 0
        ? ((currTotalProfit - prevTotalProfit) / prevTotalProfit) * 100
        : currTotalProfit > 0
          ? 100
          : 0;
    const clientChangePercent =
      prevClientCount > 0
        ? ((currClientCount - prevClientCount) / prevClientCount) * 100
        : currClientCount > 0
          ? 100
          : 0;

    let bestGrowthFlavor = "";
    let bestGrowthVal = -999999;
    let biggestDropFlavor = "";
    let biggestDropVal = 999999;

    flavorList.forEach((item) => {
      const diff = item.currRevenue - item.prevRevenue;
      if (diff > bestGrowthVal && item.currRevenue > 0) {
        bestGrowthVal = diff;
        bestGrowthFlavor = item.flavor;
      }
      if (diff < biggestDropVal) {
        biggestDropVal = diff;
        biggestDropFlavor = item.flavor;
      }
    });

    const insights: Array<{
      type: "positive" | "negative" | "neutral";
      title: string;
      desc: string;
      action: string;
    }> = [];

    if (currTotalRevenue > prevTotalRevenue && prevTotalRevenue > 0) {
      insights.push({
        type: "positive",
        title: "Crescimento de Faturamento",
        desc: `Faturamento subiu ${revChangePercent.toFixed(1)}% comparado ao período anterior (de R$ ${prevTotalRevenue.toFixed(2)} para R$ ${currTotalRevenue.toFixed(2)}).`,
        action:
          "Aproveite o momento positivo mantendo os produtos mais vendidos sempre estocados e oferecendo descontos em maiores volumes.",
      });
    } else if (currTotalRevenue < prevTotalRevenue && prevTotalRevenue > 0) {
      insights.push({
        type: "negative",
        title: "Retração de Faturamento",
        desc: `Houve queda de ${Math.abs(revChangePercent).toFixed(1)}% em relação ao período anterior (de R$ ${prevTotalRevenue.toFixed(2)} para R$ ${currTotalRevenue.toFixed(2)}).`,
        action:
          "Analise os clientes que compraram menos. Lance um incentivo pós-venda ou frete grátis para reconquistar a frequência.",
      });
    }

    if (currClientCount < prevClientCount && prevClientCount > 0) {
      insights.push({
        type: "negative",
        title: "Queda de Compradores Ativos",
        desc: `O número de clientes ativos diminuiu em ${Math.abs(clientChangePercent).toFixed(1)}% (de ${prevClientCount} para ${currClientCount}).`,
        action:
          "Gere o relatório de clientes inativos e faça um contato ativo no WhatsApp oferecendo as novidades da semana com descontos.",
      });
    } else if (currClientCount > prevClientCount && prevClientCount > 0) {
      insights.push({
        type: "positive",
        title: "Expansão de Clientes Ativos",
        desc: `Você conquistou ${clientChangePercent.toFixed(1)}% mais clientes ativos neste período (de ${prevClientCount} para ${currClientCount}).`,
        action:
          "Registre as preferências desses novos clientes para recomendar os sabores prediletos nas próximas abordagens.",
      });
    }

    if (bestGrowthFlavor && bestGrowthVal > 1) {
      insights.push({
        type: "positive",
        title: `Sucesso de ${bestGrowthFlavor}`,
        desc: `O sabor de cocada de maior ascensão foi ${bestGrowthFlavor}, gerando R$ ${bestGrowthVal.toFixed(2)} a mais que o período histórico.`,
        action:
          "Crie campanhas dedicadas a ele e avalie a introdução de novos kits contendo esse sabor premium.",
      });
    }
    if (biggestDropFlavor && biggestDropVal < -1) {
      insights.push({
        type: "negative",
        title: `Retração em ${biggestDropFlavor}`,
        desc: `O sabor ${biggestDropFlavor} vendeu R$ ${Math.abs(biggestDropVal).toFixed(2)} a menos que o período passado.`,
        action: `Avalie reduzir seu estoque preventivamente ou planeje combos imperdíveis junto com o líder de vendas ${bestGrowthFlavor || "Tradicional"}.`,
      });
    }

    const currentMargin =
      currTotalRevenue > 0 ? (currTotalProfit / currTotalRevenue) * 100 : 0;
    const prevMargin =
      prevTotalRevenue > 0 ? (prevTotalProfit / prevTotalRevenue) * 100 : 0;
    if (currentMargin < prevMargin && prevMargin > 0) {
      insights.push({
        type: "neutral",
        title: "Pressão nas Margens de Lucro",
        desc: `A margem média recuou para ${currentMargin.toFixed(1)}% (era de ${prevMargin.toFixed(1)}%). Os insumos ou frete podem estar mais elevados.`,
        action:
          "Otimize campanhas para impulsionar sabores com margens elevadas, ou revise os custos com os fornecedores de açúcares/embalagens.",
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: "neutral",
        title: "Sistema de Diagnóstico Ativo",
        desc: "O painel está calibrado. Registre mais vendas para cruzar dados de sazonalidade, oscilações de sabores e sugerir canais de tração.",
        action:
          "Garanta o preenchimento correto dos preços de custo de cada cocada para relatórios perfeitos.",
      });
    }

    return {
      currFiltered,
      prevFiltered,
      flavorList,
      currTotalRevenue,
      prevTotalRevenue,
      revChangePercent,
      currTotalProfit,
      prevTotalProfit,
      profitChangePercent,
      currClientCount,
      prevClientCount,
      clientChangePercent,
      bestGrowthFlavor,
      biggestDropFlavor,
      insights,
    };
  }, [salesHistory, currentDate, reportTab]);

  const changeDate = (delta: number) => {
    const next = new Date(currentDate);
    if (reportTab === "DIARIO") next.setDate(next.getDate() + delta);
    else if (reportTab === "MENSAL") next.setMonth(next.getMonth() + delta);
    else if (reportTab === "ANUAL")
      next.setFullYear(next.getFullYear() + delta);
    setCurrentDate(next);
  };

  const dashboardPrintData = useMemo(() => {
    const formattedPeriodStr = (() => {
      const d = currentDate;
      if (reportTab === "DIARIO") {
        return d.toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } else if (reportTab === "MENSAL") {
        return d
          .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
          .toUpperCase();
      } else {
        return `ANO DE ${d.getFullYear()}`;
      }
    })();

    const currentMarginVal =
      flavorAndIntelligenceData.currTotalRevenue > 0
        ? (flavorAndIntelligenceData.currTotalProfit /
            flavorAndIntelligenceData.currTotalRevenue) *
          100
        : 0;
    const prevMarginVal =
      flavorAndIntelligenceData.prevTotalRevenue > 0
        ? (flavorAndIntelligenceData.prevTotalProfit /
            flavorAndIntelligenceData.prevTotalRevenue) *
          100
        : 0;
    const marginChangeVal = currentMarginVal - prevMarginVal;

    return {
      formattedPeriodStr,
      currentMarginVal,
      prevMarginVal,
      marginChangeVal,
    };
  }, [currentDate, reportTab, flavorAndIntelligenceData]);

  const handlePrintDashboard = () => {
    setIsPrintModalOpen(true);
  };

  const handleCopyReportText = () => {
    const { formattedPeriodStr, currentMarginVal, marginChangeVal } = dashboardPrintData;
    const { currTotalRevenue, currTotalProfit, currClientCount, revChangePercent, profitChangePercent, clientChangePercent, insights, flavorList } = flavorAndIntelligenceData;

    let text = `📊 RESUMO EXECUTIVO - ${businessProfile.companyName || "OmniVenda"}\n`;
    text += `📅 Período: ${formattedPeriodStr}\n`;
    text += `-------------------------------------------\n\n`;
    text += `💰 Faturamento Geral: R$ ${currTotalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${revChangePercent >= 0 ? "+" : ""}${revChangePercent.toFixed(0)}% vs anterior)\n`;
    text += `📈 Lucro Estimado: R$ ${currTotalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${profitChangePercent >= 0 ? "+" : ""}${profitChangePercent.toFixed(0)}% vs anterior)\n`;
    text += `🎯 Margem Geral: ${currentMarginVal.toFixed(1)}% (${marginChangeVal >= 0 ? "+" : ""}${marginChangeVal.toFixed(0)}% vs anterior)\n`;
    text += `👥 Clientes Compradores: ${currClientCount} (${clientChangePercent >= 0 ? "+" : ""}${clientChangePercent.toFixed(0)}% vs anterior)\n\n`;

    if (flavorList.length > 0) {
      text += `🥥 DESEMPENHO POR SABOR:\n`;
      flavorList.forEach(item => {
        const percentOfTotal = (item.currRevenue / (currTotalRevenue || 1)) * 100;
        text += `- ${item.flavor}: ${item.currQuantity} unid. | Fat: R$ ${item.currRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Lucro: R$ ${item.currProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Margem: ${item.margin.toFixed(0)}% | Share: ${percentOfTotal.toFixed(1)}%\n`;
      });
      text += `\n`;
    }

    if (insights.length > 0) {
      text += `💡 PLANO DE AÇÃO PARA AUMENTO DE VENDAS:\n`;
      insights.forEach(insight => {
        text += `• ${insight.title.toUpperCase()}\n`;
        text += `  Diagnóstico: ${insight.desc}\n`;
        text += `  👉 Ação Recomendada: ${insight.action}\n\n`;
      });
    }

    text += `Relatório gerado em ${new Date().toLocaleString("pt-BR")} pelo Painel OmniVenda.`;

    try {
      navigator.clipboard.writeText(text);
      triggerNotify("Relatório copiado!");
    } catch (err) {
      console.error("Falha ao copiar", err);
      triggerNotify("Erro ao copiar para clipboard.");
    }
  };

  const handleTriggerSystemPrint = () => {
    const { formattedPeriodStr, currentMarginVal, marginChangeVal } = dashboardPrintData;
    const {
      currTotalRevenue,
      currTotalProfit,
      currClientCount,
      revChangePercent,
      profitChangePercent,
      clientChangePercent,
      flavorList,
      insights,
    } = flavorAndIntelligenceData;

    const companyName = businessProfile.companyName || "OmniVenda";
    const timestampStr = new Date().toLocaleString("pt-BR");

    const flavorRowsHtml = flavorList
      .map((item) => {
        const percentOfTotal = (item.currRevenue / (currTotalRevenue || 1)) * 100;
        const trendBadge =
          item.revChange > 0
            ? `<span style="background-color:#dcfce7;color:#15803d;padding:2px 6px;border-radius:4px;font-weight:bold;font-size:10px;">+${item.revChange.toFixed(0)}% ▲</span>`
            : item.revChange < 0
              ? `<span style="background-color:#fee2e2;color:#b91c1c;padding:2px 6px;border-radius:4px;font-weight:bold;font-size:10px;">${item.revChange.toFixed(0)}% ▼</span>`
              : `<span style="background-color:#f1f5f9;color:#475569;padding:2px 6px;border-radius:4px;font-weight:bold;font-size:10px;">0% •</span>`;
        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#0f172a;font-family:sans-serif;">${item.flavor}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:sans-serif;">${item.currQuantity} ud</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:sans-serif;font-weight:600;">R$ ${item.currRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#10b981;font-weight:bold;font-family:sans-serif;">R$ ${item.currProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:sans-serif;font-weight:500;">${item.margin.toFixed(0)}%</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;font-family:sans-serif;font-weight:600;">${percentOfTotal.toFixed(1)}%</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;font-family:sans-serif;">${trendBadge}</td>
          </tr>
        `;
      })
      .join("");

    const flavorBarsHtml = flavorList
      .map((item) => {
        const isPositive = item.revChange > 0;
        const isNegative = item.revChange < 0;
        const changeAbs = Math.min(Math.abs(item.revChange), 100);
        const percentOfTotal = (item.currRevenue / (currTotalRevenue || 1)) * 100;
        const changeSign = item.revChange > 0 ? "+" : "";
        const badgeColor = isPositive ? "#16a34a" : isNegative ? "#dc2626" : "#64748b";
        const trendSymbol = isPositive ? "▲" : isNegative ? "▼" : "•";

        return `
          <div style="margin-bottom: 15px; font-family: sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 4px; font-weight: bold; color: #1e293b;">
              <span style="font-weight: 800;">${item.flavor}</span>
              <span>
                <span style="color: #64748b; font-weight: normal; margin-right: 8px;">${item.currQuantity} uds (${percentOfTotal.toFixed(1)}% share)</span>
                <span style="color: ${badgeColor}; font-weight: 900;">${trendSymbol} ${changeSign}${item.revChange.toFixed(0)}%</span>
              </span>
            </div>
            <div style="position: relative; height: 10px; width: 100%; background: #f1f5f9; border-radius: 9999px; overflow: hidden; display: flex;">
              ${isNegative ? `
                <div style="width: 50%; display: flex; justify-content: flex-end; background-color: #f1f5f9;">
                  <div style="width: ${changeAbs}%; background-color: #ef4444; height: 100%; border-radius: 9999px 0 0 9999px;"></div>
                </div>
              ` : `
                <div style="width: 50%; background-color: #f1f5f9;"></div>
              `}
              
              <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background-color: #64748b; z-index: 10;"></div>
              
              ${isPositive ? `
                <div style="width: 50%; display: flex; justify-content: flex-start; background-color: #f1f5f9;">
                  <div style="width: ${changeAbs}%; background-color: #22c55e; height: 100%; border-radius: 0 9999px 9999px 0;"></div>
                </div>
              ` : `
                <div style="width: 50%; background-color: #f1f5f9;"></div>
              `}
            </div>
          </div>
        `;
      })
      .join("");

    const insightsHtml = insights
      .map((id, idx) => {
        const isPositive = id.type === "positive";
        const isNegative = id.type === "negative";
        const colorStyle = isPositive
          ? "border-left:4px solid #10b981;background-color:#f0fdf4;"
          : isNegative
            ? "border-left:4px solid #ef4444;background-color:#fef2f2;"
            : "border-left:4px solid #3b82f6;background-color:#eff6ff;";
        return `
          <div style="padding:16px;border-radius:12px;margin-bottom:16px;border:1px solid #e2e8f0;${colorStyle}page-break-inside:avoid;text-align:left;">
            <h4 style="margin:0;font-size:14px;font-weight:bold;color:#1e293b;text-transform:uppercase;font-family:sans-serif;">${idx + 1}. ${id.title}</h4>
            <p style="margin:8px 0 12px 0;font-size:12px;color:#475569;line-height:1.5;font-family:sans-serif;font-weight:500;">${id.desc}</p>
            <div style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;color:#78350f;text-align:left;">
              <span style="font-size:10px;font-weight:bold;text-transform:uppercase;color:#b45309;display:block;margin-bottom:4px;font-family:sans-serif;">👉 Ação de Vendas Recomendada:</span>
              <span style="font-size:12.5px;font-weight:bold;line-height:1.4;font-family:sans-serif;">${id.action}</span>
            </div>
          </div>
        `;
      })
      .join("");

    const reportHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Resumo Executivo - ${companyName}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            color: #1e293b;
            line-height: 1.5;
            margin: 0;
            padding: 30px;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            border-bottom: 3px solid #0f172a;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .header-title h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 850;
            letter-spacing: -0.025em;
            text-transform: uppercase;
            color: #0d1117;
          }
          .header-title p {
            margin: 4px 0 0 0;
            font-size: 11px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .header-meta {
            text-align: right;
          }
          .header-meta h2 {
            margin: 0;
            font-size: 11px;
            color: #d97706;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 900;
          }
          .header-meta .period {
            margin: 4px 0 0 0;
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
          }
          .header-meta .timestamp {
            margin: 2px 0 0 0;
            font-size: 9px;
            color: #94a3b8;
            font-weight: bold;
          }
          .metrics-grid {
            display: grid;
            grid-template-cols: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 30px;
          }
          .metric-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            background-color: #f8fafc;
            text-align: left;
          }
          .metric-card.fat { border-left: 4px solid #0ea5e9; }
          .metric-card.luc { border-left: 4px solid #10b981; }
          .metric-card.marg { border-left: 4px solid #8b5cf6; }
          .metric-card.cli { border-left: 4px solid #f59e0b; }
          .metric-label {
            font-size: 9px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .metric-val {
            font-size: 17px;
            font-weight: 900;
            color: #0f172a;
            margin: 6px 0 4px 0;
          }
          .metric-change {
            font-size: 10px;
            font-weight: bold;
          }
          .text-pos { color: #16a34a; }
          .text-neg { color: #dc2626; }
          .section-title {
            font-size: 13px;
            font-weight: 950;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 6px;
            margin: 30px 0 15px 0;
            text-align: left;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 10px;
          }
          th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.05em;
            padding: 10px;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 25px; padding: 15px; background: #fffbeb; border: 1px dashed #fde68a; border-radius: 12px;" class="no-print">
          <button onclick="window.print()" style="background-color: #d97706; color: white; border: none; padding: 12px 28px; font-weight: 900; border-radius: 10px; cursor: pointer; font-size: 13px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.15); font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s;">
            🖨️ CONFIRMAR IMPRESSÃO / SALVAR EM PDF
          </button>
          <div style="font-size: 11px; color: #78350f; margin-top: 10px; font-weight: bold; font-family: sans-serif; line-height: 1.4;">
            Caso a caixa de diálogo de impressão do navegador não tenha aberto automaticamente, clique no botão acima.<br>
            Você pode salvar o arquivo como um documento <b>PDF</b> ou mandá-lo diretamente para a sua impressora física.
          </div>
        </div>

        <div class="header">
          <div class="header-title">
            <h1>${companyName}</h1>
            <p>Relatório Comercial & Inteligência de Vendas</p>
          </div>
          <div class="header-meta">
            <h2>RESUMO COMERCIAL EXECUTIVO</h2>
            <div class="period">${formattedPeriodStr}</div>
            <div class="timestamp">Gerado em: ${timestampStr}</div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card fat">
            <div class="metric-label">Faturamento Geral</div>
            <div class="metric-val">R$ ${currTotalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            <div class="metric-change ${revChangePercent >= 0 ? "text-pos" : "text-neg"}">
              ${revChangePercent >= 0 ? "▲ +" : "▼ "}${revChangePercent.toFixed(0)}% vs anterior
            </div>
          </div>
          <div class="metric-card luc">
            <div class="metric-label">Lucro Estimado</div>
            <div class="metric-val">R$ ${currTotalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            <div class="metric-change ${profitChangePercent >= 0 ? "text-pos" : "text-neg"}">
              ${profitChangePercent >= 0 ? "▲ +" : "▼ "}${profitChangePercent.toFixed(0)}% vs anterior
            </div>
          </div>
          <div class="metric-card marg">
            <div class="metric-label">Margem Média</div>
            <div class="metric-val">${currentMarginVal.toFixed(1)}%</div>
            <div class="metric-change ${marginChangeVal >= 0 ? "text-pos" : "text-neg"}">
              ${marginChangeVal >= 0 ? "▲ +" : "▼ "}${marginChangeVal.toFixed(1)}% vs anterior
            </div>
          </div>
          <div class="metric-card cli">
            <div class="metric-label">Clientes Compradores</div>
            <div class="metric-val">${currClientCount}</div>
            <div class="metric-change ${clientChangePercent >= 0 ? "text-pos" : "text-neg"}">
              ${clientChangePercent >= 0 ? "▲ +" : "▼ "}${clientChangePercent.toFixed(0)}% vs anterior
            </div>
          </div>
        </div>

        <div class="section-title">📊 Gráfico de Oscilação de Vendas por Sabor (% Crescimento / Queda)</div>
        ${
          flavorList.length === 0
            ? '<p style="text-align: center; color: #94a3b8; font-weight: bold; font-family: sans-serif;">Nenhum gráfico disponível.</p>'
            : `
              <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; background-color: #f8fafc; margin-bottom: 25px; page-break-inside: avoid; text-align: left;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 10px; font-weight: 955; color: #64748b; text-transform: uppercase; font-family: sans-serif;">
                  <span>📉 Queda nas Vendas (vs anterior)</span>
                  <span style="text-align: center; width: 2px; background: #94a3b8; height: 12px;"></span>
                  <span>📈 Crescimento nas Vendas (vs anterior)</span>
                </div>
                ${flavorBarsHtml}
                <div style="margin-top: 10px; font-size: 9px; text-align: center; color: #64748b; font-weight: bold; font-family: sans-serif; text-transform: uppercase;">
                  * O gráfico mostra a variação percentual de vendas em relação ao período anterior (Eixo central = 0% de oscilação).
                </div>
              </div>
            `
        }

        <div class="section-title">Desempenho por Sabor (Volume & Faturamento)</div>
        ${
          flavorList.length === 0
            ? '<p style="text-align: center; color: #94a3b8; font-weight: bold; margin-top: 20px; font-family: sans-serif;">Nenhuma movimentação registrada.</p>'
            : `
              <table>
                <thead>
                  <tr>
                    <th>Sabor de Cocada</th>
                    <th style="text-align: right;">Volume</th>
                    <th style="text-align: right;">Faturamento</th>
                    <th style="text-align: right;">Est. Lucro</th>
                    <th style="text-align: right;">Margem %</th>
                    <th style="text-align: right;">Share %</th>
                    <th style="text-align: center;">Oscilação</th>
                  </tr>
                </thead>
                <tbody>
                  ${flavorRowsHtml}
                </tbody>
              </table>
            `
        }

        <div class="section-title" style="margin-top: 40px;">Planos Inteligentes de Vendas</div>
        ${
          insights.length === 0
            ? '<p style="text-align: center; color: #94a3b8; font-weight: bold; font-family: sans-serif;">Nenhuma ação cadastrada para este ciclo.</p>'
            : `<div>${insightsHtml}</div>`
        }

        <div style="margin-top: 60px; border-top: 1px solid #cbd5e1; padding-top: 18px; text-align: center; font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; font-family: sans-serif;">
          Relatório de Performance Comercial • Gerado pelo Sistema OmniVenda
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          }
        </script>
      </body>
      </html>
    `;

    try {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        triggerNotify("Visualizador aberto em nova janela!");
      } else {
        // Fallback inside same window
        triggerNotify("Popups bloqueados! Usando impressão local...");
        window.print();
      }
    } catch (err) {
      console.error(err);
      triggerNotify("Usando impressão interna do sistema...");
      window.print();
    }
  };


  const handleUpdateSubscription = async (
    bizId: string,
    status: string,
    date: string,
  ) => {
    try {
      const biz = allBusinessesStats.find((b) => b.id === bizId);
      if (!biz) return;
      const updatedProfile = { ...biz, planStatus: status, nextBilling: date };
      await db.profile.update(updatedProfile);
      setAllBusinessesStats((prev) =>
        prev.map((b) =>
          b.id === bizId ? { ...b, planStatus: status, nextBilling: date } : b,
        ),
      );
      setSubscriptionModal({ isOpen: false, business: null });
      triggerNotify("Assinatura Atualizada!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBusiness = async (bizId: string) => {
    if (!confirm("Excluir empresa permanentemente?")) return;
    try {
      await db.admin.deleteBusiness(bizId);
      setAllBusinessesStats((prev) => prev.filter((b) => b.id !== bizId));
      setSubscriptionModal({ isOpen: false, business: null });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendNotification = (biz: any) => {
    const message = `Olá ${biz.companyName}! Vencimento OmniVenda em ${biz.nextBilling}.`;
    const phone = biz.phone?.replace(/\D/g, "") || "";
    window.open(
      `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const handleRetroactiveCostUpdate = async (
    productId: string,
    newCost: number,
  ) => {
    setLoading(true);
    try {
      const updatedSales = salesHistory.map((sale) => {
        let hasProduct = false;
        const updatedItems = sale.items.map((item) => {
          if (item.id === productId) {
            hasProduct = true;
            return { ...item, costPrice: newCost };
          }
          return item;
        });
        if (!hasProduct) return sale;
        const totalItemsCost = updatedItems.reduce(
          (acc, item) => acc + Number(item.costPrice || 0) * item.quantity,
          0,
        );
        const newProfit = Number(sale.total) - totalItemsCost;
        return { ...sale, items: updatedItems, profit: newProfit };
      });
      const salesToUpdate = updatedSales.filter(
        (s, i) => s !== salesHistory[i],
      );
      for (const sale of salesToUpdate) await db.sales.update(sale);
      setSalesHistory(updatedSales);
      triggerNotify("Sincronizado!");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const Header = ({
    title,
    showBack = false,
    rightAction,
  }: {
    title: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
  }) => (
    <div className="sticky top-0 z-40 bg-[#fffbeb]">
      <header className="bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] text-white pt-1.5 pb-1.5 sm:pt-3 sm:pb-3 px-4 sm:px-6 shadow-xl rounded-b-[1.5rem] sm:rounded-b-[1.8rem] relative overflow-hidden border-b-4 border-yellow-400">
        <div className="absolute top-2 right-0 p-4 opacity-10 rotate-12 pointer-events-none">
          <Palmtree size={50} />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            {showBack && !isProfileIncomplete ? (
              <button
                onClick={() =>
                  isImpersonating
                    ? handleExitImpersonation()
                    : setCurrentScreen("HOME")
                }
                className="bg-white/20 p-1.5 rounded-lg active:scale-90 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div
                onClick={() => !isPureAdmin && setCurrentScreen("SETTINGS")}
                className="w-12 h-12 bg-white rounded-xl shadow-lg border-2 border-yellow-400 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                {businessProfile.logoUrl ? (
                  <img
                    src={convertDriveLink(businessProfile.logoUrl)}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[#0ea5e9] font-black text-xl italic leading-none">
                    {businessProfile.companyName?.charAt(0) || "O"}
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-col justify-center">
              <h1 className="text-[32px] sm:text-[38px] font-black tracking-tighter uppercase italic leading-none">
                {title}
              </h1>
              <p className="text-yellow-300 text-[10px] sm:text-[12px] font-black uppercase tracking-[0.15em] mt-0.5 leading-none">
                Conectado OmniVenda Cloud
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {rightAction}
            <button
              onClick={handleLogout}
              className="p-2 bg-red-500/20 rounded-xl border border-white/10"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
    </div>
  );

  if (isResettingPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fffbeb] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 text-yellow-200/50 rotate-12 opacity-50">
          <Palmtree size={300} />
        </div>
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-8 z-10 border-b-8 border-blue-500">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center text-white shadow-lg mb-4 transform rotate-3 border-2 border-yellow-400">
              <Lock size={40} strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter text-center">
              Nova Senha Cloud
            </h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">
              Defina sua nova senha de acesso
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative">
              <Lock
                className="absolute left-4 top-4 text-slate-400"
                size={18}
              />
              <input
                type="password"
                placeholder="Nova Senha (mín. 6 chars)"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-4 top-4 text-slate-400"
                size={18}
              />
              <input
                type="password"
                placeholder="Confirme a Nova Senha"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full bg-[#0ea5e9] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-blue-700 mt-4"
            >
              {resetLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <CheckCircle size={20} />
              )}
              Atualizar Senha Agora
            </button>

            <button
              type="button"
              onClick={() => setIsResettingPassword(false)}
              className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors py-2"
            >
              Cancelar e voltar
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!session) return <AuthScreen onAuthSuccess={handleAuthSuccess} />;

  if (loading) {
    return (
      <div className="h-screen bg-[#fffbeb] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 animate-pulse">
          Carregando...
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`min-h-screen bg-[#fffbeb] flex flex-col print:hidden ${currentScreen === "HOME" ? "overflow-y-auto pb-10" : "pb-32"}`}
      >
      {saveNotify.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 font-black uppercase italic text-[10px] border-2 border-white">
          <CheckCircle2 size={16} /> {saveNotify.msg}
        </div>
      )}

      {currentScreen === "HOME" && (!isPureAdmin || isImpersonating) && (
        <>
          <Header title={businessProfile.companyName} />
          <main className="px-6 mt-6 relative z-30 space-y-4 flex-1">
            {isDeveloper && (
              <button
                onClick={() => setCurrentScreen("DEVELOPER_PANEL")}
                className="w-full bg-slate-800 text-white py-3 px-6 rounded-2xl shadow-lg flex items-center justify-between border-b-4 border-slate-950"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-blue-400">
                    <Database size={18} />
                  </div>
                  <h3 className="text-sm font-black uppercase italic tracking-tighter">
                    Painel do Desenvolvedor
                  </h3>
                </div>
                <ArrowRight size={18} className="text-slate-600" />
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-5 rounded-[2.2rem] shadow-lg border-b-4 border-slate-100 flex flex-col h-32 justify-between">
                <div className="bg-[#0ea5e9] w-10 h-10 rounded-xl flex items-center justify-center text-white">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Total Vendas
                  </p>
                  <h4 className="text-lg font-black text-[#0ea5e9]">
                    R$ {currentSummary.vendasTotal.toFixed(2)}
                  </h4>
                </div>
              </div>
              <div className="bg-white p-5 rounded-[2.2rem] shadow-lg border-b-4 border-slate-100 flex flex-col h-32 justify-between">
                <div className="bg-green-500 w-10 h-10 rounded-xl flex items-center justify-center text-white">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Lucro Líquido
                  </p>
                  <h4 className="text-lg font-black text-green-600">
                    R$ {currentSummary.lucro.toFixed(2)}
                  </h4>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingSale(null);
                setSaleModal(true);
              }}
              className="w-full bg-yellow-400 text-[#1e293b] py-4 px-6 rounded-[2.5rem] shadow-xl flex items-center justify-between border-b-6 border-yellow-600 active:scale-95 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-yellow-500">
                  <Plus size={24} strokeWidth={4} />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter leading-none">
                    Novo Pedido
                  </h3>
                  <p className="text-amber-900/60 text-[7px] font-black uppercase mt-1">
                    Sincronizado na Nuvem
                  </p>
                </div>
              </div>
              <ChevronRight size={24} className="text-amber-900/20" />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentScreen("CLIENTS")}
                className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
              >
                <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500">
                  <Users size={28} />
                </div>
                <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest">
                  Clientes ({clients.length})
                </p>
              </button>
              <button
                onClick={() => setCurrentScreen("PRODUCTS")}
                className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
              >
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                  <Package size={28} />
                </div>
                <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest">
                  Produtos ({products.length})
                </p>
              </button>
              <button
                onClick={() => setCurrentScreen("MONTHLY_SALES")}
                className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
              >
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
                  <ClipboardList size={28} />
                </div>
                <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest">
                  Histórico
                </p>
              </button>
              <button
                onClick={() => setCurrentScreen("REPORTS")}
                className="bg-white p-6 rounded-[2.5rem] shadow-md border-b-4 border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
              >
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                  <BarChart3 size={28} />
                </div>
                <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest">
                  Relatório
                </p>
              </button>
            </div>
          </main>
        </>
      )}

      {currentScreen === "SETTINGS" && (!isPureAdmin || isImpersonating) && (
        <div className="min-h-screen bg-slate-50 pb-20">
          <Header title="Configurações" showBack={!isProfileIncomplete} />
          <div className="px-6 py-6 space-y-6">
            <SettingsForm
              profile={businessProfile}
              onLogout={handleLogout}
              onSave={async (p) => {
                const s = await db.profile.update(p);
                setBusinessProfile(s);
                triggerNotify("Salvo!");
              }}
            />
            <CostCorrectionTool
              products={products}
              salesHistory={salesHistory}
              onUpdateSales={handleRetroactiveCostUpdate}
            />
          </div>
        </div>
      )}

      {currentScreen === "CLIENTS" && (!isPureAdmin || isImpersonating) && (
        <div className="min-h-screen">
          <Header
            title="Clientes"
            showBack
            rightAction={
              <button
                onClick={() => setClientModal({ type: ModalType.ADD })}
                className="bg-white/20 p-2.5 rounded-2xl"
              >
                <Plus size={22} />
              </button>
            }
          />
          <div className="px-6 py-8 space-y-3">
            {clients.map((c) => (
              <div
                key={c.id}
                onClick={() =>
                  setClientModal({ type: ModalType.EDIT, data: c })
                }
                className="bg-white p-4 rounded-[2rem] shadow-md border-b-4 border-slate-100 flex items-center justify-between active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 font-black text-xl">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-base uppercase italic leading-tight">
                      {c.name}
                    </h4>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      {c.phone}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      {currentScreen === "PRODUCTS" && (!isPureAdmin || isImpersonating) && (
        <div className="min-h-screen">
          <Header
            title="Produtos"
            showBack
            rightAction={
              <button
                onClick={() => setProductModal({ type: ModalType.ADD })}
                className="bg-white/20 p-2.5 rounded-2xl"
              >
                <Plus size={22} />
              </button>
            }
          />
          <div className="px-6 pt-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>
          <div className="px-6 py-6 space-y-3">
            {products
              .filter((p) =>
                p.name.toLowerCase().includes(catalogSearch.toLowerCase()),
              )
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() =>
                    setProductModal({ type: ModalType.EDIT, data: p })
                  }
                  className="bg-white p-3 rounded-2xl shadow-lg flex items-center gap-3 active:scale-95 transition-all cursor-pointer border-b-4 border-slate-100"
                >
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="text-red-200" size={28} />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">
                      QTD: {p.stock}
                    </span>
                    <h3 className="font-black text-slate-800 text-sm uppercase italic leading-none">
                      {p.name}
                    </h3>
                    <p className="text-lg font-black text-[#0ea5e9]">
                      R$ {Number(p.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {currentScreen === "MONTHLY_SALES" &&
        (!isPureAdmin || isImpersonating) && (
          <div className="min-h-screen">
            <Header title="Histórico" showBack />
            <div className="px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-4">
              {salesHistoryWithNumbers.map((sale) => {
                const dateMatch = sale.paymentTerms?.match(/\d{2}\/\d{2}\/\d{4}/);
                const dueDateExtracted = dateMatch ? dateMatch[0] : null;

                return (
                  <div
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-md border border-slate-100 flex flex-col p-3 sm:p-5 gap-2.5 sm:gap-4 hover:shadow-lg transition-all cursor-pointer animate-in fade-in duration-200"
                  >
                    {/* Top Row: Client Info + Total Price */}
                    <div className="flex justify-between items-start gap-2.5 w-full">
                      {/* Left side: Avatar + Client Name & Badges */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${sale.status === "ORCAMENTO" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}
                        >
                          {sale.status === "ORCAMENTO" ? (
                            <FileText size={16} className="sm:w-[20px] sm:h-[20px]" />
                          ) : (
                            <ShoppingBag size={16} className="sm:w-[20px] sm:h-[20px]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-slate-800 text-[13px] sm:text-base uppercase italic leading-tight truncate">
                            {sale.clientName}
                          </h4>
                          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase mt-0.5 sm:mt-1">
                            PEDIDO{" "}
                            {sale.orderNumber
                              ? String(sale.orderNumber).padStart(4, "0")
                              : "..."}{" "}
                            • {sale.date}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 sm:mt-1.5">
                            <span
                              className={`text-[9px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-md ${sale.status === "ORCAMENTO" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                            >
                              {sale.status === "ORCAMENTO"
                                ? "Orçamento"
                                : "Finalizada"}
                            </span>
                            <span
                              className={`text-[9px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-md ${sale.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {sale.isPaid ? "Pago" : `Pendente ${dueDateExtracted ? `• Venc: ${dueDateExtracted}` : ""}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Total Price */}
                      <div className="text-right shrink-0 mt-0.5">
                        <p className="text-base sm:text-xl font-black text-[#0ea5e9]">
                          R$ {Number(sale.total).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Inline Actions Menu */}
                    <div
                      className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-start sm:justify-start flex-1 min-w-0 border-t border-slate-50 pt-1.5 sm:pt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 p-2 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xs"
                        title="Visualizar Pedido"
                      >
                        <Eye size={16} className="text-slate-500 sm:w-[17px] sm:h-[17px]" />
                        <span className="hidden sm:inline">Visualizar</span>
                      </button>

                      <button
                        onClick={() => handleTogglePaid(sale.id, !sale.isPaid)}
                        className={`flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xs border ${
                          sale.isPaid
                            ? "bg-amber-50/40 hover:bg-amber-50 border-amber-100/50 text-amber-700"
                            : "bg-green-50/40 hover:bg-green-50 border-green-100/50 text-green-700"
                        }`}
                        title={sale.isPaid ? "Estornar Pagamento (Marcar como Pendente)" : "Dar Baixa no Pedido (Marcar como Pago)"}
                      >
                        {sale.isPaid ? (
                          <>
                            <AlertCircle size={16} className="text-amber-500 sm:w-[17px] sm:h-[17px]" />
                            <span className="hidden sm:inline">Estornar</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} className="text-green-500 sm:w-[17px] sm:h-[17px]" />
                            <span className="hidden sm:inline">Dar Baixa</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditSale(sale)}
                        className="flex items-center gap-1 bg-blue-50/40 hover:bg-blue-50 border border-blue-100/50 text-blue-600 p-2 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xs"
                        title="Editar Pedido"
                      >
                        <Edit3 size={16} className="text-blue-500 sm:w-[17px] sm:h-[17px]" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      <button
                        onClick={() => handlePrintSaleDirect(sale)}
                        className="flex items-center gap-1 bg-sky-50/40 hover:bg-sky-50 border border-sky-100/50 text-sky-600 p-2 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xs"
                        title="Imprimir Comprovante"
                      >
                        <Printer size={16} className="text-sky-500 sm:w-[17px] sm:h-[17px]" />
                        <span className="hidden sm:inline">Imprimir</span>
                      </button>

                      <button
                        onClick={() => handleShareWhatsAppDirect(sale)}
                        className="flex items-center gap-1 bg-emerald-50/40 hover:bg-emerald-50 border border-emerald-100/50 text-emerald-600 p-2 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xs"
                        title="Enviar WhatsApp"
                      >
                        <MessageSquare size={16} className="text-emerald-500 sm:w-[17px] sm:h-[17px]" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="flex items-center gap-1 bg-red-50/40 hover:bg-red-50 border border-red-100/50 text-red-650 p-2 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xs"
                        title="Excluir Pedido"
                      >
                        <Trash2 size={16} className="text-red-500 sm:w-[17px] sm:h-[17px]" />
                        <span className="hidden sm:inline">Excluir</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {currentScreen === "DEVELOPER_PANEL" && isDeveloper && (
        <div className="min-h-screen">
          <Header title="Admin" showBack={!isPureAdmin} />
          <div className="px-6 py-6 space-y-4">
            {allBusinessesStats.map((biz) => (
              <div
                key={biz.id}
                className="bg-white p-4 rounded-[2rem] shadow-md flex items-center justify-between"
              >
                <div>
                  <h4 className="font-black text-slate-800 text-sm uppercase italic">
                    {biz.companyName}
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    {biz.email}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSubscriptionModal({ isOpen: true, business: biz })
                  }
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase"
                >
                  Gerenciar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentScreen === "REPORTS" && (!isPureAdmin || isImpersonating) && (
        <div className="min-h-screen bg-[#f8fafc] pb-32">
          <Header title="Relatórios" showBack />
          <div className="p-4 space-y-4">
            {/* Period Filter card */}
            <div className="bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white rounded-[2rem] p-4.5 sm:p-5 shadow-xl border-b-4 border-[#0369a1] space-y-4 relative overflow-hidden shadow-sky-100/40">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
              <div className="flex justify-between items-center bg-sky-950/25 p-1 rounded-[1.3rem] border border-white/5 relative z-10">
                <button
                  onClick={() => setReportTab("DIARIO")}
                  className={`flex-1 py-1 sm:py-1.5 rounded-xl text-sm sm:text-base font-black uppercase tracking-tight transition-all ${reportTab === "DIARIO" ? "bg-white text-sky-800 shadow-md" : "text-sky-100/80 hover:text-white hover:bg-white/5"}`}
                >
                  Dia
                </button>
                <button
                  onClick={() => setReportTab("MENSAL")}
                  className={`flex-1 py-1 sm:py-1.5 rounded-xl text-sm sm:text-base font-black uppercase tracking-tight transition-all ${reportTab === "MENSAL" ? "bg-white text-sky-800 shadow-md" : "text-sky-100/80 hover:text-white hover:bg-white/5"}`}
                >
                  Mês
                </button>
                <button
                  onClick={() => setReportTab("ANUAL")}
                  className={`flex-1 py-1 sm:py-1.5 rounded-xl text-sm sm:text-base font-black uppercase tracking-tight transition-all ${reportTab === "ANUAL" ? "bg-white text-sky-800 shadow-md" : "text-sky-100/80 hover:text-white hover:bg-white/5"}`}
                >
                  Ano
                </button>
                <button
                  onClick={() => setReportTab("TOTAL")}
                  className={`flex-1 py-1 sm:py-1.5 rounded-xl text-sm sm:text-base font-black uppercase tracking-tight transition-all ${reportTab === "TOTAL" ? "bg-white text-sky-800 shadow-md" : "text-sky-100/80 hover:text-white hover:bg-white/5"}`}
                >
                  Tudo
                </button>
              </div>
              <div className="flex items-center justify-between px-1 relative z-10">
                <button
                  onClick={() => changeDate(-1)}
                  className="p-2 bg-white/10 hover:bg-white/20 active:scale-90 text-white rounded-xl transition-all disabled:opacity-20 disabled:hover:bg-white/10 shadow-sm border border-white/5"
                  disabled={reportTab === "TOTAL"}
                >
                  <ChevronLeft size={20} className="stroke-[2.5]" />
                </button>
                <span className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-white drop-shadow-sm">
                  {reportTab === "DIARIO"
                    ? currentDate.toLocaleDateString("pt-BR")
                    : reportTab === "MENSAL"
                      ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                      : reportTab === "ANUAL"
                        ? currentDate.getFullYear()
                        : "Todo o Período"}
                </span>
                <button
                  onClick={() => changeDate(1)}
                  className="p-2 bg-white/10 hover:bg-white/20 active:scale-90 text-white rounded-xl transition-all disabled:opacity-20 disabled:hover:bg-white/10 shadow-sm border border-white/5"
                  disabled={reportTab === "TOTAL"}
                >
                  <ChevronRight size={20} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Bento Grid - KPI stats */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. FATURAMENTO */}
              <div className="col-span-2 bg-[#f0f9ff] p-5 rounded-[2rem] border border-sky-100 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-sky-600">
                    FATURAMENTO TOTAL
                  </p>
                  <h3 className="text-2xl font-black text-slate-800 uppercase italic leading-none">
                    R${" "}
                    {currentSummary.vendasTotal.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    {currentSummary.vendasCount} Vendas no período
                  </p>
                </div>
                <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={22} className="stroke-[2.5]" />
                </div>
              </div>

              {/* 2. LUCRO REAL */}
              <div className="bg-[#f0fdf4] p-4 rounded-[2rem] border border-green-100 shadow-sm flex flex-col justify-between h-28">
                <div className="flex items-start justify-between">
                  <p className="text-[8px] font-black uppercase tracking-widest text-green-600 leading-none">
                    LUCRO REAL
                  </p>
                  <div className="bg-green-100 text-green-700 font-bold text-[7px] px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none font-sans">
                    {(
                      (currentSummary.lucro /
                        (currentSummary.vendasTotal || 1)) *
                      100
                    ).toFixed(0)}
                    % margem
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800 uppercase italic">
                    R${" "}
                    {currentSummary.lucro.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h4>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 font-sans">
                    Rentabilidade
                  </p>
                </div>
              </div>

              {/* 3. A RECEBER */}
              <div className="bg-[#fef2f2] p-4 rounded-[2rem] border border-red-100 shadow-sm flex flex-col justify-between h-28">
                <div className="flex items-start justify-between">
                  <p className="text-[8px] font-black uppercase tracking-widest text-red-500 leading-none">
                    A RECEBER
                  </p>
                  <div className="bg-red-100 text-red-600 font-bold text-[7px] px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none font-sans">
                    {currentSummary.aReceberCount} pendente(s)
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-black text-red-500 uppercase italic">
                    R${" "}
                    {currentSummary.aReceberTotal.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h4>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 font-sans">
                    Contas em aberto
                  </p>
                </div>
              </div>

              {/* 4. TOTAL POTES */}
              <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                <div className="flex items-start justify-between">
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#0ea5e9] leading-none">
                    POTES VENDIDOS
                  </p>
                  <div className="bg-sky-50 text-[#0ea5e9] font-bold text-[7px] px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                    Potes
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800 uppercase italic font-sans">
                    {clientRanking.reduce(
                      (acc, curr) => acc + (curr.totalPotes || 0),
                      0,
                    )}{" "}
                    Potes
                  </h4>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 font-sans">
                    Volume físico
                  </p>
                </div>
              </div>

              {/* 5. TICKET MÉDIO */}
              <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                <div className="flex items-start justify-between">
                  <p className="text-[8px] font-black uppercase tracking-widest text-indigo-550 leading-none">
                    TICKET MÉDIO
                  </p>
                  <div className="bg-indigo-50 text-indigo-600 font-bold text-[7px] px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                    Média
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800 uppercase italic font-sans">
                    R${" "}
                    {(
                      currentSummary.vendasTotal /
                      (currentSummary.vendasCount || 1)
                    ).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h4>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 font-sans">
                    Por pedido
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* PREMIUM EXECUTIVE DASHBOARD - HIDDEN */}
              {false && (
                <div className="col-span-1 space-y-4">
                  {/* Dynamic Recharts Chart Section */}
                  <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 leading-none">
                          Progressão de Vendas
                        </h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          Evolução de faturamento e lucro
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[8px] font-black text-sky-500 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"></span>{" "}
                          Faturamento
                        </span>
                        <span className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>{" "}
                          Lucro
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-44">
                      {dashboardChartData.length === 0 ||
                      dashboardChartData.every((item) => item.total === 0) ? (
                        <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-100 rounded-2xl bg-slate-50 text-center p-4">
                          <BarChart3
                            className="text-slate-300 mb-2"
                            size={24}
                          />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            Sem movimentação no período
                          </span>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={dashboardChartData}
                            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id="colorTotal"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#38bdf8"
                                  stopOpacity={0.2}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#38bdf8"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="colorProfit"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#10b981"
                                  stopOpacity={0.2}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#10b981"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="label"
                              stroke="#94a3b8"
                              fontSize={8}
                              fontWeight={900}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="#94a3b8"
                              fontSize={8}
                              fontWeight={900}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(val) => `R$ ${val}`}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "#0f172a",
                                border: "none",
                                borderRadius: "1rem",
                                padding: "10px",
                              }}
                              labelStyle={{
                                fontSize: "9px",
                                fontWeight: "900",
                                color: "#94a3b8",
                                textTransform: "uppercase",
                              }}
                              itemStyle={{
                                fontSize: "10px",
                                fontWeight: "900",
                                padding: "2px 0",
                              }}
                              formatter={(value: any, name: string) => [
                                `R$ ${Number(value).toFixed(2)}`,
                                name === "total" ? "FATURAMENTO" : "LUCRO",
                              ]}
                            />
                            <Area
                              type="monotone"
                              dataKey="total"
                              name="total"
                              stroke="#38bdf8"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#colorTotal)"
                            />
                            <Area
                              type="monotone"
                              dataKey="profit"
                              name="profit"
                              stroke="#10b981"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#colorProfit)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Payment Methods breakdown */}
                  <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4 text-left">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 leading-none">
                        Meios de Pagamento
                      </h4>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Receita distribuída por forma de pagamento
                      </p>
                    </div>

                    {paymentMethodsBreakdown.length === 0 ? (
                      <div className="text-center p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                          Sem dados de pagamento
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 font-sans">
                        {paymentMethodsBreakdown.map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase">
                              <span className="text-slate-600 italic tracking-wide">
                                {item.name}
                              </span>
                              <span className="text-slate-800">
                                R$ {item.value.toFixed(2)} (
                                {item.percent.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Three Ranking Action Buttons - TARGETED */}
              <div className="space-y-3 text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#94a3b8] ml-1 block font-sans">
                  Explorar Rankings
                </span>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setCurrentScreen("CLIENT_REPORT")}
                    className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500">
                        <Users size={24} />
                      </div>
                      <div className="text-left font-sans">
                        <p className="font-black text-slate-800 uppercase text-xs italic">
                          Ranking Clientes
                        </p>
                        <p className="text-[7px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mt-1">
                          Quem mais compra no período
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                  </button>

                  <button
                    onClick={() => setCurrentScreen("PENDING_REPORT")}
                    className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                        <DollarSign size={24} />
                      </div>
                      <div className="text-left font-sans">
                        <p className="font-black text-slate-800 uppercase text-xs italic font-sans">
                          Contas Pendentes
                        </p>
                        <p className="text-[7px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mt-1 font-sans">
                          Total a receber por cliente
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                  </button>

                  <button
                    onClick={() => setCurrentScreen("PRODUCT_REPORT")}
                    className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                        <Package size={24} />
                      </div>
                      <div className="text-left font-sans font-sans">
                        <p className="font-black text-slate-800 uppercase text-xs italic">
                          Ranking Produtos
                        </p>
                        <p className="text-[7px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mt-1 font-sans">
                          Produtos mais vendidos no período
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                  </button>

                  <button
                    onClick={() => setCurrentScreen("DASHBOARD")}
                    className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-sm flex items-center justify-between active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white">
                        <LayoutDashboard size={24} />
                      </div>
                      <div className="text-left font-sans">
                        <p className="font-black text-white uppercase text-xs italic">
                          Dashboard Executivo
                        </p>
                        <p className="text-[7px] font-black text-sky-400 uppercase tracking-widest leading-none mt-1 font-sans">
                          Gráficos, faturamento e lucro
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-sky-400" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setCurrentScreen("CLIENT_REPORT")}
                className="hidden bg-white p-6 rounded-[2rem] shadow-md border-b-4 border-slate-100 flex items-center justify-between active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500">
                    <Users size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-800 uppercase text-xs italic">
                      Ranking Clientes
                    </p>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                      Quem mais compra
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-200" />
              </button>

              <button
                onClick={() => setCurrentScreen("PENDING_REPORT")}
                className="hidden bg-white p-6 rounded-[2rem] shadow-md border-b-4 border-slate-100 flex items-center justify-between active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                    <DollarSign size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-800 uppercase text-xs italic">
                      Ranking Pendentes
                    </p>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                      Total a receber por cliente
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-200" />
              </button>

              <button
                onClick={() => setCurrentScreen("PRODUCT_REPORT")}
                className="hidden bg-white p-6 rounded-[2rem] shadow-md border-b-4 border-slate-100 flex items-center justify-between active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                    <Package size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-800 uppercase text-xs italic">
                      Ranking Produtos
                    </p>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                      Produtos mais vendidos
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-200" />
              </button>
            </div>
          </div>
        </div>
      )}

      {currentScreen === "DASHBOARD" && (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-32">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-6">
              <button
                onClick={() => setCurrentScreen("REPORTS")}
                className="bg-white/10 p-2.5 rounded-2xl active:scale-90 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-center flex-1">
                Dashboard Executivo
              </h3>
              <button
                onClick={handlePrintDashboard}
                className="bg-white/10 p-2.5 rounded-2xl active:scale-90 hover:bg-white/20 transition-all text-white flex items-center justify-center"
                title="Imprimir Relatório"
              >
                <Printer size={20} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Banner de Impressão Rápida / Resumo Executivo */}
            <div
              onClick={handlePrintDashboard}
              className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-[2rem] shadow-sm flex items-center justify-between text-white active:scale-[0.98] transition-all cursor-pointer hover:shadow-md border border-amber-400"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  <Printer size={20} className="stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <h4 className="text-[11px] font-black uppercase tracking-wider leading-none">
                    Imprimir Resumo Executivo
                  </h4>
                  <p className="text-[8.5px] font-bold text-amber-100 uppercase tracking-widest mt-1">
                    Gerar PDF com indicadores e plano de ações de vendas
                  </p>
                </div>
              </div>
              <div className="bg-white text-amber-700 text-[9px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl shrink-0 active:scale-95 transition-all shadow-sm">
                Imprimir
              </div>
            </div>

            {/* 1. Progressão de Vendas (AreaChart) */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 leading-none">
                    Progressão de Vendas
                  </h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Evolução de faturamento e lucro
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[8px] font-black text-sky-500 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block font-sans"></span>{" "}
                    Faturamento
                  </span>
                  <span className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block font-sans"></span>{" "}
                    Lucro
                  </span>
                </div>
              </div>

              <div className="w-full h-48">
                {dashboardChartData.length === 0 ||
                dashboardChartData.every((item) => item.total === 0) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-100 rounded-2xl bg-slate-50 text-center p-4">
                    <BarChart3 className="text-slate-300 mb-2" size={24} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none font-sans">
                      Sem movimentação no período
                    </span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dashboardChartData}
                      margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorTotal"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#38bdf8"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#38bdf8"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorProfit"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="label"
                        stroke="#94a3b8"
                        fontSize={8}
                        fontWeight={900}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={8}
                        fontWeight={900}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `R$ ${val}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "none",
                          borderRadius: "1rem",
                          padding: "10px",
                        }}
                        labelStyle={{
                          fontSize: "9px",
                          fontWeight: "900",
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          fontFamily: "sans-serif",
                        }}
                        itemStyle={{
                          fontSize: "10px",
                          fontWeight: "900",
                          padding: "2px 0",
                          fontFamily: "sans-serif",
                        }}
                        formatter={(value: any, name: string) => [
                          `R$ ${Number(value).toFixed(2)}`,
                          name === "total" ? "FATURAMENTO" : "LUCRO",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="total"
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="profit"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 2. Meios de Pagamento */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4 text-left">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 leading-none">
                  Meios de Pagamento
                </h4>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Receita distribuída por forma de pagamento
                </p>
              </div>

              {paymentMethodsBreakdown.length === 0 ? (
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Sem dados de pagamento
                  </p>
                </div>
              ) : (
                <div className="space-y-3 font-sans">
                  {paymentMethodsBreakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase">
                        <span className="text-slate-600 italic tracking-wide">
                          {item.name}
                        </span>
                        <span className="text-slate-800">
                          R$ {item.value.toFixed(2)} ({item.percent.toFixed(0)}
                          %)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Desempenho dos Sabores (Cocadas) */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 leading-none">
                    Desempenho dos Sabores
                  </h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Oscilações de faturamento e volumes por sabor de cocada
                  </p>
                </div>
                <div className="bg-amber-50 text-amber-600 px-2 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} /> Cocos
                </div>
              </div>

              {flavorAndIntelligenceData.flavorList.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    Sem cocadas vendidas no período
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 font-sans">
                  {flavorAndIntelligenceData.flavorList.map((item, idx) => {
                    const totalRevenue =
                      flavorAndIntelligenceData.currTotalRevenue || 1;
                    const percentOfTotal = (item.currRevenue / totalRevenue) * 100;
                    const hasPrevious = item.prevRevenue > 0 || item.prevQuantity > 0;

                    return (
                      <div
                        key={idx}
                        className="bg-slate-50/40 p-3.5 rounded-2xl border border-slate-100 space-y-2.5 transition-all hover:bg-slate-50/70"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm italic border border-amber-500/10">
                              {item.flavor.charAt(0)}
                            </div>
                            <div className="text-left">
                              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide block">
                                {item.flavor}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">
                                {item.currQuantity} unidades • Ticket Médio R${" "}
                                {(item.currQuantity > 0
                                  ? item.currRevenue / item.currQuantity
                                  : 0
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-black text-slate-800 block">
                              R$ {item.currRevenue.toFixed(2)}
                            </span>

                            {/* Fluctuations */}
                            <div className="mt-1 flex items-center justify-end gap-1.5">
                              {item.revChange > 0 ? (
                                <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-lg text-[8px] font-black leading-none">
                                  + {item.revChange.toFixed(0)}%{" "}
                                  <TrendingUp size={8} />
                                </span>
                              ) : item.revChange < 0 ? (
                                <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-lg text-[8px] font-black leading-none">
                                  {item.revChange.toFixed(0)}%{" "}
                                  <TrendingUp
                                    size={8}
                                    className="transform rotate-180"
                                  />
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-lg text-[8px] font-bold leading-none">
                                  0% ○
                                </span>
                              )}

                              {/* Flag for new flavor in comparison to previous */}
                              {!hasPrevious &&
                                flavorAndIntelligenceData.prevTotalRevenue > 0 && (
                                  <span className="bg-sky-50 text-sky-600 px-1 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider ml-1.5">
                                    Novo
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar representing share of faturamento */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            <span>Percentual das vendas</span>
                            <span>{percentOfTotal.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                              style={{ width: `${percentOfTotal}%` }}
                            />
                          </div>
                        </div>

                        {/* Extra indicators including profit margin */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100/60 font-sans text-left">
                          <div>
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                              Faturamento
                            </span>
                            <span className="text-[9px] font-black text-slate-700 block mt-0.5">
                              R$ {item.currRevenue.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                              Lucro Estimado
                            </span>
                            <span className="text-[9px] font-black text-emerald-600 block mt-0.5">
                              R$ {item.currProfit.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                              Margem Ativa
                            </span>
                            <span className="text-[9px] font-black text-purple-600 block mt-0.5">
                              {item.margin.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. IA BI Inteligência e Ações para Crescimento */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4 text-left">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 leading-none">
                  Inteligência Comercial & Ações
                </h4>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Diagnóstico sobre aumentos, quedas e orientações de tração
                </p>
              </div>

              {/* Comparator card header */}
              {flavorAndIntelligenceData.prevTotalRevenue > 0 ? (
                <div className="grid grid-cols-3 gap-2 bg-slate-900 text-white p-3.5 rounded-2xl font-sans">
                  <div>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                      Faturamento
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-black">
                        R$ {flavorAndIntelligenceData.currTotalRevenue.toFixed(0)}
                      </span>
                      {flavorAndIntelligenceData.revChangePercent >= 0 ? (
                        <span className="text-emerald-400 text-[8px] font-black">
                          ↑ (+{flavorAndIntelligenceData.revChangePercent.toFixed(0)}%)
                        </span>
                      ) : (
                        <span className="text-rose-400 text-[8px] font-black">
                          ↓ ({flavorAndIntelligenceData.revChangePercent.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                      Lucro Líquido
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-black text-emerald-400">
                        R$ {flavorAndIntelligenceData.currTotalProfit.toFixed(0)}
                      </span>
                      {flavorAndIntelligenceData.profitChangePercent >= 0 ? (
                        <span className="text-emerald-400 text-[8px] font-black">
                          ↑ (+{flavorAndIntelligenceData.profitChangePercent.toFixed(0)}%)
                        </span>
                      ) : (
                        <span className="text-rose-400 text-[8px] font-black">
                          ↓ ({flavorAndIntelligenceData.profitChangePercent.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                      Clientes Ativos
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-black text-sky-400">
                        {flavorAndIntelligenceData.currClientCount}
                      </span>
                      {flavorAndIntelligenceData.clientChangePercent >= 0 ? (
                        <span className="text-emerald-400 text-[8px] font-black">
                          ↑ (+{flavorAndIntelligenceData.clientChangePercent.toFixed(0)}%)
                        </span>
                      ) : (
                        <span className="text-rose-400 text-[8px] font-black">
                          ↓ ({flavorAndIntelligenceData.clientChangePercent.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-dashed border-slate-100 flex items-center gap-2">
                  <Info size={14} className="text-slate-400 shrink-0" />
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-normal">
                    Registre vendas no período anterior para habilitar análises de
                    oscilação completas!
                  </p>
                </div>
              )}

              {/* Recommendations list */}
              <div className="space-y-3 font-sans">
                {flavorAndIntelligenceData.insights.map((insight, idx) => {
                  const isPositive = insight.type === "positive";
                  const isNegative = insight.type === "negative";

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all duration-300 ${
                        isPositive
                          ? "bg-emerald-50/15 border-emerald-100"
                          : isNegative
                            ? "bg-rose-50/15 border-rose-100"
                            : "bg-blue-50/15 border-blue-100"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border ${
                            isPositive
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : isNegative
                                ? "bg-rose-50 text-rose-600 border-rose-100"
                                : "bg-blue-50 text-blue-600 border-blue-100"
                          }`}
                        >
                          {isPositive ? (
                            <CheckCircle size={14} />
                          ) : isNegative ? (
                            <AlertCircle size={14} />
                          ) : (
                            <Info size={14} />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <h5 className="text-[10px] font-black uppercase tracking-wide text-slate-800 leading-tight">
                            {insight.title}
                          </h5>
                          <p className="text-[9px] font-medium text-slate-500 leading-relaxed mt-0.5">
                            {insight.desc}
                          </p>
                        </div>
                      </div>

                      {/* Guidance (Ações para Crescimento) */}
                      <div className="pl-9 pt-2 border-t border-slate-100 flex gap-2 text-left">
                        <div className="p-1 rounded-md bg-amber-50 shrink-0 h-fit text-amber-600">
                          <Plus size={10} className="stroke-[3]" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <span className="text-[7.5px] font-black uppercase text-amber-600 tracking-widest block mb-0.5">
                            Ações Recomendadas
                          </span>
                          <p className="text-[9px] font-bold text-slate-700 leading-relaxed">
                            {insight.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {(currentScreen === "CLIENT_REPORT" ||
        currentScreen === "PRODUCT_REPORT" ||
        currentScreen === "PENDING_REPORT") && (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <div className="bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] text-white shadow-xl border-b-4 border-yellow-400 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
            <div className="flex items-center justify-between px-6 pt-6 pb-2 relative z-10">
              <button
                onClick={() => setCurrentScreen("REPORTS")}
                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-2xl active:scale-90 transition-all border border-white/5"
              >
                <ArrowLeft size={20} className="stroke-[2.5]" />
              </button>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-center flex-1">
                {currentScreen === "CLIENT_REPORT"
                  ? "Ranking Clientes"
                  : currentScreen === "PRODUCT_REPORT"
                    ? "Ranking Produtos"
                    : "Contas a Receber"}
              </h3>
              <button
                onClick={() => {
                  const data =
                    currentScreen === "CLIENT_REPORT"
                      ? clientRanking
                      : currentScreen === "PRODUCT_REPORT"
                        ? productRanking
                        : [...clientRanking]
                            .filter((c) => c.totalPendingAmount > 0)
                            .sort(
                              (a, b) =>
                                b.totalPendingAmount - a.totalPendingAmount,
                            );
                  const title =
                    currentScreen === "CLIENT_REPORT"
                      ? "RANKING DE CLIENTES"
                      : currentScreen === "PRODUCT_REPORT"
                        ? "RANKING DE PRODUTOS"
                        : "RELATÓRIO DE PENDÊNCIAS";

                  const totalAmount = data.reduce(
                    (acc, curr) =>
                      acc +
                      (currentScreen === "PENDING_REPORT"
                        ? curr.totalPendingAmount
                        : curr.totalSold),
                    0,
                  );
                  const totalProfit = data.reduce(
                    (acc, curr) => acc + (curr.totalProfit || 0),
                    0,
                  );
                  const totalPotes =
                    currentScreen === "CLIENT_REPORT"
                      ? data.reduce(
                          (acc, curr) => acc + (curr.totalPotes || 0),
                          0,
                        )
                      : 0;
                  const totalSalesCountSum = data.reduce(
                    (acc, curr) => acc + curr.salesCount,
                    0,
                  );
                  const totalItems = data.length;

                  const printContent = `
                      <html>
                        <head>
                          <title>${title}</title>
                          <style>
                            body { font-family: sans-serif; padding: 40px; color: #334155; }
                            h1 { font-style: italic; font-weight: 900; text-transform: uppercase; border-bottom: 4px solid #0ea5e9; padding-bottom: 10px; margin-bottom: 5px; }
                            .date-header { font-size: 14px; font-weight: bold; color: #64748b; margin-bottom: 20px; }
                            .summary-box { background: #f0f9ff; border: 2px solid #bae6fd; padding: 15px; border-radius: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; }
                            .summary-item { display: flex; flex-direction: column; }
                            .summary-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #0369a1; }
                            .summary-value { font-size: 20px; font-weight: 900; color: #0c4a6e; }
                            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                            th, td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
                            th { background: #f8fafc; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; font-weight: 950; }
                            tfoot tr { font-weight: 900; background: #f8fafc; border-top: 2px solid #cbd5e1; }
                            tfoot td { padding: 14px 12px; font-size: 12px; color: #1e293b; }

                            /* Alignments */
                            .col-rank { text-align: left; width: 40px; font-weight: 900; color: #94a3b8; }
                            .col-name { text-align: left; font-weight: 800; text-transform: uppercase; }
                            .col-potes { text-align: right; width: 100px; }
                            .col-vendas { text-align: right; width: 100px; }
                            .col-total { text-align: right; width: 150px; font-weight: 700; color: #0ea5e9; }
                            .pending { color: #f43f5e; }
                            .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-transform: uppercase; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                          </style>
                        </head>
                        <body>
                          <h1>${title}</h1>
                          <div class="date-header">
                            ${
                              reportTab === "DIARIO"
                                ? currentDate.toLocaleDateString("pt-BR")
                                : reportTab === "MENSAL"
                                  ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                                  : reportTab === "ANUAL"
                                    ? currentDate.getFullYear()
                                    : "Todo o Período"
                            }
                          </div>

                          <div class="summary-box">
                            <div class="summary-item">
                              <span class="summary-label">Total Geral</span>
                              <span class="summary-value">R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div class="summary-item" style="text-align: center;">
                              <span class="summary-label">Lucro Total</span>
                              <span class="summary-value" style="color: #059669;">R$ ${totalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div class="summary-item" style="text-align: right;">
                              <span class="summary-label">${currentScreen === "CLIENT_REPORT" ? "Clientes" : currentScreen === "PRODUCT_REPORT" ? "Itens" : "Pendentes"}</span>
                              <span class="summary-value">${totalItems}</span>
                            </div>
                          </div>

                          <table>
                            <thead>
                              <tr>
                                <th class="col-rank">#</th>
                                <th class="col-name">Nome</th>
                                ${
                                  currentScreen === "PENDING_REPORT"
                                    ? '<th class="col-total">Dívida Total</th>'
                                    : currentScreen === "CLIENT_REPORT"
                                      ? '<th class="col-potes">Potes</th><th class="col-vendas">Vendas</th><th class="col-total">Total</th>'
                                      : '<th class="col-vendas">Vendas</th><th class="col-total">Total</th>'
                                }
                              </tr>
                            </thead>
                            <tbody>
                              ${data
                                .map(
                                  (item, i) => `
                                <tr>
                                  <td class="col-rank">${i + 1}</td>
                                  <td class="col-name">${item.name}</td>
                                  ${
                                    currentScreen === "PENDING_REPORT"
                                      ? `<td class="col-total pending">R$ ${item.totalPendingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>`
                                      : currentScreen === "CLIENT_REPORT"
                                        ? `<td class="col-potes font-bold" style="font-weight: 700;">${item.totalPotes || 0}</td><td class="col-vendas">${item.salesCount}</td><td class="col-total">R$ ${item.totalSold.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>`
                                        : `<td class="col-vendas">${item.salesCount}</td><td class="col-total">R$ ${item.totalSold.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>`
                                  }
                                </tr>
                              `,
                                )
                                .join("")}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td class="col-rank">-</td>
                                <td class="col-name">Total / Soma</td>
                                ${
                                  currentScreen === "PENDING_REPORT"
                                    ? `<td class="col-total pending" style="font-weight: 900;">R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>`
                                    : currentScreen === "CLIENT_REPORT"
                                      ? `<td class="col-potes" style="font-weight: 900; color: #0369a1;">${totalPotes}</td><td class="col-vendas" style="font-weight: 900; color: #475569;">${totalSalesCountSum}</td><td class="col-total" style="font-weight: 900;">R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>`
                                      : `<td class="col-vendas" style="font-weight: 900; color: #475569;">${totalSalesCountSum}</td><td class="col-total" style="font-weight: 900;">R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>`
                                }
                              </tr>
                            </tfoot>
                          </table>
                          <div class="footer">Gerado em ${new Date().toLocaleString("pt-BR")} via OmniVenda</div>
                        </body>
                      </html>
                    `;
                  const win = window.open("", "_blank");
                  if (win) {
                    win.document.write(printContent);
                    win.document.close();
                    setTimeout(() => win.print(), 500);
                  }
                }}
                className="bg-white/10 p-2.5 rounded-2xl active:scale-90 transition-all border border-white/5"
              >
                <Printer size={20} />
              </button>
            </div>
            <div className="px-6 pb-2.5 mt-1.5 relative z-10">
              <div className="flex justify-between items-center bg-sky-950/25 p-1 rounded-[1.2rem] border border-white/5">
                <button
                  onClick={() => setReportTab("DIARIO")}
                  className={`flex-1 py-1 sm:py-1 rounded-lg text-sm sm:text-base font-black uppercase tracking-tight transition-all ${reportTab === "DIARIO" ? "bg-white text-sky-800 shadow-md" : "text-sky-100/80 hover:text-white hover:bg-white/5"}`}
                >
                  Dia
                </button>
                <button
                  onClick={() => setReportTab("MENSAL")}
                  className={`flex-1 py-1 sm:py-1 rounded-lg text-sm sm:text-base font-black uppercase tracking-tight transition-all ${reportTab === "MENSAL" ? "bg-white text-sky-800 shadow-md" : "text-sky-100/80 hover:text-white hover:bg-white/5"}`}
                >
                  Mês
                </button>
                <button
                  onClick={() => setReportTab("ANUAL")}
                  className={`flex-1 py-1 sm:py-1 rounded-lg text-sm sm:text-base font-black uppercase tracking-tight transition-all ${reportTab === "ANUAL" ? "bg-white text-sky-800 shadow-md" : "text-sky-100/80 hover:text-white hover:bg-white/5"}`}
                >
                  Ano
                </button>
                <button
                  onClick={() => setReportTab("TOTAL")}
                  className={`flex-1 py-1 sm:py-1 rounded-lg text-sm sm:text-base font-black uppercase tracking-tight transition-all ${reportTab === "TOTAL" ? "bg-white text-sky-800 shadow-md" : "text-sky-100/80 hover:text-white hover:bg-white/5"}`}
                >
                  Tudo
                </button>
              </div>
            </div>
            <div className="bg-sky-950/20 backdrop-blur-sm border-t border-white/5 flex items-center justify-between px-8 py-2 relative z-10">
              <button
                onClick={() => changeDate(-1)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg active:scale-75 transition-all disabled:opacity-25"
                disabled={reportTab === "TOTAL"}
              >
                <ChevronLeft size={18} className="stroke-[2.5]" />
              </button>
              <span className="text-sm font-extrabold uppercase tracking-wide text-white drop-shadow-sm">
                {reportTab === "DIARIO"
                  ? currentDate.toLocaleDateString("pt-BR")
                  : reportTab === "MENSAL"
                    ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    : reportTab === "ANUAL"
                      ? currentDate.getFullYear()
                      : "Todo o Período"}
              </span>
              <button
                onClick={() => changeDate(1)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg active:scale-75 transition-all disabled:opacity-25"
                disabled={reportTab === "TOTAL"}
              >
                <ChevronRight size={20} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-24">
            {(currentScreen === "CLIENT_REPORT" ||
              currentScreen === "PRODUCT_REPORT") && (
              <div className="bg-blue-600 p-5 rounded-[2rem] shadow-lg border-b-4 border-blue-800 text-white flex flex-col gap-4 mb-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70 leading-none mb-1 text-blue-100">
                      Total no Ranking
                    </p>
                    <h3 className="text-xl font-black italic">
                      R${" "}
                      {(currentScreen === "CLIENT_REPORT"
                        ? clientRanking
                        : productRanking
                      )
                        .reduce((acc, curr) => acc + curr.totalSold, 0)
                        .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70 leading-none mb-1 text-blue-100">
                      {currentScreen === "CLIENT_REPORT" ? "Clientes" : "Itens"}
                    </p>
                    <h3 className="text-xl font-black italic">
                      {
                        (currentScreen === "CLIENT_REPORT"
                          ? clientRanking
                          : productRanking
                        ).length
                      }
                    </h3>
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 flex items-center justify-between border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">
                    Lucro Total do Ranking:
                  </p>
                  <p className="text-sm font-black italic">
                    R${" "}
                    {(currentScreen === "CLIENT_REPORT"
                      ? clientRanking
                      : productRanking
                    )
                      .reduce((acc, curr) => acc + (curr.totalProfit || 0), 0)
                      .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {currentScreen === "CLIENT_REPORT" && (
                  <div className="bg-white/10 rounded-2xl p-3 flex items-center justify-between border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">
                      Total de Potes:
                    </p>
                    <p className="text-sm font-black italic">
                      {clientRanking.reduce(
                        (acc, curr) => acc + (curr.totalPotes || 0),
                        0,
                      )}{" "}
                      Potes
                    </p>
                  </div>
                )}
              </div>
            )}

            {(currentScreen === "CLIENT_REPORT"
              ? clientRanking
              : currentScreen === "PRODUCT_REPORT"
                ? productRanking
                : [...clientRanking]
                    .filter((c) => c.totalPendingAmount > 0)
                    .sort((a, b) => b.totalPendingAmount - a.totalPendingAmount)
            ).length === 0 ? (
              <EmptyState message="Sem dados no período" icon={BarChart3} />
            ) : (
              <>
                {(currentScreen === "CLIENT_REPORT"
                  ? clientRanking
                  : currentScreen === "PRODUCT_REPORT"
                    ? productRanking
                    : [...clientRanking]
                        .filter((c) => c.totalPendingAmount > 0)
                        .sort(
                          (a, b) => b.totalPendingAmount - a.totalPendingAmount,
                        )
                ).map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      if (currentScreen !== "PRODUCT_REPORT") {
                        handleOpenClientReport(item.name, item.clientId);
                      }
                    }}
                    className={`bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between ${
                      currentScreen !== "PRODUCT_REPORT"
                        ? "cursor-pointer hover:bg-slate-50/75 active:scale-[0.98] transition-all hover:border-slate-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black italic text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-xs uppercase italic truncate max-w-[150px]">
                          {item.name}
                        </h4>
                        <p className="text-[8px] font-black text-slate-400 uppercase">
                          {item.salesCount} Vendas
                          {currentScreen === "CLIENT_REPORT"
                            ? ` • ${item.totalPotes || 0} Potes`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {currentScreen === "PENDING_REPORT" ? (
                        <p className="text-sm font-black text-red-500">
                          R$ {item.totalPendingAmount.toFixed(2)}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-black text-blue-600">
                            R$ {item.totalSold.toFixed(2)}
                          </p>
                          <p className="text-[7px] font-black text-green-500 uppercase tracking-widest">
                            Lucro: R$ {item.totalProfit.toFixed(2)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* Bottom Sum Box */}
                <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-lg border-b-4 border-slate-950 flex flex-col gap-3 mt-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Total / Soma das Colunas
                    </span>
                    <span className="text-[8px] font-black bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider text-slate-300">
                      Resumo
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-3">
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-400">
                        Total Potes
                      </p>
                      <p className="text-sm font-black text-[#38bdf8] mt-0.5">
                        {currentScreen === "CLIENT_REPORT"
                          ? clientRanking.reduce(
                              (acc, curr) => acc + (curr.totalPotes || 0),
                              0,
                            )
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-400">
                        Total Vendas
                      </p>
                      <p className="text-sm font-black text-slate-200 mt-0.5">
                        {(currentScreen === "CLIENT_REPORT"
                          ? clientRanking
                          : currentScreen === "PRODUCT_REPORT"
                            ? productRanking
                            : clientRanking
                        ).reduce((acc, curr) => acc + curr.salesCount, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-400">
                        Valor Total
                      </p>
                      <p className="text-sm font-black text-emerald-400 mt-0.5">
                        R${" "}
                        {(currentScreen === "CLIENT_REPORT"
                          ? clientRanking
                          : currentScreen === "PRODUCT_REPORT"
                            ? productRanking
                            : clientRanking
                        )
                          .reduce(
                            (acc, curr) =>
                              acc +
                              (currentScreen === "PENDING_REPORT"
                                ? curr.totalPendingAmount
                                : curr.totalSold),
                            0,
                          )
                          .toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={productModal.type !== ModalType.NONE}
        onClose={() => setProductModal({ type: ModalType.NONE })}
        onSave={handleSaveProduct}
        initialData={productModal.data}
      />
      <ClientForm
        isOpen={clientModal.type !== ModalType.NONE}
        onClose={() => setClientModal({ type: ModalType.NONE })}
        onSave={handleSaveClient}
        onDelete={handleDeleteClient}
        initialData={clientModal.data}
      />
      <NewSaleModal
        isOpen={saleModal}
        onClose={() => {
          setSaleModal(false);
          setEditingSale(null);
        }}
        products={products}
        clients={clients}
        onFinishSale={handleFinishSale}
        initialData={editingSale}
      />
      <SaleDetailModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
        profile={businessProfile}
        clients={clients}
        onEdit={handleOpenEditSale}
        onDelete={handleDeleteSale}
        onTogglePaid={handleTogglePaid}
      />

      <ClientReportModal
        isOpen={!!selectedClientReport}
        onClose={() => setSelectedClientReport(null)}
        client={selectedClientReport?.client || null}
        sales={selectedClientReport?.sales || []}
        profile={businessProfile}
        onTogglePaid={handleTogglePaid}
        onViewSale={(sale) => {
          setSelectedSale(sale);
        }}
      />

      {subscriptionModal.isOpen && subscriptionModal.business && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-800 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tighter">
                  Gerenciar Assinatura
                </h3>
                <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest">
                  {subscriptionModal.business.companyName}
                </p>
              </div>
              <button
                onClick={() =>
                  setSubscriptionModal({ isOpen: false, business: null })
                }
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    // Simula entrar na conta da empresa (Impersonation)
                    setImpersonatedUserId(subscriptionModal.business.id);
                    setIsImpersonating(true);
                    setSubscriptionModal({ isOpen: false, business: null });
                    setCurrentScreen("HOME");
                    triggerNotify(
                      `Acessando ${subscriptionModal.business.companyName}`,
                    );
                    fetchAllData();
                  }}
                  className="bg-blue-50 text-blue-600 p-3 rounded-2xl flex flex-col items-center gap-1 border border-blue-100 active:scale-95 transition-all"
                >
                  <ExternalLink size={20} />
                  <span className="text-[7px] font-black uppercase">
                    Acessar Conta
                  </span>
                </button>
                <button
                  onClick={() =>
                    handleSendNotification(subscriptionModal.business)
                  }
                  className="bg-green-50 text-green-600 p-3 rounded-2xl flex flex-col items-center gap-1 border border-green-100 active:scale-95 transition-all"
                >
                  <Smartphone size={20} />
                  <span className="text-[7px] font-black uppercase">
                    WhatsApp
                  </span>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() =>
                    handleDeleteBusiness(subscriptionModal.business.id)
                  }
                  className="bg-red-50 text-red-600 p-3 rounded-2xl flex items-center justify-center gap-2 border border-red-100 active:scale-95 transition-all"
                >
                  <Trash2 size={16} />
                  <span className="text-[7px] font-black uppercase">
                    Excluir Empresa Permanentemente
                  </span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                  Tipo de Plano
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["START", "PREMIUM", "ULTRA", "MASTER"].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        const updated = {
                          ...subscriptionModal.business,
                          planType: type,
                        };
                        db.profile.update(updated).then(() => {
                          setAllBusinessesStats((prev) =>
                            prev.map((b) =>
                              b.id === updated.id
                                ? { ...b, planType: type }
                                : b,
                            ),
                          );
                          setSubscriptionModal({
                            isOpen: true,
                            business: updated,
                          });
                          triggerNotify("Plano Alterado!");
                        });
                      }}
                      className={`py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 transition-all ${
                        subscriptionModal.business.planType === type
                          ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100"
                          : "bg-white text-slate-400 border-slate-100 hover:border-purple-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                  Status do Plano
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["ATIVO", "BLOQUEADO", "PENDENTE", "INATIVO"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          const date = (
                            document.getElementById(
                              "sub-date",
                            ) as HTMLInputElement
                          ).value;
                          handleUpdateSubscription(
                            subscriptionModal.business.id,
                            status,
                            date,
                          );
                        }}
                        className={`py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 transition-all ${
                          subscriptionModal.business.planStatus === status
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100"
                            : "bg-white text-slate-400 border-slate-100 hover:border-blue-200"
                        }`}
                      >
                        {status}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                  Próximo Vencimento
                </label>
                <input
                  type="date"
                  id="sub-date"
                  defaultValue={subscriptionModal.business.nextBilling}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    const status = subscriptionModal.business.planStatus;
                    const date = (
                      document.getElementById("sub-date") as HTMLInputElement
                    ).value;
                    handleUpdateSubscription(
                      subscriptionModal.business.id,
                      status,
                      date,
                    );
                  }}
                  className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all border-b-4 border-slate-950"
                >
                  Salvar Data de Vencimento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
        © {new Date().getFullYear()} JABASSO
      </footer>
    </div>

      {/* 2. MODAL DE PRÉ-VISUALIZAÇÃO & IMPRESSÃO NA TELA */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-[200] flex flex-col justify-between p-4 md:p-6 print:hidden overflow-hidden">
          <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl max-w-4xl w-full mx-auto flex flex-col flex-1 border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header do Painel de Impressão */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <h3 className="text-sm font-black uppercase italic tracking-wider">
                    Impressão de Resumo Executivo
                  </h3>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Design limpo, de fácil leitura e focado em aumento de faturamento
                </p>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="bg-white/15 hover:bg-white/20 p-2 rounded-2xl active:scale-90 transition-all font-sans"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Alerta de Dica de Impressão */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 text-left">
              <p className="text-[9px] font-black text-amber-750 uppercase tracking-wider leading-relaxed">
                👉 DICA DE REDIRECIONAMENTO: Se o diálogo do sistema de impressão do navegador não abrir de imediato, clique no botão de "Nova Aba" no canto superior direito do OmniVenda para abrir diretamente fora do simulador e realizar a impressão!
              </p>
            </div>

            {/* Folha A4 de Pré-visualização Scrollable */}
            <div className="p-4 md:p-8 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
              <div className="bg-white shadow-lg border border-slate-200 p-8 md:p-12 text-left rounded-3xl max-w-3xl w-full font-sans text-slate-800 space-y-8">
                {/* Cabeçalho do Relatório */}
                <div className="border-b-2 border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h1 className="font-sans font-black text-2xl uppercase tracking-tight text-slate-900 leading-none">
                      {businessProfile.companyName || "OmniVenda"}
                    </h1>
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                      Relatório de Gestão Inteligente de Vendas
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider">
                      Resumo Comercial Executivo
                    </p>
                    <p className="text-sm font-black text-slate-900 mt-1">
                      {dashboardPrintData.formattedPeriodStr}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Gerado em: {new Date().toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>

                {/* Grid de Indicadores Chave */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Faturamento */}
                  <div className="border-l-4 border-sky-500 bg-slate-50/50 p-4 rounded-xl space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Faturamento Geral</span>
                    <span className="text-base font-black text-slate-900 block leading-none">
                      R$ {flavorAndIntelligenceData.currTotalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[9.5px] font-black block ${flavorAndIntelligenceData.revChangePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {flavorAndIntelligenceData.revChangePercent >= 0 ? "▲" : "▼"} {flavorAndIntelligenceData.revChangePercent >= 0 ? "+" : ""}{flavorAndIntelligenceData.revChangePercent.toFixed(0)}%
                    </span>
                  </div>

                  {/* Lucro */}
                  <div className="border-l-4 border-emerald-500 bg-slate-50/50 p-4 rounded-xl space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Lucro Estimado</span>
                    <span className="text-base font-black text-slate-900 block leading-none">
                      R$ {flavorAndIntelligenceData.currTotalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[9.5px] font-black block ${flavorAndIntelligenceData.profitChangePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {flavorAndIntelligenceData.profitChangePercent >= 0 ? "▲" : "▼"} {flavorAndIntelligenceData.profitChangePercent >= 0 ? "+" : ""}{flavorAndIntelligenceData.profitChangePercent.toFixed(0)}%
                    </span>
                  </div>

                  {/* Margem */}
                  <div className="border-l-4 border-purple-500 bg-slate-50/50 p-4 rounded-xl space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Margem Geral</span>
                    <span className="text-base font-black text-slate-900 block leading-none">
                      {dashboardPrintData.currentMarginVal.toFixed(1)}%
                    </span>
                    <span className={`text-[9.5px] font-black block ${dashboardPrintData.marginChangeVal >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {dashboardPrintData.marginChangeVal >= 0 ? "▲" : "▼"} {dashboardPrintData.marginChangeVal >= 0 ? "+" : ""}{dashboardPrintData.marginChangeVal.toFixed(1)}%
                    </span>
                  </div>

                  {/* Clientes */}
                  <div className="border-l-4 border-amber-500 bg-slate-50/50 p-4 rounded-xl space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Atendimentos</span>
                    <span className="text-base font-black text-slate-900 block leading-none">
                      {flavorAndIntelligenceData.currClientCount}
                    </span>
                    <span className={`text-[9.5px] font-black block ${flavorAndIntelligenceData.clientChangePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {flavorAndIntelligenceData.clientChangePercent >= 0 ? "▲" : "▼"} {flavorAndIntelligenceData.clientChangePercent >= 0 ? "+" : ""}{flavorAndIntelligenceData.clientChangePercent.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Gráfico de Oscilação de Sabores */}
                <div>
                  <h3 className="text-[10px] font-black text-slate-950 uppercase tracking-wider border-b-2 border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
                    <span>📊</span> Gráfico de Oscilação &amp; Desempenho de Sabores (% Crescimento)
                  </h3>
                  {flavorAndIntelligenceData.flavorList.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400 font-bold uppercase tracking-widest">
                      Nenhum dado disponível para exibir oscilações.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4 shadow-sm mb-6">
                      <div className="flex justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                        <span>📉 Desaceleração de Vendas</span>
                        <span className="w-0.5 bg-slate-200 h-2.5" />
                        <span>📈 Aceleração de Vendas</span>
                      </div>
                      
                      <div className="space-y-4">
                        {flavorAndIntelligenceData.flavorList.map((item, idx) => {
                          const isPositive = item.revChange > 0;
                          const isNegative = item.revChange < 0;
                          const changeAbs = Math.min(Math.abs(item.revChange), 100);
                          const percentOfTotal = (item.currRevenue / (flavorAndIntelligenceData.currTotalRevenue || 1)) * 100;
                          
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs font-bold">
                                <span className="font-extrabold text-slate-800">{item.flavor}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-slate-450 font-semibold">{item.currQuantity} uds (${percentOfTotal.toFixed(1)}% share)</span>
                                  <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-slate-400"}`}>
                                    {isPositive ? "▲" : isNegative ? "▼" : "•"} {isPositive ? "+" : ""}{item.revChange.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              
                              <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                {isNegative ? (
                                  <div className="w-1/2 flex justify-end bg-slate-100">
                                    <div 
                                      className="bg-gradient-to-l from-rose-450 to-rose-600 h-full rounded-l-full transition-all duration-550 ease-out"
                                      style={{ width: `${changeAbs}%` }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-1/2 bg-slate-100" />
                                )}
                                
                                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 z-10" />
                                
                                {isPositive ? (
                                  <div className="w-1/2 flex justify-start bg-slate-100">
                                    <div 
                                      className="bg-gradient-to-r from-emerald-450 to-emerald-600 h-full rounded-r-full transition-all duration-550 ease-out" 
                                      style={{ width: `${changeAbs}%` }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-1/2 bg-slate-100" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider text-center pt-2">
                        * O gráfico representa a oscilação percentual das vendas de cada sabor comparada ao período anterior (eixo central = 0%).
                      </p>
                    </div>
                  )}
                </div>

                {/* Desempenho dos Sabores */}
                <div>
                  <h3 className="text-[10px] font-black text-slate-950 uppercase tracking-wider border-b-2 border-slate-100 pb-2 mb-4">
                    Desempenho por Sabor (Oscilações &amp; Faturamento)
                  </h3>
                  {flavorAndIntelligenceData.flavorList.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400 font-bold uppercase tracking-widest">
                      Nenhuma cocada cadastrada / vendida.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold">
                            <th className="py-2.5 px-3 font-semibold text-[9px] uppercase tracking-wider">Sabor</th>
                            <th className="py-2.5 px-3 font-semibold text-[9px] uppercase tracking-wider text-right">Volume</th>
                            <th className="py-2.5 px-3 font-semibold text-[9px] uppercase tracking-wider text-right">Faturamento</th>
                            <th className="py-2.5 px-3 font-semibold text-[9px] uppercase tracking-wider text-right">Est. Lucro</th>
                            <th className="py-2.5 px-3 font-semibold text-[9px] uppercase tracking-wider text-right">Margem %</th>
                            <th className="py-2.5 px-3 font-semibold text-[9px] uppercase tracking-wider text-right">Share %</th>
                            <th className="py-2.5 px-3 font-semibold text-[9px] uppercase tracking-wider text-center">Filtro Período</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {flavorAndIntelligenceData.flavorList.map((item, idx) => {
                            const percentOfTotal = (item.currRevenue / (flavorAndIntelligenceData.currTotalRevenue || 1)) * 100;
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-2 px-3 font-black text-slate-900">{item.flavor}</td>
                                <td className="py-2 px-3 text-right font-medium">{item.currQuantity} ud</td>
                                <td className="py-2 px-3 text-right font-semibold">R$ {item.currRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                <td className="py-2 px-3 text-right text-emerald-600 font-bold">R$ {item.currProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                <td className="py-2 px-3 text-right font-medium">{item.margin.toFixed(0)}%</td>
                                <td className="py-2 px-3 text-right font-bold text-slate-400">{percentOfTotal.toFixed(1)}%</td>
                                <td className="py-2 px-3 text-center">
                                  {item.revChange > 0 ? (
                                    <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black bg-green-50 text-green-700">+{item.revChange.toFixed(0)}% ▲</span>
                                  ) : item.revChange < 0 ? (
                                    <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black bg-red-50 text-red-700">{item.revChange.toFixed(0)}% ▼</span>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black bg-slate-50 text-slate-500">0% •</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Plano de Ação Personalizado para Aumento das Vendas */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-950 uppercase tracking-wider border-b-2 border-slate-100 pb-2">
                    Ações Inteligentes Necessárias para Alavancar Vendas
                  </h3>
                  
                  {flavorAndIntelligenceData.insights.length === 0 ? (
                    <div className="p-6 bg-slate-50 border border-slate-150 border-dashed rounded-2xl text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Nenhuma ação comercial cadastrada ou recomendada neste ciclo.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {flavorAndIntelligenceData.insights.map((id, index) => {
                        const isPositive = id.type === "positive";
                        const isNegative = id.type === "negative";
                        return (
                          <div
                            key={index}
                            className={`p-5 rounded-2xl border text-slate-700 flex flex-col text-left ${
                              isPositive
                                ? "bg-emerald-50/35 border-emerald-100 border-l-4 border-l-emerald-500"
                                : isNegative
                                  ? "bg-rose-50/35 border-rose-100 border-l-4 border-l-rose-500"
                                  : "bg-blue-50/35 border-blue-100 border-l-4 border-l-blue-500"
                            }`}
                          >
                            <h4 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wide leading-none">
                              {id.title}
                            </h4>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5 pl-1">
                              {id.desc}
                            </p>
                            
                            {/* Bloco de Ação Comercial - Destacado e Prático */}
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 mt-3 text-amber-900">
                              <span className="text-[8px] font-black uppercase tracking-wider text-amber-700 block mb-0.5">
                                👉 Plano Dinâmico de Vendas (Implementar Imediatamente)
                              </span>
                              <span className="text-[11px] font-black leading-tight block">
                                {id.action}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer do PDF */}
                <div className="border-t border-slate-100 pt-5 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Relatório Emitido pelo Painel de Inteligência Comercial OmniVenda. Todos os direitos reservados.
                  </p>
                </div>
              </div>
            </div>

            {/* Rodapé de Controles e Exportação */}
            <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center gap-3 justify-end shrink-0">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="w-full sm:w-auto px-5 py-3 border border-slate-100 hover:bg-slate-50 rounded-2xl text-slate-500 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all text-center"
              >
                Voltar ao Dashboard
              </button>
              
              <button
                onClick={handleCopyReportText}
                className="w-full sm:w-auto px-5 py-3 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ClipboardList size={14} /> Copiar Resumo (WhatsApp)
              </button>

              <button
                onClick={handleTriggerSystemPrint}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border-b-2 border-amber-700"
              >
                <Printer size={14} /> Imprimir / Salvar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. RESUMO EXECUTIVO EXCLUSIVO PARA IMPRESSORA/PDF (Aparece somente ao apertar Ctrl+P ou clicar em Imprimir) */}
      <div className="hidden print:block bg-white text-slate-900 p-12 font-sans w-full max-w-4xl mx-auto space-y-10 text-left">
        {/* Cabeçalho do Relatório Impresso */}
        <div className="border-b-4 border-slate-900 pb-5 flex justify-between items-end">
          <div>
            <h1 className="font-sans font-black text-3xl uppercase tracking-tight text-slate-950 leading-none">
              {businessProfile.companyName || "OmniVenda"}
            </h1>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-1.5">
              PAINEL DE GESTÃO E INTELIGÊNCIA DE VENDAS
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
              RESUMO COMERCIAL EXECUTIVO
            </h2>
            <p className="text-base font-black text-slate-950 mt-1">
              {dashboardPrintData.formattedPeriodStr}
            </p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Gerado em: {new Date().toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Grid de Indicadores no Papel */}
        <div className="grid grid-cols-4 gap-6">
          {/* Faturamento */}
          <div className="border-l-4 border-slate-950 bg-slate-50 p-4 rounded-xl space-y-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Faturamento Geral</span>
            <span className="text-lg font-black text-slate-950 block leading-none">
              R$ {flavorAndIntelligenceData.currTotalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9.5px] font-extrabold text-slate-950 block">
              {flavorAndIntelligenceData.revChangePercent >= 0 ? "▲" : "▼"} {flavorAndIntelligenceData.revChangePercent >= 0 ? "+" : ""}{flavorAndIntelligenceData.revChangePercent.toFixed(0)}% vs período ant.
            </span>
          </div>

          {/* Lucro */}
          <div className="border-l-4 border-slate-950 bg-slate-50 p-4 rounded-xl space-y-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Lucro Estimado</span>
            <span className="text-lg font-black text-slate-950 block leading-none">
              R$ {flavorAndIntelligenceData.currTotalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9.5px] font-extrabold text-slate-950 block">
              {flavorAndIntelligenceData.profitChangePercent >= 0 ? "▲" : "▼"} {flavorAndIntelligenceData.profitChangePercent >= 0 ? "+" : ""}{flavorAndIntelligenceData.profitChangePercent.toFixed(0)}% vs período ant.
            </span>
          </div>

          {/* Margem */}
          <div className="border-l-4 border-slate-950 bg-slate-50 p-4 rounded-xl space-y-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Margem Média</span>
            <span className="text-lg font-black text-slate-950 block leading-none">
              {dashboardPrintData.currentMarginVal.toFixed(1)}%
            </span>
            <span className="text-[9.5px] font-extrabold text-slate-950 block">
              {dashboardPrintData.marginChangeVal >= 0 ? "▲" : "▼"} {dashboardPrintData.marginChangeVal >= 0 ? "+" : ""}{dashboardPrintData.marginChangeVal.toFixed(1)}% vs período ant.
            </span>
          </div>

          {/* Clientes */}
          <div className="border-l-4 border-slate-950 bg-slate-50 p-4 rounded-xl space-y-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Atendimentos</span>
            <span className="text-lg font-black text-slate-950 block leading-none">
              {flavorAndIntelligenceData.currClientCount}
            </span>
            <span className="text-[9.5px] font-extrabold text-slate-950 block">
              {flavorAndIntelligenceData.clientChangePercent >= 0 ? "▲" : "▼"} {flavorAndIntelligenceData.clientChangePercent >= 0 ? "+" : ""}{flavorAndIntelligenceData.clientChangePercent.toFixed(0)}% vs período ant.
            </span>
          </div>
        </div>

        {/* Gráfico de Oscilação de Sabores para Impressão Nativa */}
        <div className="page-break-inside-avoid">
          <h3 className="text-xs font-black text-slate-955 uppercase tracking-wider border-b-2 border-slate-900 pb-2 mb-4 flex items-center gap-1.5">
            <span>📊</span> Gráfico de Oscilação &amp; Desempenho de Sabores (% Crescimento)
          </h3>
          {flavorAndIntelligenceData.flavorList.length === 0 ? (
            <p className="text-slate-400 font-bold uppercase text-xs py-4 text-center">Nenhum dado disponível.</p>
          ) : (
            <div className="border border-slate-350 rounded-xl p-5 bg-slate-50 space-y-4 mb-6">
              <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <span>📉 Desaceleração de Vendas</span>
                <span className="w-0.5 bg-slate-400 h-2.5" />
                <span>📈 Aceleração de Vendas</span>
              </div>
              
              <div className="space-y-4">
                {flavorAndIntelligenceData.flavorList.map((item, idx) => {
                  const isPositive = item.revChange > 0;
                  const isNegative = item.revChange < 0;
                  const changeAbs = Math.min(Math.abs(item.revChange), 100);
                  const percentOfTotal = (item.currRevenue / (flavorAndIntelligenceData.currTotalRevenue || 1)) * 100;
                  
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                        <span className="font-extrabold">{item.flavor}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 font-semibold">{item.currQuantity} uds (${percentOfTotal.toFixed(1)}% share)</span>
                          <span className={`text-[10px] font-black flex items-center gap-0.5 ${isPositive ? "text-emerald-700" : isNegative ? "text-rose-700" : "text-slate-500"}`}>
                            {isPositive ? "▲" : isNegative ? "▼" : "•"} {isPositive ? "+" : ""}{item.revChange.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="relative h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        {isNegative ? (
                          <div className="w-1/2 flex justify-end bg-slate-200">
                            <div 
                              className="bg-red-500 h-full rounded-l-full transition-all duration-500 ease-out"
                              style={{ width: `${changeAbs}%` }}
                            />
                          </div>
                        ) : (
                          <div className="w-1/2 bg-slate-200" />
                        )}
                        
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 z-10" />
                        
                        {isPositive ? (
                          <div className="w-1/2 flex justify-start bg-slate-200">
                            <div 
                              className="bg-green-600 h-full rounded-r-full transition-all duration-500 ease-out" 
                              style={{ width: `${changeAbs}%` }}
                            />
                          </div>
                        ) : (
                          <div className="w-1/2 bg-slate-200" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider text-center pt-2">
                * O gráfico representa a oscilação percentual das vendas de cada sabor comparada ao período anterior (eixo central = 0%).
              </p>
            </div>
          )}
        </div>

        {/* Performance dos Sabores */}
        <div>
          <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider border-b-2 border-slate-900 pb-2 mb-4">
            Desempenho por Sabor (Oscilações &amp; Faturamento)
          </h3>
          {flavorAndIntelligenceData.flavorList.length === 0 ? (
            <p className="text-slate-400 font-bold uppercase text-xs py-4 text-center">Nenhum produto registrado no período.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 text-slate-750 font-bold">
                  <th className="py-2 px-3 font-bold text-[9px] uppercase tracking-wider">Sabor de Cocada</th>
                  <th className="py-2 px-3 font-bold text-[9px] uppercase tracking-wider text-right">Volume</th>
                  <th className="py-2 px-3 font-bold text-[9px] uppercase tracking-wider text-right">Faturamento</th>
                  <th className="py-2 px-3 font-bold text-[9px] uppercase tracking-wider text-right">Est. Lucro</th>
                  <th className="py-2 px-3 font-bold text-[9px] uppercase tracking-wider text-right">Margem %</th>
                  <th className="py-2 px-3 font-bold text-[9px] uppercase tracking-wider text-right">Share %</th>
                  <th className="py-2 px-3 font-bold text-[9px] uppercase tracking-wider text-center">Filtro Período</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-800">
                {flavorAndIntelligenceData.flavorList.map((item, idx) => {
                  const percentOfTotal = (item.currRevenue / (flavorAndIntelligenceData.currTotalRevenue || 1)) * 100;
                  return (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-black text-slate-955">{item.flavor}</td>
                      <td className="py-2 px-3 text-right font-semibold">{item.currQuantity} unidades</td>
                      <td className="py-2 px-3 text-right font-extrabold">R$ {item.currRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-extrabold text-slate-950">R$ {item.currProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-black">{item.margin.toFixed(0)}%</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-500">{percentOfTotal.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-center">
                        {item.revChange > 0 ? (
                          <span className="font-extrabold text-slate-950">+{item.revChange.toFixed(0)}% ▲</span>
                        ) : item.revChange < 0 ? (
                          <span className="font-extrabold text-slate-950">{item.revChange.toFixed(0)}% ▼</span>
                        ) : (
                          <span className="font-bold text-slate-500">0% •</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Plano de Ação Personalizado para Aumento das Vendas */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider border-b-2 border-slate-900 pb-2">
            Ações Inteligentes Necessárias para Alavancar Vendas
          </h3>
          
          {flavorAndIntelligenceData.insights.length === 0 ? (
            <p className="text-slate-400 font-bold uppercase text-xs py-4 text-center">Nenhuma ação necessária registrada.</p>
          ) : (
            <div className="space-y-4">
              {flavorAndIntelligenceData.insights.map((id, index) => {
                const isPositive = id.type === "positive";
                const isNegative = id.type === "negative";
                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-slate-300 text-slate-800 flex flex-col text-left page-break-inside-avoid"
                  >
                    <h4 className="text-[11px] font-black text-slate-950 uppercase tracking-widest leading-none">
                      {index + 1}. {id.title}
                    </h4>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mt-2 pl-1">
                      <strong>Diagnóstico:</strong> {id.desc}
                    </p>
                    
                    {/* Bloco de Ação Impresso */}
                    <div className="bg-slate-50 border border-slate-400 rounded-lg p-3 mt-2">
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-600 block">
                        Ação Comercial Recomendada para Alavancar Vendas:
                      </span>
                      <span className="text-[11px] font-extrabold leading-tight block mt-0.5 text-slate-900">
                        {id.action}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé impresso */}
        <div className="border-t border-slate-300 pt-5 text-center mt-12">
          <p className="text-[8px] font-black text-slate-404 uppercase tracking-widest">
            Relatório de Performance Comercial • Sistema de Gestão OmniVenda
          </p>
        </div>
      </div>
    </>
  );
};

export default App;
