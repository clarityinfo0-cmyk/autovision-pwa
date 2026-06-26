import React, { useState, useMemo } from "react";
import { Service } from "../types";
import { Star, Clock, Sparkles, Filter, Wrench, Flame } from "lucide-react";
import TintCalculator from "./TintCalculator";

interface CatalogProps {
  services: Service[];
  onSelectService: (serviceId: string) => void;
  setCurrentTab: (tab: string) => void;
}

const CATEGORIES = [
  "Todos",
  "Paquetes",
  "Polarizado 3M",
  "Luces LED",
  "Barras LED",
  "Sonido automotriz",
  "Pulido de faros",
  "Pulido de carrocería",
  "Accesorios",
  "Servicios especiales"
];

export default function Catalog({ services, onSelectService, setCurrentTab }: CatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesCategory = selectedCategory === "Todos" || service.category === selectedCategory;
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            service.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && service.active;
    });
  }, [services, selectedCategory, searchQuery]);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase italic">
          Nuestros <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">Servicios</span>
        </h1>
        <p className="mt-4 text-slate-400">
          Explora nuestro catálogo completo de modificaciones, protección y detallado automotriz premium. Adrián y su equipo garantizan la mejor calidad.
        </p>
      </div>

      {/* Search and Filters Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Filter Buttons */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 text-slate-400 font-mono text-xs uppercase tracking-wider border-b border-white/5 mb-2">
            <Filter className="h-3.5 w-3.5 text-blue-500" />
            Filtrar Categorías
          </div>
          
          <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-4 lg:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-250 shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20"
                    : "bg-[#12161D] border border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="hidden lg:block mt-8 p-5 rounded-2xl bg-gradient-to-b from-[#12161D] to-[#0A0D14] border border-white/5">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5 mb-2 uppercase italic">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" /> ¿Buscas algo personalizado?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Si buscas un accesorio de importación o una marca que no ves en el catálogo, podemos conseguirla. Usa nuestro cotizador externo de accesorios.
            </p>
            <button
              onClick={() => setCurrentTab("accesorio-especial")}
              className="mt-4 w-full text-center text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 py-2.5 rounded-full transition-colors cursor-pointer"
            >
              Pedir Cotización Externa
            </button>
          </div>
        </div>

        {/* Right Side: Search and Grid list */}
        <div className="lg:col-span-9 space-y-6">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar servicio (ej. Polarizado, LED, Bocinas...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#12161D] text-white border border-white/5 focus:border-blue-500 focus:outline-none rounded-2xl px-5 py-4 placeholder-slate-500 text-sm transition-all shadow-inner"
            />
          </div>

          {/* Interactive Tint/Polarizado Calculator */}
          {(selectedCategory === "Todos" || selectedCategory === "Polarizado 3M") && (
            <div className="transition-all duration-300">
              <TintCalculator onSelectAndBook={onSelectService} />
            </div>
          )}

          {/* Grid list of services */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
              <Wrench className="h-10 w-10 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No se encontraron servicios para esta categoría.</p>
              <p className="text-xs text-slate-500 mt-1">Prueba seleccionando "Todos" o buscando otro término.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredServices.map((service) => (
                <div 
                  key={service.id}
                  className="bg-[#12161D] rounded-2xl border border-white/5 overflow-hidden flex flex-col group transition-all hover:border-blue-500/50 hover:shadow-xl"
                >
                  {/* Service Image with category tag overlay */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={service.image || "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=600"} 
                      alt={service.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                    <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-white/5 text-blue-400 font-mono text-xs font-bold px-3 py-1 rounded-full uppercase">
                      {service.category}
                    </span>
                  </div>

                  {/* Service details */}
                  <div className="p-6 flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors uppercase italic">
                        {service.name}
                      </h3>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          {service.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-blue-500" />
                          Garantizado
                        </span>
                      </div>

                      <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    {/* Booking/Price Footer */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500">Precio de referencia</span>
                        <p className="text-xl font-extrabold text-emerald-400">
                          Desde ${service.priceFrom.toLocaleString("es-MX")} MXN
                        </p>
                      </div>

                      <button
                        onClick={() => onSelectService(service.id)}
                        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold text-white uppercase tracking-wider transition-all hover:bg-blue-500 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] active:scale-[0.98] cursor-pointer"
                      >
                        Agendar Cita
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
