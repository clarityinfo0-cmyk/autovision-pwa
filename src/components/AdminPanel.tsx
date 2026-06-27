import React, { useState, useEffect } from "react";
import { 
  auth, 
} from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  subscribeAppointments, 
  subscribeCustomAccessoryRequests, 
  subscribeGallery, 
  getServices, 
  updateAppointmentField, 
  updateCustomAccessoryRequestField, 
  addGalleryItem, 
  deleteGalleryItem, 
  upsertService, 
  deleteService, 
  getBankSettings, 
  updateBankSettings 
} from "../firebaseUtils";
import { Appointment, CustomAccessoryRequest, GalleryItem, Service, BankSettings } from "../types";
import ImageUploader from "./ImageUploader";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Receipt, 
  Image as ImageIcon, 
  Wrench, 
  Settings, 
  Check, 
  X, 
  Clock, 
  Play, 
  CheckCircle, 
  Smartphone, 
  MapPin, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Eye,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Search
} from "lucide-react";

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Firestore collections state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomAccessoryRequest[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bankSettings, setBankSettings] = useState<BankSettings>({
    bankName: "BBVA México",
    accountHolder: "Autovisión Premium S.A.",
    clabe: "0121 8000 1234 5678 90",
    accountNumber: "1234 5678 90"
  });

  // Navigation tab
  const [adminTab, setAdminTab] = useState<"dashboard" | "appointments" | "requests" | "gallery" | "services" | "bank" | "transactions">("dashboard");

  // Search/Filters in Admin
  const [apptSearch, setApptSearch] = useState("");
  const [apptStatusFilter, setApptStatusFilter] = useState("all");

  // Stripe Transactions Tab Specific Filters
  const [stripeFilterStatus, setStripeFilterStatus] = useState<"all" | "paid" | "pending">("paid");
  const [stripeDateFilter, setStripeDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [stripeSearch, setStripeSearch] = useState("");

  // Forms states
  const [newGallery, setNewGallery] = useState({
    title: "",
    category: "Polarizado 3M",
    description: "",
    imageUrlBefore: "",
    imageUrlAfter: ""
  });
  
  const [newService, setNewService] = useState<Omit<Service, "active">>({
    id: "",
    name: "",
    description: "",
    category: "Polarizado 3M",
    priceFrom: 1000,
    duration: "2 horas",
    image: ""
  });

  // Temp state for quoting custom accessory request
  const [quotingRequestId, setQuotingRequestId] = useState<string | null>(null);
  const [quotedPriceInput, setQuotedPriceInput] = useState<number>(0);

  // Auth subscriber
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Subscribe to real-time firestore data when logged in as admin or technician
  const isTechnician = user?.uid === "HHIdRIm7BPh2TTwum7hefVwoY4Z2";

  useEffect(() => {
    if (!user) return;
    const isOwner = user.uid === "Deo4NaEV22cKLCIyexpK8u9UhTX2";
    const isTech = user.uid === "HHIdRIm7BPh2TTwum7hefVwoY4Z2";
    if (!isOwner && !isTech) return;

    const unsubAppts = subscribeAppointments(setAppointments);
    const unsubRequests = subscribeCustomAccessoryRequests(setCustomRequests);
    const unsubGallery = subscribeGallery(setGallery);
    
    getServices().then(setServices);
    getBankSettings().then(setBankSettings);

    return () => {
      unsubAppts();
      unsubRequests();
      unsubGallery();
    };
  }, [user]);

  // Auth Actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        setAuthError("Usuario no encontrado. Registra tu cuenta primero.");
      } else if (err.code === "auth/wrong-password") {
        setAuthError("Contraseña incorrecta.");
      } else {
        setAuthError("Error: " + err.message);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setIsSignUp(false);
    } catch (err: any) {
      console.error(err);
      setAuthError("Error al registrar: " + err.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  // Dashboard Stats calculation
  const stats = React.useMemo(() => {
    const pending = appointments.filter(a => a.status === "pending").length;
    const confirmed = appointments.filter(a => a.status === "confirmed").length;
    const process = appointments.filter(a => a.status === "processing").length;
    const completed = appointments.filter(a => a.status === "completed");
    
    const earnings = completed.reduce((sum, a) => sum + (a.total || 0), 0);
    const commissions = earnings * 0.15; // Autovisión's 15% commission

    // Most requested services
    const serviceCounts: { [name: string]: number } = {};
    appointments.forEach((a) => {
      serviceCounts[a.serviceName] = (serviceCounts[a.serviceName] || 0) + 1;
    });
    const popularServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      pending,
      confirmed,
      process,
      completedCount: completed.length,
      earnings,
      commissions,
      popularServices
    };
  }, [appointments]);

  // Handle appointment status workflow
  const changeApptStatus = async (id: string, newStatus: Appointment["status"]) => {
    try {
      const updateData: Partial<Appointment> = { status: newStatus };
      if (newStatus === "completed") {
        updateData.paymentStatus = "paid";
      }
      await updateAppointmentField(id, updateData);
    } catch (err) {
      console.error("Error updating appointment:", err);
    }
  };

  const changePaymentStatus = async (id: string, newPayStatus: Appointment["paymentStatus"]) => {
    try {
      await updateAppointmentField(id, { paymentStatus: newPayStatus });
    } catch (err) {
      console.error("Error updating payment status:", err);
    }
  };

  // Google Maps external link helper
  const getGoogleMapsLink = (appt: Appointment) => {
    if (appt.location?.lat && appt.location?.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${appt.location.lat},${appt.location.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.addressText)}`;
  };

  // WhatsApp manual contact helper
  const getWhatsAppApptLink = (appt: Appointment) => {
    const cleanPhone = appt.phone.replace(/\D/g, "");
    const text = encodeURIComponent(
      `Hola ${appt.customerName}, te escribimos de Autovisión. Te contacto para coordinar los detalles de tu cita de ${appt.serviceName} agendada para el día ${appt.date} a las ${appt.time} hs.`
    );
    return `https://wa.me/521${cleanPhone}?text=${text}`;
  };

  const getWhatsAppRequestLink = (req: CustomAccessoryRequest) => {
    const cleanPhone = req.phone.replace(/\D/g, "");
    const text = encodeURIComponent(
      `Hola ${req.customerName}, te escribimos de Autovisión. Ya tengo el presupuesto listo de tu accesorio especial (${req.accessoryName}) para tu coche ${req.brand} ${req.model} (${req.year}). El costo total instalado es de $${req.quotedPrice} MXN.`
    );
    return `https://wa.me/521${cleanPhone}?text=${text}`;
  };

  // Gallery Handlers
  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGallery.title || !newGallery.imageUrlBefore || !newGallery.imageUrlAfter) {
      alert("Por favor llena todos los campos de galería.");
      return;
    }
    try {
      await addGalleryItem(newGallery);
      setNewGallery({
        title: "",
        category: "Polarizado 3M",
        description: "",
        imageUrlBefore: "",
        imageUrlAfter: ""
      });
      alert("Trabajo agregado a galería antes/después con éxito.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta imagen de la galería?")) {
      await deleteGalleryItem(id);
    }
  };

  // Service Handlers
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.id || !newService.name || !newService.priceFrom) {
      alert("Por favor, llena los campos básicos.");
      return;
    }
    try {
      await upsertService({
        ...newService,
        priceFrom: Number(newService.priceFrom),
        active: true
      });
      // Refresh list
      getServices().then(setServices);
      setNewService({
        id: "",
        name: "",
        description: "",
        category: "Polarizado 3M",
        priceFrom: 1000,
        duration: "2 horas",
        image: ""
      });
      alert("Servicio guardado/actualizado con éxito.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleService = async (service: Service) => {
    await upsertService({
      ...service,
      active: !service.active
    });
    getServices().then(setServices);
  };

  const handleDeleteService = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar permanentemente este servicio del catálogo?")) {
      await deleteService(id);
      getServices().then(setServices);
    }
  };

  const handleServiceImageUpload = async (serviceId: string, imageUrl: string) => {
    try {
      const srvToUpdate = services.find(s => s.id === serviceId);
      if (srvToUpdate) {
        const updatedSrv = { ...srvToUpdate, image: imageUrl };
        await upsertService(updatedSrv);
        getServices().then(setServices);
      }
    } catch (err) {
      console.error("Error al actualizar la imagen del servicio:", err);
    }
  };

  // Bank Handlers
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBankSettings(bankSettings);
      alert("Datos bancarios actualizados correctamente.");
    } catch (err) {
      console.error(err);
    }
  };

  // Quote Accessories Handler
  const handleSaveQuote = async (id: string) => {
    try {
      await updateCustomAccessoryRequestField(id, {
        quotedPrice: Number(quotedPriceInput),
        status: "quoted"
      });
      setQuotingRequestId(null);
      setQuotedPriceInput(0);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAppointments = React.useMemo(() => {
    return appointments.filter((appt) => {
      const matchSearch = 
        appt.customerName.toLowerCase().includes(apptSearch.toLowerCase()) || 
        appt.serviceName.toLowerCase().includes(apptSearch.toLowerCase()) || 
        appt.phone.includes(apptSearch) || 
        appt.vehicle.toLowerCase().includes(apptSearch.toLowerCase());
      
      const matchStatus = apptStatusFilter === "all" || appt.status === apptStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [appointments, apptSearch, apptStatusFilter]);


  // Filter appointments for Stripe Transactions (paymentMethod === "card")
  const stripeAppointments = React.useMemo(() => {
    return appointments.filter((appt) => appt.paymentMethod === "card");
  }, [appointments]);

  const filteredStripeAppts = React.useMemo(() => {
    return stripeAppointments.filter((appt) => {
      // 1. Status Filter
      if (stripeFilterStatus !== "all") {
        if (stripeFilterStatus === "paid" && appt.paymentStatus !== "paid") return false;
        if (stripeFilterStatus === "pending" && appt.paymentStatus === "paid") return false;
      }

      // 2. Date Filter
      if (stripeDateFilter !== "all") {
        const todayStr = new Date().toISOString().split("T")[0];
        const apptDateStr = appt.date; // assuming YYYY-MM-DD

        if (stripeDateFilter === "today") {
          if (apptDateStr !== todayStr) return false;
        } else if (stripeDateFilter === "week") {
          const apptDate = new Date(apptDateStr);
          const diffTime = Math.abs(new Date().getTime() - apptDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 7) return false;
        } else if (stripeDateFilter === "month") {
          const apptDate = new Date(apptDateStr);
          const diffTime = Math.abs(new Date().getTime() - apptDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 30) return false;
        }
      }

      // 3. Search text
      if (stripeSearch.trim() !== "") {
        const query = stripeSearch.toLowerCase();
        const nameMatch = appt.customerName?.toLowerCase().includes(query);
        const vehicleMatch = appt.vehicle?.toLowerCase().includes(query);
        const serviceMatch = appt.serviceName?.toLowerCase().includes(query);
        const phoneMatch = appt.phone?.toLowerCase().includes(query);
        const emailMatch = (appt.customerEmail || "")?.toLowerCase().includes(query);
        const idMatch = (appt.id || "")?.toLowerCase().includes(query);
        
        return nameMatch || vehicleMatch || serviceMatch || phoneMatch || emailMatch || idMatch;
      }

      return true;
    });
  }, [stripeAppointments, stripeFilterStatus, stripeDateFilter, stripeSearch]);

  // Stripe accounting metrics calculations
  const totalStripeGross = React.useMemo(() => {
    return filteredStripeAppts
      .filter(a => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + (a.total || 0), 0);
  }, [filteredStripeAppts]);

  // Stripe fee in Mexico is 3.6% + $3.00 MXN + 16% IVA on the fee
  const totalStripeFees = React.useMemo(() => {
    return filteredStripeAppts
      .filter(a => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + (((a.total || 0) * 0.036 + 3) * 1.16), 0);
  }, [filteredStripeAppts]);

  const totalStripeNet = totalStripeGross - totalStripeFees;
  const stripePaidCount = filteredStripeAppts.filter(a => a.paymentStatus === "paid").length;
  const stripePendingCount = filteredStripeAppts.filter(a => a.paymentStatus !== "paid").length;
  const averageTicket = stripePaidCount > 0 ? totalStripeGross / stripePaidCount : 0;

  // Export report to CSV
  const handleExportCSV = () => {
    const headers = [
      "ID Transaccion", 
      "Cliente", 
      "Email", 
      "Telefono", 
      "Vehiculo", 
      "Servicio", 
      "Fecha Cita", 
      "Hora Cita", 
      "Monto Bruto (MXN)", 
      "Comision Stripe (MXN)", 
      "Monto Neto (MXN)", 
      "Estatus de Pago"
    ];
    
    const rows = filteredStripeAppts.map(appt => {
      const comision = appt.paymentStatus === "paid" ? (((appt.total || 0) * 0.036 + 3) * 1.16) : 0;
      const neto = appt.paymentStatus === "paid" ? ((appt.total || 0) - comision) : 0;
      return [
        appt.id || "N/A",
        appt.customerName,
        appt.customerEmail || "No registrado",
        appt.phone,
        appt.vehicle,
        appt.serviceName,
        appt.date,
        appt.time,
        appt.total || 0,
        comision.toFixed(2),
        neto.toFixed(2),
        appt.paymentStatus === "paid" ? "PAGADA / EXITO" : "PENDIENTE"
      ];
    });

    // Handle CSV generation with proper character encoding for Spanish accents
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Autovision_Stripe_ReporteContable_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // RENDER: Login Card if not logged in
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <svg className="animate-spin h-10 w-10 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 max-w-md mx-auto px-4 sm:px-6">
        <div className="bg-[#0f172a] rounded-3xl border border-slate-800 p-8 shadow-2xl relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 border border-slate-900">
            <LayoutDashboard className="h-10 w-10 text-black" />
          </div>
          
          <div className="text-center mt-12 mb-6">
            <h2 className="text-xl font-black text-white">Autovisión Admin</h2>
            <p className="text-slate-400 text-xs mt-1">Inicia sesión para administrar citas, servicios y estados.</p>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Email Corporativo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej. admin@autovision.com"
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-brand-blue hover:bg-cyan-400 text-black font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/10 cursor-pointer"
            >
              {isSignUp ? "Registrarse" : "Ingresar al Panel"}
            </button>
          </form>

          {/* Prompt/Guide */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-2">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              {isSignUp ? "¿Ya tienes cuenta? Iniciar Sesión" : "¿No tienes cuenta corporativa? Regístrate aquí"}
            </button>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-500 leading-relaxed text-left">
              <strong>💡 Acceso Restringido:</strong> Solo la cuenta del administrador principal (UID: Deo4NaEV22cKLCIyexpK8u9UhTX2) tiene acceso total para gestionar citas, servicios y configuraciones de Autovisión.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.uid !== "Deo4NaEV22cKLCIyexpK8u9UhTX2" && user.uid !== "HHIdRIm7BPh2TTwum7hefVwoY4Z2") {
    return (
      <div className="py-16 max-w-md mx-auto px-4 sm:px-6">
        <div className="bg-[#0f172a] rounded-3xl border border-red-500/20 p-8 shadow-2xl relative text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-950/40 border border-red-500/30 text-red-400 mb-6">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-white">Acceso Denegado</h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Tu cuenta no tiene permisos autorizados en el sistema. Solo el administrador y el técnico autorizado tienen acceso.
          </p>
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="w-full bg-[#1e293b] hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all border border-white/5 cursor-pointer"
            >
              Cerrar Sesión / Cambiar de cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN RENDER: Logged-in admin panel
  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <span className="font-mono text-xs text-brand-blue uppercase tracking-widest font-bold">
            {isTechnician ? "Consola de Técnico (Modo Lectura)" : "Consola de Control"}
          </span>
          <h1 className="text-3xl font-extrabold text-white">
            {isTechnician ? "Panel de Técnico — Jesus Emiliano Espinoza Velázquez" : "Panel de Administración"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            Usuario: <span className="text-white font-bold">{user.email}</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-xs bg-red-950/30 text-red-400 border border-red-900/30 hover:bg-red-950/80 px-3 py-1.5 rounded-lg transition-colors font-bold cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-1 bg-[#0f172a] p-1 rounded-xl border border-slate-800 mb-8 max-w-fit">
        <button
          onClick={() => setAdminTab("dashboard")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            adminTab === "dashboard" ? "bg-brand-blue text-black" : "text-slate-400 hover:text-white"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </button>
        <button
          onClick={() => setAdminTab("appointments")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            adminTab === "appointments" ? "bg-brand-blue text-black" : "text-slate-400 hover:text-white"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          Citas
        </button>
        <button
          onClick={() => setAdminTab("requests")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            adminTab === "requests" ? "bg-brand-blue text-black" : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Especiales
        </button>
        <button
          onClick={() => setAdminTab("gallery")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            adminTab === "gallery" ? "bg-brand-blue text-black" : "text-slate-400 hover:text-white"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Galería A/D
        </button>
        <button
          onClick={() => setAdminTab("services")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            adminTab === "services" ? "bg-brand-blue text-black" : "text-slate-400 hover:text-white"
          }`}
        >
          <Wrench className="h-4 w-4" />
          Servicios
        </button>
        <button
          onClick={() => setAdminTab("bank")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            adminTab === "bank" ? "bg-brand-blue text-black" : "text-slate-400 hover:text-white"
          }`}
        >
          <Settings className="h-4 w-4" />
          Bancos
        </button>
        <button
          onClick={() => setAdminTab("transactions")}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            adminTab === "transactions" ? "bg-brand-blue text-black" : "text-slate-400 hover:text-white"
          }`}
        >
          <Receipt className="h-4 w-4 text-emerald-400" />
          Stripe / Contabilidad
        </button>
      </div>

      {/* TAB CONTENT: DASHBOARD */}
      {adminTab === "dashboard" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Welcome Banner for Technician */}
          {isTechnician && (
            <div className="bg-amber-950/30 border border-amber-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                    ¡Bienvenido, Jesus Emiliano Espinoza Velázquez! 
                    <span className="text-[10px] font-mono font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">Técnico Autorizado</span>
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Esta es tu consola de control en modo lectura. Aquí puedes supervisar las alertas de servicios activos, consultar detalles de citas agendadas y dar seguimiento a tus ganancias acumuladas.
                  </p>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl text-left md:text-right shrink-0 w-full md:w-auto">
                <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">Tus Ganancias Acumuladas (85%)</span>
                <span className="text-xl font-black text-amber-400 block mt-0.5">${(stats.earnings * 0.85).toLocaleString("es-MX")} MXN</span>
              </div>
            </div>
          )}

          {/* Stat widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-500 uppercase block">Citas Pendientes</span>
                <span className="text-3xl font-black text-white block mt-1">{stats.pending}</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-950/50 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-500 uppercase block">Citas Confirmadas / Proceso</span>
                <span className="text-3xl font-black text-white block mt-1">{stats.confirmed + stats.process}</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-cyan-950/50 border border-brand-blue/20 flex items-center justify-center text-brand-blue">
                <Play className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-500 uppercase block">Ingresos Estimados</span>
                <span className="text-3xl font-black text-emerald-400 block mt-1">${stats.earnings.toLocaleString("es-MX")}</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-950/50 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {isTechnician ? (
              <div className="bg-[#0f172a] rounded-2xl border border-amber-500/10 p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-amber-500 uppercase block">Mis Ganancias (85%)</span>
                  <span className="text-3xl font-black text-amber-400 block mt-1">${(stats.earnings * 0.85).toLocaleString("es-MX")}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-950/50 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
            ) : (
              <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-500 uppercase block">Comisión Autovisión (15%)</span>
                  <span className="text-3xl font-black text-purple-400 block mt-1">${stats.commissions.toLocaleString("es-MX")}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-950/50 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Popular services and notices */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <TrendingUp className="h-4 w-4 text-cyan-400" /> Servicios más solicitados
              </h3>
              
              {stats.popularServices.length === 0 ? (
                <p className="text-slate-500 text-xs">Aún no hay suficientes citas concretadas para evaluar.</p>
              ) : (
                <div className="space-y-3">
                  {stats.popularServices.map((srv, index) => (
                    <div key={srv.name} className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">#{index+1}</span>
                        <span className="text-xs text-white font-medium">{srv.name}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {srv.count} {srv.count === 1 ? "cita" : "citas"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Quick shortcuts */}
            <div className="lg:col-span-2 bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <CalendarDays className="h-4 w-4 text-emerald-400" /> Próximas citas pendientes urgentes
              </h3>

              {appointments.filter(a => a.status === "pending").slice(0, 3).length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  ✓ No hay citas pendientes por el momento. ¡Buen trabajo!
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.filter(a => a.status === "pending").slice(0, 3).map((appt) => (
                    <div key={appt.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl gap-2 text-xs">
                      <div>
                        <span className="font-bold text-white">{appt.customerName}</span>
                        <span className="text-slate-500 block">{appt.vehicle} • {appt.serviceName}</span>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800 text-[10px] uppercase font-bold font-mono shrink-0">
                          {appt.date} • {appt.time}
                        </span>
                        {!isTechnician ? (
                          <button
                            onClick={() => changeApptStatus(appt.id!, "confirmed")}
                            className="bg-brand-blue text-black px-2 py-1 rounded font-bold cursor-pointer hover:bg-cyan-400"
                          >
                            Confirmar
                          </button>
                        ) : (
                          <span className="bg-slate-900 text-amber-500 border border-slate-800 px-2.5 py-1 rounded font-mono text-[9px] uppercase font-bold">
                            Alerta Activa
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: APPOINTMENTS LIST & STATUS MANAGEMENT */}
      {adminTab === "appointments" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filters & Search bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar citas (por nombre, vehículo, servicio, teléfono)..."
                value={apptSearch}
                onChange={(e) => setApptSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white"
              />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={apptStatusFilter}
                onChange={(e) => setApptStatusFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white cursor-pointer"
              >
                <option value="all">Estatus: Todos</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="processing">En Proceso</option>
                <option value="completed">Terminadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>

          {/* List display */}
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16 bg-[#0f172a]/30 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
              No se encontraron citas con estos filtros.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appt) => (
                <div 
                  key={appt.id} 
                  className={`bg-[#0f172a] rounded-2xl border p-5 md:p-6 text-xs transition-all relative ${
                    appt.status === "completed" ? "border-emerald-500/10 opacity-75"
                    : appt.status === "cancelled" ? "border-red-500/10 opacity-50"
                    : "border-slate-800/80"
                  }`}
                >
                  {/* Card upper band */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/60 mb-4 gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-500 uppercase">Cita ID: {appt.id?.substring(0, 8)}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{appt.customerName}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Appointment status badge */}
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase font-mono ${
                        appt.status === "pending" ? "bg-amber-950 text-amber-400 border-amber-800"
                        : appt.status === "confirmed" ? "bg-blue-950 text-blue-400 border-blue-800"
                        : appt.status === "processing" ? "bg-cyan-950 text-cyan-400 border-cyan-800 animate-pulse"
                        : appt.status === "completed" ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                      }`}>
                        {appt.status}
                      </span>

                      {/* Payment status badge */}
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase font-mono ${
                        appt.paymentStatus === "pending" ? "bg-red-950 text-red-400 border-red-800"
                        : appt.paymentStatus === "proof_sent" ? "bg-yellow-950 text-yellow-400 border-yellow-800"
                        : appt.paymentStatus === "paid" ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                      }`}>
                        Pago: {appt.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Details Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Client & Vehicle details */}
                    <div className="space-y-2">
                      <p className="text-slate-400"><strong className="text-slate-300">Celular:</strong> {appt.phone}</p>
                      <p className="text-slate-400"><strong className="text-slate-300">Vehículo:</strong> {appt.vehicle}</p>
                      <p className="text-slate-400"><strong className="text-slate-300">Servicio:</strong> {appt.serviceName}</p>
                      <p className="text-slate-400"><strong className="text-slate-300">Fecha y Hora:</strong> {appt.date} • {appt.time} hs</p>
                    </div>

                    {/* Column 2: Address & Maps GPS */}
                    <div className="space-y-2">
                      <p className="text-slate-400"><strong className="text-slate-300">Atención:</strong> {appt.serviceType === "taller" ? "🏠 En Taller" : "📍 A Domicilio"}</p>
                      
                      {appt.serviceType === "domicilio" && (
                        <>
                          <p className="text-slate-400 leading-relaxed"><strong className="text-slate-300">Dirección:</strong> {appt.addressText || "No indicada"}</p>
                          {appt.references && (
                            <p className="text-slate-500 italic"><strong className="text-slate-400">Refs:</strong> "{appt.references}"</p>
                          )}
                        </>
                      )}

                      {/* External Map Trigger */}
                      <div className="pt-1.5">
                        <a 
                          href={getGoogleMapsLink(appt)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1.5 rounded text-[10px] font-bold text-cyan-400 transition-colors"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          {appt.location?.lat ? "Abrir Ubicación GPS" : "Buscar Dirección en Maps"}
                        </a>
                      </div>
                    </div>

                    {/* Column 3: Totals & Payments */}
                    <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-2 self-start">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Servicio:</span>
                        <span className="text-slate-300 font-mono">${appt.servicePrice.toLocaleString("es-MX")} MXN</span>
                      </div>
                      {appt.travelFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Costo Traslado:</span>
                          <span className="text-slate-300 font-mono">${appt.travelFee} MXN</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t border-slate-850 pt-1.5 text-white">
                        <span>Total:</span>
                        <span className="text-emerald-400 font-mono text-xs sm:text-sm">${appt.total.toLocaleString("es-MX")} MXN</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-850 pt-1 text-slate-500 font-mono text-[10px]">
                        <span>Comisión Autovisión (15%):</span>
                        <span className="text-purple-400">${appt.commissionAmount.toLocaleString("es-MX")}</span>
                      </div>

                      {/* Display receipt link if proof submitted */}
                      {appt.receiptUrl && (
                        <div className="pt-2 text-center border-t border-slate-850">
                          <a 
                            href={appt.receiptUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs text-brand-blue hover:underline flex items-center justify-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Ver comprobante de transferencia
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Panel */}
                  <div className="mt-5 pt-4 border-t border-slate-800/60 flex flex-wrap gap-2 items-center justify-between">
                    {isTechnician ? (
                      <div className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg font-medium">
                        🛡️ Vista de Técnico (Solo Lectura): Los estados de cita y pago solo pueden ser modificados por el administrador principal.
                      </div>
                    ) : (
                      <>
                        {/* Flow controllers */}
                        <div className="flex flex-wrap gap-1.5">
                          {appt.status === "pending" && (
                            <button
                              onClick={() => changeApptStatus(appt.id!, "confirmed")}
                              className="bg-blue-950 hover:bg-blue-900 border border-blue-800/50 text-blue-400 px-3 py-1.5 rounded font-bold cursor-pointer"
                            >
                              Confirmar Cita
                            </button>
                          )}
                          {appt.status === "confirmed" && (
                            <button
                              onClick={() => changeApptStatus(appt.id!, "processing")}
                              className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/50 text-brand-blue px-3 py-1.5 rounded font-bold cursor-pointer"
                            >
                              Iniciar Trabajo (En Proceso)
                            </button>
                          )}
                          {appt.status === "processing" && (
                            <button
                              onClick={() => changeApptStatus(appt.id!, "completed")}
                              className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/50 text-emerald-400 px-3 py-1.5 rounded font-bold cursor-pointer"
                            >
                              ✓ Terminar Trabajo
                            </button>
                          )}
                          {appt.status !== "completed" && appt.status !== "cancelled" && (
                            <button
                              onClick={() => changeApptStatus(appt.id!, "cancelled")}
                              className="bg-red-950 hover:bg-red-900 border border-red-900/40 text-red-400 px-3 py-1.5 rounded font-bold cursor-pointer"
                            >
                              Cancelar Cita
                            </button>
                          )}
                        </div>

                        {/* Payment status controllers and contact */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {appt.paymentStatus === "proof_sent" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => changePaymentStatus(appt.id!, "paid")}
                                className="bg-emerald-900 hover:bg-emerald-800 text-white px-2 py-1 rounded font-bold"
                                title="Aprobar Pago"
                              >
                                Aprobar Pago
                              </button>
                              <button
                                onClick={() => changePaymentStatus(appt.id!, "rejected")}
                                className="bg-red-900 hover:bg-red-800 text-white px-2 py-1 rounded font-bold"
                                title="Rechazar Comprobante"
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      <a
                        href={getWhatsAppApptLink(appt)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded font-bold flex items-center gap-1"
                      >
                        <Smartphone className="h-3.5 w-3.5" /> WhatsApp Cliente
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CUSTOM ACCESSORY REQUESTS */}
      {adminTab === "requests" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2">Solicitudes de Accesorios Externos / Especiales</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              En este módulo puedes gestionar las cotizaciones externas enviadas por clientes interesados en piezas que no están en el catálogo común.
            </p>
          </div>

          {customRequests.length === 0 ? (
            <div className="text-center py-16 bg-[#0f172a]/30 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
              No hay solicitudes especiales pendientes por cotizar.
            </div>
          ) : (
            <div className="space-y-4">
              {customRequests.map((req) => (
                <div key={req.id} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 md:p-6 text-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/60 gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-500">Solicitud ID: {req.id?.substring(0, 8)}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{req.customerName} (Tel. {req.phone})</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full border font-bold text-[9px] font-mono uppercase ${
                      req.status === "pending" ? "bg-amber-950 text-amber-400 border-amber-800"
                      : req.status === "quoted" ? "bg-blue-950 text-blue-400 border-blue-800"
                      : "bg-emerald-950 text-emerald-400 border-emerald-800"
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Request details */}
                    <div className="space-y-2">
                      <p className="text-slate-400"><strong className="text-slate-300">Vehículo:</strong> {req.brand} {req.model} ({req.year})</p>
                      <p className="text-slate-400"><strong className="text-slate-300">Accesorio a Cotizar:</strong> {req.accessoryName}</p>
                      <p className="text-slate-400"><strong className="text-slate-300">Comentarios:</strong> "{req.notes || "Sin notas"}"</p>
                      
                      {req.quotedPrice ? (
                        <p className="text-slate-300 text-sm"><strong className="text-slate-400">Presupuesto asignado:</strong> <span className="text-emerald-400 font-bold">${req.quotedPrice} MXN</span></p>
                      ) : (
                        <p className="text-amber-500 font-bold">Presupuesto pendiente de asignar.</p>
                      )}

                      {req.imageUrl && (
                        <div className="pt-2">
                          <a href={req.imageUrl} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" /> Ver foto de referencia enviada
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Middle: AI analysis summary */}
                    <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl md:col-span-2 space-y-2 max-h-48 overflow-y-auto">
                      <span className="font-mono text-[9px] text-cyan-400 font-bold uppercase flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Análisis AI Preliminar de Compatibilidad
                      </span>
                      <p className="text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed">
                        {req.aiAnalysis || "Análisis preliminar ausente."}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="border-t border-slate-800/60 pt-4 flex flex-wrap gap-2 items-center justify-between">
                    {isTechnician ? (
                      <div className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg font-medium">
                        🛡️ Vista de Técnico (Solo Lectura): Los presupuestos especiales solo son modificables por el Administrador.
                      </div>
                    ) : (
                      <>
                        <div>
                          {quotingRequestId === req.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                placeholder="Costo total instalado ($)"
                                value={quotedPriceInput}
                                onChange={(e) => setQuotedPriceInput(Number(e.target.value))}
                                className="bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-blue w-40"
                              />
                              <button
                                onClick={() => handleSaveQuote(req.id!)}
                                className="bg-brand-blue text-black font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-cyan-400 cursor-pointer"
                              >
                                Guardar Precio
                              </button>
                              <button
                                onClick={() => setQuotingRequestId(null)}
                                className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-700 cursor-pointer"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setQuotingRequestId(req.id!);
                                setQuotedPriceInput(req.quotedPrice || 0);
                              }}
                              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              💵 Asignar / Cambiar Presupuesto Instalado
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => updateCustomAccessoryRequestField(req.id!, { status: "completed" })}
                            className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-bold"
                          >
                            Marcar Completado / Cita Creada
                          </button>
                        </div>
                      </>
                    )}

                    <div className="flex gap-2 ml-auto">
                      <a
                        href={getWhatsAppRequestLink(req)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Smartphone className="h-3.5 w-3.5" /> Enviar Presupuesto por WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: GALLERY MANAGEMENT */}
      {adminTab === "gallery" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Left: Upload Form (Only for non-technicians) */}
          {!isTechnician ? (
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-4 self-start">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Plus className="h-4 w-4 text-cyan-400" />
                Subir Trabajo Terminado
              </h3>
              
              <form onSubmit={handleAddGallery} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">Título del Trabajo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pulido espejo en Jetta"
                    value={newGallery.title}
                    onChange={(e) => setNewGallery({ ...newGallery, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">Categoría *</label>
                  <select
                    value={newGallery.category}
                    onChange={(e) => setNewGallery({ ...newGallery, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-2 text-white"
                  >
                    <option value="Paquetes">Paquetes</option>
                    <option value="Polarizado 3M">Polarizado 3M</option>
                    <option value="Luces LED">Luces LED</option>
                    <option value="Barras LED">Barras LED</option>
                    <option value="Sonido automotriz">Sonido automotriz</option>
                    <option value="Pulido de faros">Pulido de faros</option>
                    <option value="Pulido de carrocería">Pulido de carrocería</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Servicios especiales">Servicios especiales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">Descripción corta</label>
                  <input
                    type="text"
                    placeholder="Ej. Se removieron rayones y aplicó cera"
                    value={newGallery.description}
                    onChange={(e) => setNewGallery({ ...newGallery, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">Foto Antes (Before) *</label>
                  <ImageUploader
                    folder="gallery_before"
                    initialImageUrl={newGallery.imageUrlBefore}
                    onUploadComplete={(url) => setNewGallery({ ...newGallery, imageUrlBefore: url })}
                    label="Subir foto antes"
                  />
                  <input
                    type="text"
                    placeholder="O pega URL de imagen..."
                    value={newGallery.imageUrlBefore}
                    onChange={(e) => setNewGallery({ ...newGallery, imageUrlBefore: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-1.5 text-white font-mono text-[10px] mt-1.5"
                  />
                  {/* Suggestions triggers for easy seeding */}
                  <div className="flex gap-1 mt-1 text-[9px] text-cyan-400">
                    <button type="button" onClick={() => setNewGallery({...newGallery, imageUrlBefore: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=400"})} className="hover:underline">Foto faro opaco</button>
                    <span>•</span>
                    <button type="button" onClick={() => setNewGallery({...newGallery, imageUrlBefore: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400"})} className="hover:underline">Foto coche sin pulir</button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">Foto Después (After) *</label>
                  <ImageUploader
                    folder="gallery_after"
                    initialImageUrl={newGallery.imageUrlAfter}
                    onUploadComplete={(url) => setNewGallery({ ...newGallery, imageUrlAfter: url })}
                    label="Subir foto después"
                  />
                  <input
                    type="text"
                    placeholder="O pega URL de imagen..."
                    value={newGallery.imageUrlAfter}
                    onChange={(e) => setNewGallery({ ...newGallery, imageUrlAfter: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-1.5 text-white font-mono text-[10px] mt-1.5"
                  />
                  <div className="flex gap-1 mt-1 text-[9px] text-cyan-400">
                    <button type="button" onClick={() => setNewGallery({...newGallery, imageUrlAfter: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&q=80&w=400"})} className="hover:underline">Foto faro restaurado</button>
                    <span>•</span>
                    <button type="button" onClick={() => setNewGallery({...newGallery, imageUrlAfter: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=400"})} className="hover:underline">Foto coche pulido espejo</button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Registrar Trabajo Terminado
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[#0f172a] rounded-2xl border border-amber-500/10 p-5 space-y-3 self-start text-xs">
              <span className="font-mono text-[9px] text-amber-500 font-bold uppercase tracking-widest">Vista de Técnico</span>
              <h3 className="font-bold text-white">Galería de Trabajos</h3>
              <p className="text-slate-400 leading-relaxed">
                Aquí se muestran los trabajos de pulido, polarizado y personalización completados para inspirar la confianza de los clientes. Los nuevos trabajos e imágenes solo pueden ser agregados por el administrador de Autovisión.
              </p>
            </div>
          )}

          {/* Right: Existing gallery list */}
          <div className={`${isTechnician ? "lg:col-span-2" : "lg:col-span-2"} space-y-4`}>
            <h3 className="text-sm font-bold text-white">Trabajos en Galería</h3>
            
            {gallery.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay trabajos en la galería.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gallery.map((item) => (
                  <div key={item.id} className="bg-[#0f172a] rounded-2xl border border-slate-850 p-4 space-y-3 relative">
                    {!isTechnician && (
                      <button
                        onClick={() => handleDeleteGallery(item.id!)}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-slate-900/90 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-950 transition-colors cursor-pointer"
                        title="Eliminar de galería"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <div className="flex justify-between items-center pr-8">
                      <div>
                        <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase">{item.category}</span>
                        <h4 className="font-bold text-white text-xs">{item.title}</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 h-24">
                      <div className="relative rounded-lg overflow-hidden border border-slate-800">
                        <img src={item.imageUrlBefore} alt="Antes" className="h-full w-full object-cover" />
                        <span className="absolute bottom-1 left-1.5 bg-black/70 text-[8px] font-bold text-red-400 px-1.5 rounded">Antes</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden border border-slate-800">
                        <img src={item.imageUrlAfter} alt="Después" className="h-full w-full object-cover" />
                        <span className="absolute bottom-1 left-1.5 bg-black/70 text-[8px] font-bold text-emerald-400 px-1.5 rounded">Después</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SERVICES CATALOG DEFINITION */}
      {adminTab === "services" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Left Form: Add/Edit Service (Only for non-technicians) */}
          {!isTechnician ? (
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-4 self-start">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Plus className="h-4 w-4 text-cyan-400" />
                Añadir / Editar Servicio
              </h3>

              <form onSubmit={handleSaveService} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">ID Único del Servicio *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. polarizado-nano-carbon"
                    value={newService.id}
                    onChange={(e) => setNewService({ ...newService, id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Polarizado Nano-Cerámico"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">Categoría *</label>
                  <select
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-2 text-white"
                  >
                    <option value="Paquetes">Paquetes</option>
                    <option value="Polarizado 3M">Polarizado 3M</option>
                    <option value="Luces LED">Luces LED</option>
                    <option value="Barras LED">Barras LED</option>
                    <option value="Sonido automotriz">Sonido automotriz</option>
                    <option value="Pulido de faros">Pulido de faros</option>
                    <option value="Pulido de carrocería">Pulido de carrocería</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Servicios especiales">Servicios especiales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">Descripción del Servicio</label>
                  <textarea
                    rows={3}
                    placeholder="Describe beneficios, especificaciones técnicas y alcances..."
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-2 text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">Precio Desde ($) *</label>
                    <input
                      type="number"
                      required
                      placeholder="Ej. 1500"
                      value={newService.priceFrom}
                      onChange={(e) => setNewService({ ...newService, priceFrom: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">Duración Estimada</label>
                    <input
                      type="text"
                      placeholder="Ej. 1.5 horas"
                      value={newService.duration}
                      onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1">Imagen del Servicio</label>
                  <ImageUploader
                    folder="services"
                    initialImageUrl={newService.image}
                    onUploadComplete={(url) => setNewService({ ...newService, image: url })}
                    label="Cambiar foto del servicio"
                  />
                  <input
                    type="text"
                    placeholder="O pega URL de imagen..."
                    value={newService.image}
                    onChange={(e) => setNewService({ ...newService, image: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-3.5 py-1.5 text-white font-mono text-[10px] mt-1.5"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Guardar Servicio
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[#0f172a] rounded-2xl border border-amber-500/10 p-5 space-y-3 self-start text-xs text-left">
              <span className="font-mono text-[9px] text-amber-500 font-bold uppercase tracking-widest">Vista de Técnico</span>
              <h3 className="font-bold text-white">Catálogo de Servicios de Autovisión</h3>
              <p className="text-slate-400 leading-relaxed">
                Este catálogo de servicios contiene los precios estándar ("Precio Desde") y tiempos aproximados de trabajo para cada instalación autorizada en Autovisión.
              </p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Solo el administrador de Autovisión puede reestructurar, pausar o eliminar servicios del catálogo oficial.
              </p>
            </div>
          )}

          {/* Right List: Catalog display */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white">Catálogo de Servicios</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((srv) => (
                <div key={srv.id} className="bg-[#0f172a] rounded-2xl border border-slate-850 p-4 flex flex-col justify-between text-xs space-y-3">
                  <div>
                    <div className="flex gap-3">
                      {srv.image ? (
                        <img 
                          src={srv.image} 
                          alt={srv.name} 
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-800" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                          <ImageIcon className="h-5 w-5 text-slate-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase block leading-none">{srv.category}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase ${srv.active ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>
                            {srv.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-xs truncate mt-1">{srv.name}</h4>
                        <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-1 mt-0.5">{srv.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                      <div className="text-slate-400 font-mono">
                        💵 Desde: <strong className="text-white">${srv.priceFrom} MXN</strong>
                      </div>
                      <div className="text-slate-400 font-mono text-right">
                        ⏱ Duración: <strong className="text-white">{srv.duration}</strong>
                      </div>
                    </div>

                    {/* Dynamic Image Changer directly on the card (Only for non-technicians) */}
                    {!isTechnician && (
                      <div className="mt-3 pt-3 border-t border-slate-850">
                        <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Subir / Cambiar Foto de este Servicio</label>
                        <ImageUploader
                          folder="services"
                          initialImageUrl={srv.image}
                          onUploadComplete={(url) => handleServiceImageUpload(srv.id, url)}
                          label="Cambiar imagen"
                        />
                      </div>
                    )}
                  </div>

                  {!isTechnician ? (
                    <div className="flex gap-2 border-t border-slate-850 pt-3">
                      <button
                        onClick={() => setNewService({
                          id: srv.id,
                          name: srv.name,
                          description: srv.description,
                          category: srv.category,
                          priceFrom: srv.priceFrom,
                          duration: srv.duration,
                          image: srv.image || ""
                        })}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-1.5 rounded-lg border border-slate-800 text-center cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleService(srv)}
                        className={`flex-1 font-bold py-1.5 rounded-lg border text-center cursor-pointer ${
                          srv.active 
                            ? "bg-amber-950/20 text-amber-400 border-amber-900/30 hover:bg-amber-950/60" 
                            : "bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-950/60"
                        }`}
                      >
                        {srv.active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => handleDeleteService(srv.id)}
                        className="bg-red-950 hover:bg-red-900 text-red-400 font-bold p-1.5 rounded-lg border border-red-900/30 cursor-pointer"
                        title="Eliminar permanentemente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-t border-slate-850 pt-2.5 text-slate-500 text-[10px] font-medium italic text-center">
                      ✓ Servicio Estándar Autovisión
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BANK ACCOUNTS DEFINITION */}
      {adminTab === "bank" && (
        <div className="max-w-xl mx-auto bg-[#0f172a] rounded-2xl border border-slate-800 p-6 md:p-8 space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-md font-bold text-white">Configurar Cuentas Bancarias</h3>
            <p className="text-xs text-slate-400 mt-1">
              {isTechnician 
                ? "Visualización de las cuentas autorizadas para depósitos y transferencias de clientes de Autovisión."
                : "Aquí puedes editar los datos de transferencia que se muestran a los clientes durante el proceso de agendado de cita."
              }
            </p>
          </div>

          <form onSubmit={isTechnician ? (e) => e.preventDefault() : handleSaveBank} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1.5">Nombre del Banco</label>
              <input
                type="text"
                required
                disabled={isTechnician}
                value={bankSettings.bankName}
                onChange={(e) => setBankSettings({ ...bankSettings, bankName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-4 py-2.5 text-white disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1.5">Titular de la Cuenta / Beneficiario</label>
              <input
                type="text"
                required
                disabled={isTechnician}
                value={bankSettings.accountHolder}
                onChange={(e) => setBankSettings({ ...bankSettings, accountHolder: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-4 py-2.5 text-white disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1.5">CLABE Interbancaria (18 dígitos)</label>
              <input
                type="text"
                required
                disabled={isTechnician}
                value={bankSettings.clabe}
                onChange={(e) => setBankSettings({ ...bankSettings, clabe: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-4 py-2.5 text-white font-mono disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase font-mono tracking-widest mb-1.5">Número de Cuenta</label>
              <input
                type="text"
                required
                disabled={isTechnician}
                value={bankSettings.accountNumber}
                onChange={(e) => setBankSettings({ ...bankSettings, accountNumber: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-4 py-2.5 text-white font-mono disabled:opacity-75"
              />
            </div>

            {isTechnician ? (
              <div className="text-[11px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-xl text-center font-medium">
                🛡️ Vista de Técnico (Solo Lectura): Los datos bancarios y cuentas de depósito únicamente pueden ser actualizados por el Administrador.
              </div>
            ) : (
              <button
                type="submit"
                className="w-full bg-brand-blue hover:bg-cyan-400 text-black font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
              >
                Guardar Cambios de Cuenta
              </button>
            )}
          </form>
        </div>
      )}

      {/* TAB CONTENT: STRIPE TRANSACTIONS / ACCOUNTING */}
      {adminTab === "transactions" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-blue-950/40 border border-blue-500/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-blue flex items-center gap-1.5">
                🔒 Procesador de Cuentas Conectado
              </span>
              <h2 className="text-xl font-black text-white uppercase italic">Auditoría de Pagos Stripe</h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Monitorea los ingresos, deduce comisiones automáticas y mantén un control de auditoría de todas las citas pagadas con tarjeta en Autovisión.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={filteredStripeAppts.length === 0}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-emerald-500/10"
            >
              <Receipt className="h-4 w-4" />
              Exportar Reporte Contable (CSV)
            </button>
          </div>

          {/* Bento Grid Stats Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bruto */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-2 flex flex-col justify-between shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Ingreso Bruto (Stripe)</span>
                <span className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 flex items-center justify-center text-xs font-bold font-mono">
                  $
                </span>
              </div>
              <div>
                <span className="text-2xl font-black text-white block">${totalStripeGross.toLocaleString("es-MX")} MXN</span>
                <span className="text-[10px] text-emerald-400 font-medium block mt-1">✓ {stripePaidCount} Transacciones aprobadas</span>
              </div>
            </div>

            {/* Comisiones */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-2 flex flex-col justify-between shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Comisión Stripe Estimada</span>
                <span className="h-7 w-7 rounded-lg bg-red-500/10 text-red-400 border border-red-500/10 flex items-center justify-center text-xs font-bold font-mono">
                  %
                </span>
              </div>
              <div>
                <span className="text-2xl font-black text-red-400 block">-${totalStripeFees.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
                <span className="text-[10px] text-slate-500 block mt-1">3.6% + $3.00 MXN + 16% IVA por cobro</span>
              </div>
            </div>

            {/* Neto */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-2 flex flex-col justify-between shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Ingreso Neto Real</span>
                <span className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/10 flex items-center justify-center text-xs font-bold font-mono">
                  net
                </span>
              </div>
              <div>
                <span className="text-2xl font-black text-brand-blue block">${totalStripeNet.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
                <span className="text-[10px] text-blue-400 font-medium block mt-1">Estimado transferido a banco</span>
              </div>
            </div>

            {/* Ticket Promedio */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-2 flex flex-col justify-between shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Ticket Promedio</span>
                <span className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/10 flex items-center justify-center text-xs font-bold font-mono">
                  avg
                </span>
              </div>
              <div>
                <span className="text-2xl font-black text-white block">${averageTicket.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
                <span className="text-[10px] text-slate-500 block mt-1">Por cita pagada en línea</span>
              </div>
            </div>
          </div>

          {/* Filters & Control Panel */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Buscador */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar por cliente, correo, teléfono, vehículo, servicio..."
                  value={stripeSearch}
                  onChange={(e) => setStripeSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-brand-blue focus:outline-none rounded-xl px-4 py-2.5 pl-11 text-xs text-white transition-all font-mono"
                />
                <Search className="absolute left-4 top-3 h-4 w-4 text-slate-500" />
              </div>

              {/* Filtros de Selección */}
              <div className="flex flex-wrap gap-2 items-center font-sans">
                {/* Estatus */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setStripeFilterStatus("paid")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all uppercase cursor-pointer ${
                      stripeFilterStatus === "paid" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Exitosas ({stripePaidCount})
                  </button>
                  <button
                    onClick={() => setStripeFilterStatus("pending")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all uppercase cursor-pointer ${
                      stripeFilterStatus === "pending" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Pendientes ({stripePendingCount})
                  </button>
                  <button
                    onClick={() => setStripeFilterStatus("all")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all uppercase cursor-pointer ${
                      stripeFilterStatus === "all" ? "bg-brand-blue/15 text-brand-blue border border-brand-blue/20" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Todas ({stripeAppointments.length})
                  </button>
                </div>

                {/* Fecha */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setStripeDateFilter("all")}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all uppercase cursor-pointer ${
                      stripeDateFilter === "all" ? "bg-slate-850 text-white" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Todo
                  </button>
                  <button
                    onClick={() => setStripeDateFilter("today")}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all uppercase cursor-pointer ${
                      stripeDateFilter === "today" ? "bg-slate-850 text-white" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setStripeDateFilter("week")}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all uppercase cursor-pointer ${
                      stripeDateFilter === "week" ? "bg-slate-850 text-white" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    7 Días
                  </button>
                  <button
                    onClick={() => setStripeDateFilter("month")}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all uppercase cursor-pointer ${
                      stripeDateFilter === "month" ? "bg-slate-850 text-white" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Mes
                  </button>
                </div>
              </div>
            </div>

            {/* List Table container */}
            <div className="overflow-x-auto border border-slate-800/60 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-900 text-slate-500 border-b border-slate-800 uppercase text-[9px] tracking-wider font-bold">
                    <th className="py-3 px-4">Cliente / Info de Pago</th>
                    <th className="py-3 px-4">Vehículo y Servicio</th>
                    <th className="py-3 px-4">Fecha Cita</th>
                    <th className="py-3 px-4 text-right">Monto Bruto</th>
                    <th className="py-3 px-4 text-right text-red-400">Comisión (Est.)</th>
                    <th className="py-3 px-4 text-right text-brand-blue">Monto Neto</th>
                    <th className="py-3 px-4 text-center">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredStripeAppts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <span className="text-xl">📊</span>
                          <p className="text-xs font-sans">No se encontraron transacciones con los filtros seleccionados.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStripeAppts.map((appt) => {
                      const comision = appt.paymentStatus === "paid" ? (((appt.total || 0) * 0.036 + 3) * 1.16) : 0;
                      const neto = appt.paymentStatus === "paid" ? ((appt.total || 0) - comision) : 0;

                      return (
                        <tr key={appt.id} className="hover:bg-slate-900/45 transition-colors group">
                          <td className="py-3.5 px-4 space-y-1 max-w-[200px] truncate">
                            <span className="font-bold text-white block group-hover:text-brand-blue transition-colors font-sans text-xs">
                              {appt.customerName}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate font-sans">{appt.customerEmail || "Sin Correo registrado"}</span>
                            <span className="text-[9px] text-slate-500 font-mono block">ID: {appt.id?.substring(0, 10)}...</span>
                          </td>
                          <td className="py-3.5 px-4 space-y-1">
                            <span className="text-slate-300 block font-sans text-xs">{appt.serviceName}</span>
                            <span className="text-[10px] text-slate-400 block uppercase tracking-widest">{appt.vehicle}</span>
                          </td>
                          <td className="py-3.5 px-4 space-y-1">
                            <span className="text-slate-300 block font-sans">{appt.date}</span>
                            <span className="text-[10px] text-slate-500 block">{appt.time} hrs</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-white">
                            ${(appt.total || 0).toLocaleString("es-MX")}
                          </td>
                          <td className="py-3.5 px-4 text-right text-red-400 font-medium">
                            {appt.paymentStatus === "paid" ? `-$${comision.toFixed(2)}` : "$0.00"}
                          </td>
                          <td className="py-3.5 px-4 text-right text-brand-blue font-bold">
                            {appt.paymentStatus === "paid" ? `$${neto.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {appt.paymentStatus === "paid" ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md font-sans">
                                ✓ Exitoso
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md font-sans">
                                ⌛ Pendiente
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
