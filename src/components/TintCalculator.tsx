import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Shield, Eye, Flame, Smartphone, ChevronRight, HelpCircle } from "lucide-react";

interface TintCalculatorProps {
  onSelectAndBook?: (serviceId: string, customNotes?: string) => void;
}

export default function TintCalculator({ onSelectAndBook }: TintCalculatorProps) {
  // Vehicle sizes & packages based on the user's exact price banner
  const vehicleTypes = [
    {
      id: "auto-chico",
      name: "Auto Chico",
      examples: "Spark, March, Swift, Ibiza, Aveo, etc.",
      traditionalPrice: 700,
      ceramicPrice: 3200,
      icon: "🚗",
    },
    {
      id: "auto-grande",
      name: "Auto Grande / SUV",
      examples: "Jetta, Civic, Corolla, Mazda 3, CR-V, Tucson, etc.",
      traditionalPrice: 800,
      ceramicPrice: 4000,
      icon: "🚘",
    },
    {
      id: "pickup-chica",
      name: "Pickup Chica",
      examples: "Saveiro, Tornado, Strada, RAM 700 (Cabina Regular), etc.",
      traditionalPrice: 500,
      ceramicPrice: 1600, // Estimated value from user request
      isEstimated: true,
      icon: "🛻",
    },
    {
      id: "pickup-grande",
      name: "Pickup Grande / Doble Cabina",
      examples: "Hilux, Lobo, NP300, Ranger, Cheyenne, etc.",
      traditionalPrice: 600,
      ceramicPrice: 2000,
      icon: "🚚",
    },
    {
      id: "cristal-frontal",
      name: "Solo Cristal Frontal (Parabrisas)",
      examples: "Aplica para cualquier tipo de vehículo.",
      traditionalPrice: 300,
      ceramicPrice: 1300,
      icon: "🛡️",
    },
  ];

  const tintShades = [
    { level: "5%", name: "Limo / Muy Oscuro", privacy: "Excelente (Máxima privacidad)", visibility: "Media de noche", desc: "Bloquea casi toda la visibilidad hacia el interior." },
    { level: "20%", name: "Oscuro / Estándar", privacy: "Muy Buena (Recomendado)", visibility: "Buena", desc: "El tono más popular. Excelente balance entre privacidad y visibilidad." },
    { level: "35%", name: "Medio / Intermedio", privacy: "Buena privacidad", visibility: "Excelente", desc: "Permite ver siluetas sutiles desde afuera. Muy cómodo de noche." },
    { level: "50%", name: "Claro / Ultra-Sutil", privacy: "Baja (Solo protección solar)", visibility: "Perfecta", desc: "Ideal si buscas protección térmica sin oscurecer tu auto." },
  ];

  const [selectedType, setSelectedType] = useState(vehicleTypes[0]);
  const [isCeramic, setIsCeramic] = useState(true); // Default to premium ceramic
  const [selectedShade, setSelectedShade] = useState(tintShades[1]); // Default to 20%
  const [includeFrontWindshield, setIncludeFrontWindshield] = useState(false);

  // Calculate price dynamically
  const basePrice = isCeramic ? selectedType.ceramicPrice : selectedType.traditionalPrice;
  
  // Front windshield add-on calculation
  // (If they are calculating "Solo Cristal Frontal", no need to double add)
  const windshieldAddonPrice = selectedType.id !== "cristal-frontal" && includeFrontWindshield
    ? (isCeramic ? 1300 : 300)
    : 0;

  const totalPrice = basePrice + windshieldAddonPrice;

  const handleWhatsAppInquiry = () => {
    const techType = isCeramic ? "Cerámico de Nano-Tecnología" : "Polarizado Convencional de Privacidad";
    const shadeText = `${selectedShade.level} (${selectedShade.name})`;
    const frontText = includeFrontWindshield ? "SÍ (Incluye Cristal Frontal)" : "NO (Solo vidrios laterales y trasero)";
    
    const message = `Hola Autovisión, me interesa cotizar/instalar un polarizado. Aquí los detalles de mi cotización de la app:\n\n` +
      `*Servicio:* ${techType}\n` +
      `*Vehículo:* ${selectedType.name} (${selectedType.examples})\n` +
      `*Tono sugerido:* ${shadeText}\n` +
      `*Agregar Parabrisas:* ${frontText}\n` +
      `*Precio total estimado:* $${totalPrice.toLocaleString("es-MX")} MXN\n\n` +
      `¿Tienen disponibilidad esta semana?`;
      
    window.open(`https://wa.me/526873675477?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleScheduleAction = () => {
    if (onSelectAndBook) {
      const techType = isCeramic ? "Cerámico" : "Polarizado Tradicional";
      const notes = `Cotización desde calculadora: Polarizado ${techType} para ${selectedType.name} con tono ${selectedShade.level}. Parabrisas: ${includeFrontWindshield ? "Sí" : "No"}. Total: $${totalPrice} MXN`;
      
      // Determine matching service ID
      const targetServiceId = isCeramic ? "polarizado-3m-crystalline" : "polarizado-3m-colorstable";
      onSelectAndBook(targetServiceId, notes);
    }
  };

  return (
    <div id="calculadora-polarizados" className="bg-[#12161D] rounded-3xl border border-white/5 p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative radial glows */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 pb-6 mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-xs font-bold uppercase tracking-widest mb-2.5">
            <Sparkles className="h-3.5 w-3.5" /> Cotizador Oficial Autovisión
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic leading-none">
            Calculadora de Polarizados
          </h3>
          <p className="text-slate-400 text-xs mt-2 max-w-xl">
            Selecciona el tipo de vehículo, la tecnología de la película y el nivel de tono para obtener tu presupuesto instantáneo basado en nuestra manta de precios oficial.
          </p>
        </div>

        {/* Dual Tab for Film Type */}
        <div className="flex bg-[#0a0d14] p-1 rounded-full border border-white/5 shrink-0 self-stretch md:self-auto">
          <button
            onClick={() => setIsCeramic(false)}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              !isCeramic
                ? "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Convencionales
          </button>
          <button
            onClick={() => setIsCeramic(true)}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isCeramic
                ? "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Cerámicos Premium
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step-by-Step Options Left Side */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Vehicle Size Selection */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
              1. Selecciona el Tipo de Vehículo
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vehicleTypes.map((type) => {
                const isSelected = selectedType.id === type.id;
                const price = isCeramic ? type.ceramicPrice : type.traditionalPrice;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type);
                      // If user selects "Solo Cristal Frontal", disable windshield add-on option automatically
                      if (type.id === "cristal-frontal") {
                        setIncludeFrontWindshield(false);
                      }
                    }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-white"
                        : "bg-[#0a0d14] border-white/5 hover:border-white/10 text-slate-300"
                    }`}
                  >
                    <span className="text-2xl mt-1">{type.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm truncate">{type.name}</span>
                        {type.isEstimated && isCeramic && (
                          <span className="bg-amber-500/10 text-amber-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                            Estimado
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{type.examples}</p>
                      <div className="mt-2 text-emerald-400 font-extrabold text-sm">
                        ${price.toLocaleString("es-MX")} MXN
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Shade Visual Simulator */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
              2. Nivel de Tono / Oscuridad Sugerido
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {tintShades.map((shade) => {
                const isSelected = selectedShade.level === shade.level;
                return (
                  <button
                    key={shade.level}
                    onClick={() => setSelectedShade(shade)}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-red-500/10 border-red-500 text-white"
                        : "bg-[#0a0d14] border-white/5 hover:border-white/10 text-slate-400"
                    }`}
                  >
                    {/* Simulated window opacity box */}
                    <div className="w-12 h-8 rounded-lg relative overflow-hidden bg-slate-800 mb-2 border border-white/10 flex items-center justify-center">
                      {/* Tint overlay layer */}
                      <div 
                        className="absolute inset-0 bg-black transition-all" 
                        style={{
                          opacity: 
                            shade.level === "5%" ? 0.95 : 
                            shade.level === "20%" ? 0.80 : 
                            shade.level === "35%" ? 0.65 : 0.50
                        }} 
                      />
                      <span className="relative z-10 font-mono text-xs font-extrabold text-white">
                        {shade.level}
                      </span>
                    </div>
                    <span className="font-bold text-xs">{shade.name}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Shade info alert */}
            <div className="mt-3 bg-[#0a0d14] border border-white/5 p-3 rounded-xl flex items-start gap-2.5">
              <Eye className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold text-white uppercase tracking-wide">Tono {selectedShade.level}: </span>
                {selectedShade.desc} <strong className="text-red-400 font-semibold">Privacidad: {selectedShade.privacy}.</strong>
              </div>
            </div>
          </div>

          {/* Step 3: Windshield Add-on Toggle */}
          {selectedType.id !== "cristal-frontal" && (
            <div className="bg-[#0a0d14] border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-white block">¿Deseas agregar el Parabrisas (Cristal Frontal)?</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Protege tus ojos y el tablero del calor directo del sol. Se instala con película especial transparente o muy sutil.
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="font-mono text-sm font-black text-emerald-400">
                  +${(isCeramic ? 1300 : 300).toLocaleString("es-MX")} MXN
                </span>
                <button
                  type="button"
                  onClick={() => setIncludeFrontWindshield(!includeFrontWindshield)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    includeFrontWindshield ? "bg-red-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      includeFrontWindshield ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Live Bill Card & Visualizer Right Side */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="bg-[#0a0d14] border border-white/5 rounded-3xl p-6 space-y-6 flex-1 flex flex-col justify-between">
            <div>
              {/* Technology details card */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="font-mono text-[10px] text-red-500 uppercase tracking-widest font-bold">
                  Resumen de Cotización
                </span>
                <span className="text-[10px] text-slate-500 font-mono uppercase">
                  Código: TINT-{(isCeramic ? "CER" : "CON")}-{selectedType.id}
                </span>
              </div>

              {/* Dynamic Vehicle Silhouette Tint Simulation preview */}
              <div className="my-5 p-4 rounded-2xl bg-[#12161D] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-wider">Simulador de Tono Estético</div>
                
                {/* SVG Car Side View with dynamic glass opacity */}
                <div className="w-full max-w-[240px] h-24 relative flex items-center justify-center my-1">
                  <svg viewBox="0 0 100 40" className="w-full h-full text-slate-700 fill-current">
                    {/* Car Body base outline */}
                    <path d="M 8 28 L 10 18 Q 12 14 20 12 L 40 8 Q 50 8 58 14 L 75 16 L 86 18 Q 92 20 94 28 L 94 32 L 6 32 Z" className="text-slate-800" />
                    
                    {/* Windshield (Front glass) */}
                    <path 
                      d="M 56 13 L 42 9 L 41 11 L 53 14 Z" 
                      className="transition-all duration-300" 
                      style={{ 
                        fill: includeFrontWindshield || selectedType.id === "cristal-frontal" ? "#000000" : "#a5f3fc",
                        fillOpacity: selectedType.id === "cristal-frontal" 
                          ? (isCeramic ? 0.7 : 0.5)
                          : (includeFrontWindshield ? (isCeramic ? 0.65 : 0.45) : 0.2)
                      }} 
                    />

                    {/* Side Windows (Front & Back) */}
                    <path 
                      d="M 23 13 L 38 10 L 38 18 L 21 18 Z" 
                      className="transition-all duration-300"
                      style={{ 
                        fill: selectedType.id === "cristal-frontal" ? "#a5f3fc" : "#000000",
                        fillOpacity: selectedType.id === "cristal-frontal" 
                          ? 0.2
                          : (selectedShade.level === "5%" ? 0.95 : 
                             selectedShade.level === "20%" ? 0.82 : 
                             selectedShade.level === "35%" ? 0.65 : 0.45)
                      }} 
                    />
                    <path 
                      d="M 12 15 L 20 13 L 20 18 L 11 18 Z" 
                      className="transition-all duration-300"
                      style={{ 
                        fill: selectedType.id === "cristal-frontal" ? "#a5f3fc" : "#000000",
                        fillOpacity: selectedType.id === "cristal-frontal" 
                          ? 0.2
                          : (selectedShade.level === "5%" ? 0.95 : 
                             selectedShade.level === "20%" ? 0.82 : 
                             selectedShade.level === "35%" ? 0.65 : 0.45)
                      }} 
                    />

                    {/* Wheels */}
                    <circle cx="24" cy="30" r="5.5" className="text-black" />
                    <circle cx="24" cy="30" r="2" className="text-slate-500" />
                    <circle cx="76" cy="30" r="5.5" className="text-black" />
                    <circle cx="76" cy="30" r="2" className="text-slate-500" />
                    
                    {/* Details */}
                    <line x1="6" y1="28" x2="94" y2="28" className="text-slate-600 stroke-[0.5]" />
                  </svg>
                </div>

                <div className="text-center mt-2">
                  <span className="text-xs font-extrabold text-white uppercase italic">
                    {isCeramic ? "Película Cerámica Premium" : "Polarizado Tradicional"}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Tono Seleccionado: <strong className="text-red-400 font-semibold">{selectedShade.level}</strong> | Parabrisas: {includeFrontWindshield || selectedType.id === "cristal-frontal" ? "Sí" : "No"}
                  </div>
                </div>
              </div>

              {/* Items Breakdown list */}
              <div className="space-y-3 mt-4 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Película ({isCeramic ? "Cerámica" : "Convencional"}) - {selectedType.name}</span>
                  <span className="font-mono font-bold text-white">${basePrice.toLocaleString("es-MX")}</span>
                </div>
                
                {windshieldAddonPrice > 0 && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Adicional: Cristal Frontal / Parabrisas</span>
                    <span className="font-mono font-bold text-white">+${windshieldAddonPrice.toLocaleString("es-MX")}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-400">
                  <span>Instalación profesional con Autovisión</span>
                  <span className="text-emerald-400 font-bold uppercase text-[9px] px-1.5 py-0.5 bg-emerald-500/10 rounded">¡Incluida!</span>
                </div>

                {isCeramic ? (
                  <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/10 space-y-1 mt-2">
                    <div className="flex items-center gap-1.5 font-bold text-red-500 text-[11px] uppercase tracking-wider">
                      <Flame className="h-3.5 w-3.5 animate-pulse" /> Beneficios del Cerámico
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Rechaza hasta un 90% de calor infrarrojo (radiación térmica) manteniendo la cabina fresca, además de filtrar 99% de rayos UV dañinos. Garantizado de por vida.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5 space-y-1 mt-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                      <Shield className="h-3.5 w-3.5" /> Beneficios del Tradicional
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Proporciona excelente privacidad y protección estética básica. El pegamento de alta calidad garantiza que la película no se levantará ni se agrietará.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Total Price Section */}
            <div className="border-t border-white/5 pt-5 mt-6 space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-mono block">Presupuesto Estimado</span>
                  <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                    ${totalPrice.toLocaleString("es-MX")} <span className="text-xs font-bold text-slate-400 font-sans">MXN</span>
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 text-right leading-none max-w-[120px]">
                  *Precios basados en manta oficial. IVA incluido.
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  onClick={handleWhatsAppInquiry}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20ba56] text-black text-xs font-extrabold uppercase tracking-wider py-3.5 transition-all active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(37,211,102,0.3)]"
                >
                  <Smartphone className="h-4 w-4" />
                  Consultar / Enviar a Autovisión
                </button>
                
                {onSelectAndBook && (
                  <button
                    onClick={handleScheduleAction}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-slate-300 text-xs font-bold py-3 transition-all active:scale-95 cursor-pointer"
                  >
                    Agendar Cita Directa
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
