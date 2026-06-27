import React, { useState, useEffect } from "react";
import { Service, BankSettings } from "../types";
import { createAppointment, getBankSettings } from "../firebaseUtils";
import ImageUploader from "./ImageUploader";
import { 
  Calendar, 
  MapPin, 
  CreditCard, 
  Clock, 
  Smartphone, 
  Info, 
  UploadCloud, 
  CheckCircle,
  MessageCircle,
  Map,
  DollarSign
} from "lucide-react";

interface SchedulerProps {
  services: Service[];
  selectedServiceId: string;
  onClearSelectedService: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function Scheduler({ services, selectedServiceId, onClearSelectedService, setCurrentTab }: SchedulerProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [serviceId, setServiceId] = useState(selectedServiceId || "");
  const [serviceType, setServiceType] = useState<"taller" | "domicilio">("taller");
  const [addressText, setAddressText] = useState("");
  const [references, setReferences] = useState("");
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "card">("cash");
  const [travelZone, setTravelZone] = useState<"near" | "mid" | "far" | "outside">("near");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [txnInfo, setTxnInfo] = useState<{ transactionId: string; authorizationCode: string; cardBrand: string } | null>(null);
  const [verifyingStripe, setVerifyingStripe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "fetching" | "success" | "error">("idle");
  const [bankInfo, setBankInfo] = useState<BankSettings>({
    bankName: "BBVA México",
    accountHolder: "Autovisión Premium S.A.",
    clabe: "0121 8000 1234 5678 90",
    accountNumber: "1234 5678 90"
  });

  const [uploadProgress, setUploadProgress] = useState(0);

  // Sync selectedServiceId if passed from Catalog
  useEffect(() => {
    if (selectedServiceId) {
      setServiceId(selectedServiceId);
    }
  }, [selectedServiceId]);

  // Load Bank settings on render
  useEffect(() => {
    getBankSettings().then(setBankInfo);
  }, []);

  // Verify secure Stripe transaction on mount if customer was redirected back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    const sessionId = params.get("session_id");

    if (paymentStatus === "success" && sessionId) {
      setVerifyingStripe(true);
      setError(null);
      
      fetch(`/api/pay/stripe-verify/${sessionId}`)
        .then((res) => res.json())
        .then(async (data) => {
          if (data.success && data.status === "paid") {
            // Retrieve pending appointment payload
            const saved = localStorage.getItem("pending_appointment");
            if (saved) {
              try {
                const apptData = JSON.parse(saved);
                
                // Finalize appointment creation in database with verified status (fallback only if not auto-created by backend/webhook)
                let apptId = data.appointmentId;
                if (!apptId) {
                  apptId = await createAppointment({
                    ...apptData,
                    paymentStatus: "paid"
                  });
                }

                setTxnInfo({
                  transactionId: data.paymentId || "STRIPE-" + sessionId.substring(0, 10).toUpperCase(),
                  authorizationCode: "BANCARIA-APROBADA",
                  cardBrand: "Visa / Mastercard / AMEX (Real)"
                });
                setSuccessId(apptId);
                localStorage.removeItem("pending_appointment");
              } catch (e) {
                console.error("Error creating appointment from stored metadata:", e);
                setError("Pago recibido con éxito, pero hubo un problema al registrar la cita automáticamente. Por favor envíanos un mensaje de WhatsApp para que la agendemos de inmediato.");
              }
            } else {
              setError("Tu pago con tarjeta fue verificado y aprobado con éxito por Stripe, pero la sesión local de tu cita expiró. No te preocupes, envíanos un WhatsApp para agendar tu servicio.");
            }
          } else {
            setError(data.message || "La transacción de tarjeta no pudo ser confirmada por Stripe. Por favor verifica con tu banco.");
          }
        })
        .catch((err) => {
          console.error("Stripe verification error:", err);
          setError("Ocurrió un error al verificar tu transacción segura. Por favor, recarga la página o contáctanos por WhatsApp.");
        })
        .finally(() => {
          setVerifyingStripe(false);
          // Clean the query parameters from the browser address bar for aesthetic perfection
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else if (paymentStatus === "cancelled") {
      setError("El proceso de pago seguro con tarjeta fue cancelado por el usuario.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Find active service object
  const selectedService = services.find((s) => s.id === serviceId);

  // Calculate fees
  const servicePrice = selectedService ? selectedService.priceFrom : 0;
  const travelFee = serviceType === "domicilio" 
    ? travelZone === "near" ? 100 
      : travelZone === "mid" ? 150 
      : travelZone === "far" ? 250 
      : 0 // outside will be dynamic/manual
    : 0;

  const total = servicePrice + travelFee;

  // Geolocation detector
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      alert("La geolocalización no está soportada por tu navegador.");
      return;
    }

    setLocationStatus("fetching");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus("success");
      },
      (err) => {
        console.error(err);
        setLocationStatus("error");
      }
    );
  };


  // Helpers to format card inputs
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.substring(0, 4);
    if (value.length > 2) {
      value = `${value.substring(0, 2)}/${value.substring(2)}`;
    }
    setCardExpiry(value);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.substring(0, 16);
    const blocks = [];
    for (let i = 0; i < value.length; i += 4) {
      blocks.push(value.substring(i, i + 4));
    }
    setCardNumber(blocks.join(" "));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.substring(0, 4);
    setCardCvv(value);
  };

  // Upload of receipt is now handled by ImageUploader component direct to setReceiptUrl

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !phone || !brand || !model || !year || !serviceId || !date || !time) {
      setError("Por favor completa todos los campos marcados con asterisco (*). El correo electrónico es requerido para enviarte tu recibo seguro.");
      return;
    }

    setLoading(true);
    setError(null);

    // If direct card payment, validate and call API first
    if (paymentMethod === "card") {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/pay/stripe-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName,
            customerEmail,
            phone,
            brand,
            model,
            year,
            serviceId,
            serviceName: selectedService ? selectedService.name : "Servicio Especial",
            serviceType,
            addressText: serviceType === "domicilio" ? addressText : "",
            references: serviceType === "domicilio" ? references : "",
            date,
            time,
            travelFee,
            servicePrice,
            amount: total,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No se pudo iniciar la transacción de Stripe.");
        }

        const checkoutUrl = data.url || data.checkoutUrl;
        const stripeSessionId = data.sessionId || data.id;

        if (checkoutUrl) {
          const pendingAppt = {
            customerName,
            customerEmail,
            phone,
            vehicle: `${brand} ${model} ${year}`,
            brand,
            model,
            year,
            serviceId,
            serviceName: selectedService ? selectedService.name : "Servicio Especial",
            serviceType,
            addressText: serviceType === "domicilio" ? addressText : "",
            references: serviceType === "domicilio" ? references : "",
            location,
            date,
            time,
            paymentMethod,
            paymentStatus: "pending",
            servicePrice,
            travelFee,
            total,
            receiptUrl: "",
            stripeSessionId,
          };
          localStorage.setItem("pending_appointment", JSON.stringify(pendingAppt));

          window.location.href = checkoutUrl;
          return;
        }
        
        throw new Error("Stripe no devolvió una URL de checkout.");
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al procesar el pago seguro de tu tarjeta.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const apptId = await createAppointment({
        customerName,
        phone,
        vehicle: `${brand} ${model} ${year}`,
        brand,
        model,
        year,
        serviceId,
        serviceName: selectedService ? selectedService.name : "Servicio Especial",
        serviceType,
        addressText: serviceType === "domicilio" ? addressText : "",
        references: serviceType === "domicilio" ? references : "",
        location,
        date,
        time,
        paymentMethod,
        paymentStatus: paymentMethod === "transfer" && receiptUrl ? "proof_sent" : "pending",
        servicePrice,
        travelFee,
        total,
        receiptUrl
      });

      setSuccessId(apptId);
    } catch (err: any) {
      console.error(err);
      setError("Hubo un problema al registrar tu cita. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppConfirmation = () => {
    const serviceName = selectedService ? selectedService.name : "Servicio";
    const vehicleText = `${brand} ${model} ${year}`;
    const text = encodeURIComponent(
      `Hola, quiero confirmar mi cita de Autovisión para el servicio: ${serviceName}, vehículo: ${vehicleText}, fecha: ${date}, hora: ${time}.`
    );
    // Dynamic WhatsApp url using standard Mexican number or placeholder
    window.open(`https://wa.me/526873675477?text=${text}`, "_blank");
  };

  // If verifying Stripe payment status
  if (verifyingStripe) {
    return (
      <div className="py-24 max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6 animate-pulse">
        <div className="inline-block relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl">🔒</span>
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">Conexión Bancaria Cifrada SSL</span>
          <h2 className="text-2xl font-black text-white uppercase italic">Verificando Pago Seguro con Stripe...</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Por favor, no cierres ni recargues esta página. Estamos comprobando tu transacción directamente con el procesador bancario para acreditar tu cita al instante.
          </p>
        </div>
      </div>
    );
  }

  // If appointment booked successfully
  if (successId) {
    return (
      <div className="py-12 max-w-2xl mx-auto px-4 sm:px-6">
        <div className="bg-[#12161D] border border-white/5 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/10 border border-blue-500/20">
            <CheckCircle className="h-10 w-10 text-blue-500" />
          </div>
          <div>
            <span className="font-mono text-xs text-blue-400 uppercase font-bold tracking-widest">Cita Registrada</span>
            <h2 className="text-3xl font-black text-white mt-1 uppercase italic">¡Todo Listo para tu Transformación!</h2>
            <p className="text-slate-400 text-sm mt-2">
              Tu cita se ha programado en nuestro sistema. El equipo de Autovisión te contactará por WhatsApp para afinar los detalles de llegada.
            </p>
          </div>

          {/* Ticket info card */}
          <div className="bg-[#0a0d14] rounded-2xl border border-white/5 p-5 text-left text-sm space-y-3 font-sans">
            <div className="flex justify-between border-b border-white/5 pb-2.5">
              <span className="text-slate-400 font-medium">Servicio:</span>
              <span className="text-white font-bold">{selectedService ? selectedService.name : "Personalización"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2.5">
              <span className="text-slate-400 font-medium">Vehículo:</span>
              <span className="text-white font-bold">{brand} {model} ({year})</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2.5">
              <span className="text-slate-400 font-medium">Fecha y Hora:</span>
              <span className="text-blue-400 font-bold">{date} a las {time} hs</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2.5">
              <span className="text-slate-400 font-medium">Tipo Atención:</span>
              <span className="text-white font-bold">{serviceType === "taller" ? "🏠 En Taller" : "📍 A Domicilio"}</span>
            </div>
            
            {serviceType === "domicilio" && addressText && (
              <div className="border-b border-white/5 pb-2.5 space-y-1">
                <span className="text-slate-400 font-medium">Dirección:</span>
                <p className="text-slate-300 text-xs leading-relaxed">{addressText}</p>
              </div>
            )}

            <div className="flex justify-between border-b border-white/5 pb-2.5">
              <span className="text-slate-400 font-medium">Método Pago:</span>
              <span className="text-white font-bold uppercase">
                {paymentMethod === "cash" 
                  ? "💵 Efectivo" 
                  : paymentMethod === "transfer" 
                    ? "🏦 Transferencia" 
                    : paymentMethod === "card" 
                      ? "💳 Tarjeta Bancaria (Online)" 
                      : "📱 Mercado Pago"}
              </span>
            </div>

            {paymentMethod === "card" && txnInfo && (
              <div className="border-b border-white/5 pb-2.5 space-y-2.5 pt-1">
                <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                  ✓ Recibo de Transacción Aprobada
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#0d1017] p-3 rounded-xl border border-white/5 text-slate-400">
                  <div>
                    <span className="text-[10px] text-slate-500 block">ID Transacción:</span>
                    <span className="text-white font-bold">{txnInfo.transactionId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Autorización:</span>
                    <span className="text-emerald-400 font-bold">{txnInfo.authorizationCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Franquicia:</span>
                    <span className="text-white font-bold uppercase">{txnInfo.cardBrand}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Estatus de Cita:</span>
                    <span className="text-blue-400 font-bold">PAGADA / CONFIRMADA</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between pt-2">
              <span className="text-slate-300 font-bold text-base">Total Cobrado:</span>
              <span className="text-emerald-400 font-extrabold text-lg">${total.toLocaleString("es-MX")} MXN</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-600/5 border border-blue-500/10 text-xs text-slate-400 leading-relaxed">
            * Para asegurar la confirmación inmediata en la agenda de Autovisión, haz clic abajo para enviar un mensaje directo de WhatsApp.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={sendWhatsAppConfirmation}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-black transition-all hover:scale-[1.02] cursor-pointer"
            >
              <MessageCircle className="h-5 w-5" />
              Confirmar por WhatsApp
            </button>
            <button
              onClick={() => {
                setSuccessId(null);
                setCustomerName("");
                setPhone("");
                setBrand("");
                setModel("");
                setYear("");
                setAddressText("");
                setReferences("");
                setLocation({ lat: null, lng: null });
                setDate("");
                setTime("");
                onClearSelectedService();
                setCurrentTab("inicio");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-white px-6 py-3.5 text-sm font-bold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-white uppercase italic">
          Agendar <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">Tu Cita</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
          Reserva un espacio en taller o solicita el servicio directamente en tu domicilio. Completa los campos y enviaremos la solicitud de inmediato.
        </p>
      </div>

      <div className="bg-[#12161D] rounded-3xl border border-white/5 p-6 md:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal info */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest border-b border-white/5 pb-1.5 flex items-center gap-1.5 font-bold">
              <Smartphone className="h-4 w-4" /> 1. Datos del Cliente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Manuel Rodríguez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="Ej. manuel@correo.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Teléfono Móvil (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 3312345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle & Service */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest border-b border-white/5 pb-1.5 font-bold">
              2. Vehículo y Servicio
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Marca *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mazda"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Modelo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mazda 3"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Año *</label>
                <input
                  type="number"
                  required
                  placeholder="Ej. 2019"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Servicio Seleccionado *</label>
              <select
                required
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Elige un Servicio del Catálogo --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - Desde ${s.priceFrom.toLocaleString("es-MX")} MXN
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Booking type & Date */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest border-b border-white/5 pb-1.5 flex items-center gap-1.5 font-bold">
              <Calendar className="h-4 w-4" /> 3. Programación y Lugar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Fecha Deseada *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Horario Deseado *</label>
                <select
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Elige una Hora --</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:30">10:30 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:30">01:30 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:30">04:30 PM</option>
                  <option value="18:00">06:00 PM</option>
                </select>
              </div>
            </div>

            {/* Attention Type Selection */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Tipo de Atención *</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setServiceType("taller")}
                  className={`py-3.5 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    serviceType === "taller"
                      ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5"
                      : "bg-[#0a0d14] border-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  🏠 En Taller (Sin Costo Extra)
                </button>
                <button
                  type="button"
                  onClick={() => setServiceType("domicilio")}
                  className={`py-3.5 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    serviceType === "domicilio"
                      ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5"
                      : "bg-[#0a0d14] border-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  📍 A Domicilio
                </button>
              </div>
            </div>

            {/* Extra domicilio fields */}
            {serviceType === "domicilio" && (
              <div className="bg-[#0a0d14] p-5 rounded-2xl border border-white/5 space-y-4 animate-fadeIn">
                <h4 className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold">Configurar Entrega a Domicilio</h4>
                
                {/* Geolocation trigger */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#12161D] border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-blue-500" />
                    <div>
                      <span className="text-xs font-bold text-white block">Compartir Ubicación por GPS</span>
                      <span className="text-[10px] text-slate-500">Autovisión llegará exactamente a donde estés.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      locationStatus === "success" 
                        ? "bg-emerald-950 border border-emerald-500/30 text-emerald-400"
                        : locationStatus === "fetching"
                          ? "bg-slate-800 text-slate-400"
                          : "bg-blue-600 text-white hover:scale-[1.02]"
                    }`}
                  >
                    {locationStatus === "idle" && "Detectar mi Ubicación"}
                    {locationStatus === "fetching" && "Localizando..."}
                    {locationStatus === "success" && "✓ Ubicación Guardada"}
                    {locationStatus === "error" && "Reintentar"}
                  </button>
                </div>

                {location.lat && (
                  <p className="text-[10px] text-emerald-400 font-mono">
                    Coordenadas capturadas: Lat {location.lat.toFixed(5)}, Lng {location.lng?.toFixed(5)}
                  </p>
                )}

                {/* Zona de traslado selector */}
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Zona de Traslado *</label>
                  <select
                    value={travelZone}
                    onChange={(e) => setTravelZone(e.target.value as any)}
                    className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="near">Zona Cercana - $100 MXN extra</option>
                    <option value="mid">Zona Media - $150 MXN extra</option>
                    <option value="far">Zona Lejana - $250 MXN extra</option>
                    <option value="outside">Fuera de la Ciudad - Cotización Manual con Autovisión</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Dirección de Envío *</label>
                    <input
                      type="text"
                      required={serviceType === "domicilio"}
                      placeholder="Calle, Número, Colonia, Municipio"
                      value={addressText}
                      onChange={(e) => setAddressText(e.target.value)}
                      className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Referencias de Ubicación</label>
                    <input
                      type="text"
                      placeholder="Entre qué calles, color de casa, etc."
                      value={references}
                      onChange={(e) => setReferences(e.target.value)}
                      className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Payment Method */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest border-b border-white/5 pb-1.5 flex items-center gap-1.5 font-bold">
              <CreditCard className="h-4 w-4" /> 4. Método de Pago
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === "cash"
                    ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5"
                    : "bg-[#0a0d14] border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Efectivo
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === "transfer"
                    ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5"
                    : "bg-[#0a0d14] border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Transferencia BBVA
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === "card"
                    ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5"
                    : "bg-[#0a0d14] border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                <CreditCard className="h-4 w-4 text-emerald-400" />
                Tarjeta (Stripe Seguro)
              </button>
            </div>

            {/* Cash text */}
            {paymentMethod === "cash" && (
              <p className="text-xs text-slate-500 bg-[#0a0d14] p-4 border border-white/5 rounded-xl leading-relaxed">
                * Pagas en efectivo al finalizar tu instalación en el taller o al terminar la visita de Autovisión a tu domicilio. Marcaremos el estatus de pago como "Pendiente".
              </p>
            )}

            {/* Transfer details */}
            {paymentMethod === "transfer" && (
              <div className="bg-[#0a0d14] p-5 rounded-2xl border border-white/5 space-y-4 animate-fadeIn">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Datos Bancarios BBVA</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#12161D] p-4 border border-white/5 rounded-xl font-mono">
                  <div>
                    <span className="text-slate-500 block">Banco:</span>
                    <span className="text-white font-bold">{bankInfo.bankName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Beneficiario:</span>
                    <span className="text-white font-bold">{bankInfo.accountHolder}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Número Cuenta:</span>
                    <span className="text-white font-bold">{bankInfo.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Clabe Interbancaria (CLABE):</span>
                    <span className="text-blue-400 font-bold">{bankInfo.clabe}</span>
                  </div>
                </div>

                {/* Upload proof of transfer */}
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Comprobante de Transferencia (Foto/Captura)</label>
                  <ImageUploader
                    folder="receipts"
                    initialImageUrl={receiptUrl}
                    onUploadComplete={(url) => setReceiptUrl(url)}
                    label="Cambiar comprobante"
                  />
                </div>
              </div>
            )}

            {/* Card Form */}
            {paymentMethod === "card" && (
              <div className="bg-[#0a0d14] p-5 rounded-2xl border border-white/5 space-y-5 animate-fadeIn">
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold block">Pago Directo Seguro con Tarjeta</span>
                
                {/* Visual Card Preview */}
                <div className="relative h-44 w-full rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between max-w-sm mx-auto">
                  {/* Decorative glowing gradient spheres */}
                  <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
                  <div className="absolute -left-12 -bottom-12 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
                  
                  {/* Top row */}
                  <div className="flex justify-between items-start z-10">
                    <div className="space-y-1">
                      <div className="text-[9px] font-mono tracking-widest text-blue-400 font-bold uppercase">Autovisión Premium</div>
                      <div className="h-7 w-10 bg-gradient-to-r from-amber-400 to-amber-200 rounded opacity-85 flex items-center justify-center overflow-hidden">
                        <div className="grid grid-cols-2 gap-0.5 w-6 h-4 opacity-50">
                          <div className="border border-black/30" />
                          <div className="border border-black/30" />
                          <div className="border border-black/30" />
                          <div className="border border-black/30" />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black italic tracking-wider text-white">
                        {cardNumber.startsWith("4") ? "VISA" : cardNumber.startsWith("5") ? "MASTERCARD" : cardNumber.startsWith("3") ? "AMEX" : "CARD"}
                      </span>
                      <div className="text-[7px] text-slate-500 font-mono mt-0.5">PLATINUM</div>
                    </div>
                  </div>

                  {/* Card number display */}
                  <div className="text-base sm:text-lg font-mono text-center tracking-[0.15em] font-medium text-white select-none my-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>

                  {/* Bottom row: Name & Expiry */}
                  <div className="flex justify-between items-end font-mono z-10">
                    <div className="text-left max-w-[70%]">
                      <span className="text-[7px] text-slate-500 block uppercase tracking-wider">Titular</span>
                      <span className="text-xs text-white uppercase font-bold tracking-wider truncate block">
                        {cardName || "NOMBRE TITULAR"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7px] text-slate-500 block uppercase tracking-wider">Vence</span>
                      <span className="text-xs text-white font-bold tracking-widest">
                        {cardExpiry || "MM/AA"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Nombre del Titular (Como aparece en la tarjeta) *</label>
                    <input
                      type="text"
                      placeholder="JUAN PEREZ GONZALEZ"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      className="w-full bg-[#0d1017] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2 text-sm text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Número de Tarjeta (16 dígitos) *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4152 3672 9012 3456"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full bg-[#0d1017] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2 pl-11 text-sm text-white font-mono"
                      />
                      <CreditCard className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Vencimiento (MM/AA) *</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="w-full bg-[#0d1017] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2 text-sm text-white font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">CVV *</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={handleCvvChange}
                        className="w-full bg-[#0d1017] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2 text-sm text-white font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-[10px] text-slate-400 bg-[#0d1017] p-3 border border-white/5 rounded-xl leading-relaxed">
                  <span className="text-emerald-400 text-sm">🔒</span>
                  <p>Conexión segura cifrada SSL de extremo a extremo. Los datos de tu tarjeta nunca se almacenan en texto plano y se procesan bajo altos estándares de seguridad bancaria.</p>
                </div>
              </div>
            )}

          </div>

          {/* Pricing summary */}
          {selectedService && (
            <div className="bg-[#0a0d14] p-4 rounded-2xl border border-white/5 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Servicio:</span>
                <span>${servicePrice.toLocaleString("es-MX")} MXN</span>
              </div>
              {serviceType === "domicilio" && (
                <div className="flex justify-between text-slate-400">
                  <span>Costo Traslado ({travelZone === "outside" ? "Fuera de Ciudad" : "En Ciudad"}):</span>
                  <span>{travelZone === "outside" ? "Cotización manual" : `$${travelFee} MXN`}</span>
                </div>
              )}
              <div className="border-t border-white/5 pt-2.5 flex justify-between font-bold text-white">
                <span className="text-sm">Total Estimado:</span>
                <span className="text-lg text-emerald-400">${total.toLocaleString("es-MX")} MXN</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando Reservación...
              </span>
            ) : (
              <>
                <Calendar className="h-5 w-5" />
                Confirmar y Registrar Cita
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
