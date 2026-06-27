import React, { useState } from "react";
import { Service, GalleryItem } from "../types";
import { motion } from "motion/react";
import { 
  Sparkles, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Smartphone, 
  MessageSquare,
  ArrowUpRight,
  Eye,
  Gift
} from "lucide-react";
import TintCalculator from "./TintCalculator";

interface LandingProps {
  services: Service[];
  gallery: GalleryItem[];
  onSelectService: (serviceId: string) => void;
  setCurrentTab: (tab: string) => void;
}

export default function Landing({ services, gallery, onSelectService, setCurrentTab }: LandingProps) {
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  // Filter 3 active high-demand services for featured section
  const featuredServices = services.slice(0, 3);

  // WhatsApp connection
  const openWhatsAppGeneral = () => {
    const text = encodeURIComponent("Hola Autovisión, me interesa conocer más sobre sus servicios de personalización automotriz.");
    window.open(`https://wa.me/526873675477?text=${text}`, "_blank");
  };

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 py-20 flex flex-col items-center justify-center text-center overflow-hidden min-h-[75vh]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 uppercase tracking-widest font-bold mb-6 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Taller Automotriz Premium
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight uppercase italic max-w-5xl leading-none text-white"
          >
            Personaliza, protege<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              y mejora tu vehículo
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-gray-400 text-lg font-medium leading-relaxed"
          >
            Especialistas en polarizado de alta gama, luces LED de alto rendimiento, sistemas de audio premium, pulido profesional y servicios a domicilio. Dale a tu auto el trato que se merece.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => setCurrentTab("agendar")}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              Agendar cita ahora
              <ChevronRight className="h-5 w-5" />
            </button>
            
            <button
              onClick={openWhatsAppGeneral}
              className="w-full sm:w-auto px-8 py-4 bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/30 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
            >
              <Smartphone className="h-5 w-5" />
              Contacto por WhatsApp
            </button>
          </motion.div>
        </div>
      </section>

      {/* Benefits Bento Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Large Feature Block */}
          <div className="md:col-span-3 bg-[#12161D] border border-white/5 p-8 rounded-3xl flex flex-col justify-between gap-12 relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.05),transparent_50%)]" />
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold">Servicio Flexible</span>
                <h3 className="text-2xl font-bold mt-2 text-white uppercase italic">¿No tienes tiempo? Vamos a tu domicilio</h3>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xl">
                  Realizamos instalaciones de polarizado, cambio de luces LED, audio y accesorios en la comodidad de tu hogar u oficina con costos de traslado transparentes según tu zona.
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
            <div className="flex gap-6 z-10">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Cobertura Local
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Ahorro de Tiempo
              </div>
            </div>
          </div>

          {/* Small Feature Block */}
          <div className="md:col-span-2 bg-[#12161D] border border-white/5 p-8 rounded-3xl flex flex-col justify-between gap-8 relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold">Garantía Asegurada</span>
                <h3 className="text-xl font-bold mt-2 text-white uppercase italic">Instalación Profesional</h3>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                  Utilizamos consumibles de la más alta calidad y herramientas de precisión para proteger los paneles y cableado original de tu vehículo.
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 100% Satisfacción
            </div>
          </div>

          {/* Small Feature Block 2 */}
          <div className="md:col-span-2 bg-[#12161D] border border-white/5 p-8 rounded-3xl flex flex-col justify-between gap-8 relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold">Facilidades</span>
                <h3 className="text-xl font-bold mt-2 text-white uppercase italic">Pagos Flexibles</h3>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                  Aceptamos efectivo al terminar, transferencia SPEI directa o pago seguro con tarjeta mediante Mercado Pago.
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="flex gap-4 text-xs font-mono text-gray-500">
              <span>💳 Tarjeta</span>
              <span>💵 Efectivo</span>
              <span>📱 SPEI</span>
            </div>
          </div>

          {/* Large Feature Block 2 */}
          <div className="md:col-span-3 bg-[#12161D] border border-white/5 p-8 rounded-3xl flex flex-col justify-between gap-12 relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.05),transparent_50%)]" />
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold">Atención Inmediata</span>
                <h3 className="text-2xl font-bold mt-2 text-white uppercase italic">Soporte Directo vía WhatsApp</h3>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xl">
                  ¿Tienes dudas sobre compatibilidad o accesorios especiales? Envíanos un mensaje rápido por WhatsApp y nuestro equipo técnico de Autovisión te asesorará personalmente en minutos.
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <div className="z-10">
              <button 
                onClick={openWhatsAppGeneral}
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Preguntar ahora <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 bg-[#090d16] border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10">
            <div>
              <h2 className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold">Servicios Destacados</h2>
              <p className="text-3xl font-black text-white mt-1 uppercase italic">Especialidades que transforman tu coche</p>
            </div>
            <button 
              onClick={() => setCurrentTab("servicios")}
              className="mt-4 md:mt-0 text-blue-400 hover:text-blue-300 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              Ver todo el catálogo <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredServices.map((service) => (
              <div 
                key={service.id} 
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#12161D] border border-white/5 transition-all hover:border-blue-500/50 hover:shadow-xl"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-400">
                    {service.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors uppercase italic">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400 flex-1 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <span className="text-xs text-slate-500">Precio desde</span>
                      <p className="text-lg font-extrabold text-emerald-400">${service.priceFrom.toLocaleString("es-MX")} MXN</p>
                    </div>
                    <button
                      onClick={() => onSelectService(service.id)}
                      className="inline-flex h-9 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500 font-bold text-xs px-4 transition-colors cursor-pointer"
                    >
                      Cotizar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages & Promotions Section */}
      <section className="py-20 bg-gradient-to-b from-[#0b0f19] to-[#070b13] border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 uppercase tracking-wider mb-3">
              <Gift className="h-3.5 w-3.5" /> Promociones Activas
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase italic leading-none">
              Paquetes <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">Exclusivos Autovisión</span>
            </h2>
            <p className="mt-4 text-slate-400 text-sm">
              Aprovecha estos combos especiales diseñados por Autovisión para darte el máximo valor y equipamiento premium para tu auto. ¡Con obsequios incluidos y garantía garantizada!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Promo Card 1: Paquete Visión Completa */}
            <div className="bg-gradient-to-br from-[#161c28] to-[#111621] rounded-3xl border-2 border-red-500/30 overflow-hidden relative group hover:border-red-500/60 transition-all duration-300 shadow-2xl shadow-black/60 flex flex-col justify-between">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full shadow-lg z-10 animate-bounce">
                ¡AROMATIZANTE GRATIS!
              </div>
              
              <div className="p-8 pb-4">
                <span className="text-xs font-mono text-red-400 uppercase tracking-widest font-bold">Combo Más Solicitado</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-2 uppercase italic leading-tight group-hover:text-red-400 transition-colors">
                  Paquete Visión Completa
                </h3>
                <p className="text-slate-400 mt-3 text-sm leading-relaxed">
                  ¿Quieres mejorar tu visibilidad de noche y proteger tu privacidad e interior del sol? Este paquete lo tiene todo. Incluye la instalación completa de focos LED de alta potencia más el polarizado de tu preferencia.
                </p>

                {/* Included Perks List */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Focos LED Premium 12,000 LM</h4>
                      <p className="text-xs text-slate-400">Instalación y ajuste perfecto en faros principales.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Polarizado a Elección</h4>
                      <p className="text-xs text-slate-400">Privacidad premium y gran rechazo de calor.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 p-3 rounded-2xl">
                    <Gift className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-400 uppercase">¡OBSEQUIO GRATIS! Aromatizante Premium</h4>
                      <p className="text-xs text-red-300/80">Un agradable aroma premium para estrenar tu renovación automotriz.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-8 pt-4 border-t border-white/5 bg-[#0e121b] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-mono">Precio Especial Todo Incluido</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-400">Desde $2,100</span>
                    <span className="text-xs text-slate-500 font-mono">MXN</span>
                    <span className="text-xs text-slate-500 line-through font-mono">$2,450</span>
                  </div>
                </div>
                
                <button
                  onClick={() => onSelectService("paquete-vision-luces-polarizado")}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider px-6 py-4 transition-all duration-200 active:scale-95 shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  Agendar Paquete Visión
                </button>
              </div>
            </div>

            {/* Promo Card 2: Kit Master Luces LED Autovisión */}
            <div className="bg-gradient-to-br from-[#161c28] to-[#111621] rounded-3xl border-2 border-blue-500/30 overflow-hidden relative group hover:border-blue-500/60 transition-all duration-300 shadow-2xl shadow-black/60 flex flex-col justify-between">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full shadow-lg z-10 animate-bounce">
                ¡PULIDO DE FAROS GRATIS!
              </div>

              <div className="p-8 pb-4">
                <span className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold">Máximo Rendimiento de Luz</span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-2 uppercase italic leading-tight group-hover:text-blue-400 transition-colors">
                  Kit Master Luces LED Autovisión
                </h3>
                <p className="text-slate-400 mt-3 text-sm leading-relaxed">
                  ¿Tus faros lucen opacos y la iluminación nocturna de tu coche es deficiente? Con la compra del Kit Master LED Autovisión definitivo, transformaremos totalmente tu visibilidad nocturna.
                </p>

                {/* Included Perks List */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Kit Completo LED (Bajas + Altas + Niebla)</h4>
                      <p className="text-xs text-slate-400">Instalación completa de focos LED de alta potencia en las tres posiciones.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Haz de Luz Alineado de Precisión</h4>
                      <p className="text-xs text-slate-400">Garantiza un corte limpio para iluminar el camino sin encandilar.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl">
                    <Gift className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-400 uppercase">¡OBSEQUIO GRATIS! Pulido de Unidades</h4>
                      <p className="text-xs text-blue-300/80">Restauración y pulido profesional de tus faros con polímero vaporizado de larga duración (Ahorras $450).</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-8 pt-4 border-t border-white/5 bg-[#0e121b] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-mono">Precio Especial Todo Incluido</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-400">Desde $1,950</span>
                    <span className="text-xs text-slate-500 font-mono">MXN</span>
                    <span className="text-xs text-slate-500 line-through font-mono">$2,400</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectService("luces-led-kit-master-pulido")}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider px-6 py-4 transition-all duration-200 active:scale-95 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Agendar Kit Master
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before & After Gallery Showcase */}
      {gallery.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold">Galería de Resultados</h2>
            <p className="text-3xl font-black text-white mt-1 uppercase italic">Antes y Después</p>
            <p className="text-slate-400 text-sm mt-2">Observa el nivel de detalle y precisión en los trabajos terminados por Autovisión.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Gallery Navigation Sidebar */}
            <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-none">
              {gallery.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setActiveGalleryIndex(idx)}
                  className={`text-left p-4 rounded-xl transition-all border shrink-0 w-64 lg:w-full cursor-pointer ${
                    activeGalleryIndex === idx 
                      ? "bg-blue-600/10 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.15)]" 
                      : "bg-[#12161D] border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <span className="text-xs font-mono text-blue-400 tracking-wider uppercase block mb-1">
                    {item.category || "Detallado"}
                  </span>
                  <p className="font-bold text-sm line-clamp-1">{item.title}</p>
                </button>
              ))}
            </div>

            {/* Split view comparison card */}
            <div className="lg:col-span-8">
              <div className="bg-[#12161D] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative h-64 md:h-80 border-r border-white/5">
                    <img 
                      src={gallery[activeGalleryIndex].imageUrlBefore} 
                      alt="Antes" 
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-4 left-4 bg-red-600/95 text-white font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">
                      Antes
                    </span>
                  </div>
                  <div className="relative h-64 md:h-80">
                    <img 
                      src={gallery[activeGalleryIndex].imageUrlAfter} 
                      alt="Después" 
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-4 left-4 bg-emerald-500/95 text-black font-mono text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded">
                      Después
                    </span>
                  </div>
                </div>
                <div className="p-6 bg-[#0a0d14]">
                  <h4 className="text-lg font-bold text-white uppercase italic">{gallery[activeGalleryIndex].title}</h4>
                  <p className="text-slate-400 text-sm mt-1">{gallery[activeGalleryIndex].description}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Tint Calculator */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TintCalculator onSelectAndBook={(serviceId, notes) => onSelectService(serviceId)} />
      </section>

      {/* Interactive AI Callout Box */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#0a0d14] border-2 border-blue-500/30 p-8 md:p-12 shadow-[0_0_30px_rgba(0,194,255,0.1)]">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold uppercase tracking-widest text-blue-400 mb-6">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Inteligencia Artificial
            </div>
            <h3 className="text-2xl md:text-4xl font-black text-white uppercase italic leading-tight">
              ¿No estás seguro de qué mejoras le quedan mejor a tu vehículo?
            </h3>
            <p className="text-slate-300 mt-4 text-base leading-relaxed">
              Prueba nuestro **Asesor AI de Autovisión** entrenado con recomendaciones de accesorios premium. Ingresa tu marca, modelo y año, y obtén consejos técnicos personalizados sobre sonido, iluminación, polarizados y estilo.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => setCurrentTab("asesor-ai")}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all cursor-pointer active:scale-95"
              >
                Consultar Asesor AI gratis
                <ArrowUpRight className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setCurrentTab("accesorio-especial")}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full font-bold transition-all cursor-pointer active:scale-95"
              >
                ¿Quieres una pieza que no está listada? Cotizar accesorio externo
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
