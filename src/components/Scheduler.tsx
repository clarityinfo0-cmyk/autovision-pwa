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
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "mercadopago">("cash");
  const [travelZone, setTravelZone] = useState<"near" | "mid" | "far" | "outside">("near");
  const [receiptUrl, setReceiptUrl] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "fetching" | "success" | "error">("idle");
  const [bankInfo, setBankInfo] = useState<BankSettings>({
    bankName: "BBVA México",
    accountHolder: "Adrián Autovisión S.A.",
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


  // Upload of receipt is now handled by ImageUploader component direct to setReceiptUrl

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !brand || !model || !year || !serviceId || !date || !time) {
      setError("Por favor completa todos los campos marcados con asterisco (*).");
      return;
    }

    setLoading(true);
    setError(null);

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
              Tu cita se ha programado en nuestro sistema. Adrián te contactará por WhatsApp para afinar los detalles de llegada.
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
                {paymentMethod === "cash" ? "💵 Efectivo" : paymentMethod === "transfer" ? "🏦 Transferencia" : "💳 Mercado Pago"}
              </span>
            </div>
            
            <div className="flex justify-between pt-2">
              <span className="text-slate-300 font-bold text-base">Total Estimado:</span>
              <span className="text-emerald-400 font-extrabold text-lg">${total.toLocaleString("es-MX")} MXN</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-600/5 border border-blue-500/10 text-xs text-slate-400 leading-relaxed">
            * Para asegurar la confirmación inmediata en la agenda de Adrián, haz clic abajo para enviar un mensaje directo de WhatsApp.
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <span className="text-[10px] text-slate-500">Adrián llegará exactamente a donde estés.</span>
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
                    <option value="outside">Fuera de la Ciudad - Cotización Manual con Adrián</option>
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

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`py-3 px-2 sm:px-4 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
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
                className={`py-3 px-2 sm:px-4 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === "transfer"
                    ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5"
                    : "bg-[#0a0d14] border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Transferencia
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("mercadopago")}
                className={`py-3 px-2 sm:px-4 rounded-xl border text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === "mercadopago"
                    ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5"
                    : "bg-[#0a0d14] border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                Mercado Pago
              </button>
            </div>

            {/* Cash text */}
            {paymentMethod === "cash" && (
              <p className="text-xs text-slate-500 bg-[#0a0d14] p-4 border border-white/5 rounded-xl leading-relaxed">
                * Pagas en efectivo al finalizar tu instalación en el taller o al terminar la visita de Adrián a tu domicilio. Marcaremos el estatus de pago como "Pendiente".
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

            {/* Mercado Pago text */}
            {paymentMethod === "mercadopago" && (
              <p className="text-xs text-slate-500 bg-[#0a0d14] p-4 border border-white/5 rounded-xl leading-relaxed">
                * Preparamos el link manual de pago seguro de Mercado Pago. Te llegará directamente al confirmar tu cita con Adrián por WhatsApp para realizar el pago de forma segura en línea.
              </p>
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
