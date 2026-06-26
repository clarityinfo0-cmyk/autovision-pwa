import React from "react";
import { Shield, Wrench, Sparkles, MessageCircle, Star, Image, Compass } from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

export default function Navbar({ currentTab, setCurrentTab, isAdmin, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#05070a]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div 
          className="flex cursor-pointer items-center space-x-2" 
          onClick={() => setCurrentTab("inicio")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black border border-white/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <span className="text-red-500 font-black italic text-lg tracking-tighter">AV</span>
          </div>
          <div className="flex flex-col justify-center -space-y-0.5">
            <span className="font-sans text-lg font-black tracking-tighter uppercase italic text-white leading-none">
              AUTO<span className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">VISIÓN</span>
            </span>
            <span className="text-[7px] font-mono tracking-wider text-slate-400 font-bold uppercase leading-none">
              ■ ■ ■ ■ ■ ■ | LED Y POLARIZADOS
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-4">
          <button
            onClick={() => setCurrentTab("inicio")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
              currentTab === "inicio" ? "text-blue-400 border-b-2 border-blue-500 rounded-none pb-1.5" : "text-gray-400 hover:text-white"
            }`}
          >
            <Compass className="h-4 w-4" />
            Inicio
          </button>
          <button
            onClick={() => setCurrentTab("servicios")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
              currentTab === "servicios" ? "text-blue-400 border-b-2 border-blue-500 rounded-none pb-1.5" : "text-gray-400 hover:text-white"
            }`}
          >
            <Star className="h-4 w-4" />
            Catálogo
          </button>
          <button
            onClick={() => setCurrentTab("asesor-ai")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all relative ${
              currentTab === "asesor-ai" ? "text-blue-400 border-b-2 border-blue-500 rounded-none pb-1.5" : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            Asesor AI
            <span className="absolute top-1 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </button>
          <button
            onClick={() => setCurrentTab("accesorio-especial")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
              currentTab === "accesorio-especial" ? "text-blue-400 border-b-2 border-blue-500 rounded-none pb-1.5" : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Cotizar Externo
          </button>
        </nav>

        {/* Admin and CTAs */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentTab("agendar")}
            className="hidden sm:inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-blue-500 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.98]"
          >
            Agendar Cita
          </button>
          
          <button
            onClick={() => setCurrentTab("admin")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all border ${
              currentTab === "admin" 
                ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]" 
                : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>{isAdmin ? "Panel" : "Admin"}</span>
          </button>

          {isAdmin && (
            <button
              onClick={onLogout}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-white/5 uppercase font-mono tracking-wider"
            >
              Salir
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#05070a]/95 backdrop-blur-md py-1.5 px-2 flex justify-around shadow-2xl">
        <button
          onClick={() => setCurrentTab("inicio")}
          className={`flex flex-col items-center p-1 text-xs transition-colors ${
            currentTab === "inicio" ? "text-blue-400" : "text-slate-400"
          }`}
        >
          <Compass className="h-5 w-5" />
          <span>Inicio</span>
        </button>
        <button
          onClick={() => setCurrentTab("servicios")}
          className={`flex flex-col items-center p-1 text-xs transition-colors ${
            currentTab === "servicios" ? "text-blue-400" : "text-slate-400"
          }`}
        >
          <Star className="h-5 w-5" />
          <span>Servicios</span>
        </button>
        <button
          onClick={() => setCurrentTab("asesor-ai")}
          className={`flex flex-col items-center p-1 text-xs transition-colors ${
            currentTab === "asesor-ai" ? "text-blue-400" : "text-slate-400"
          }`}
        >
          <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
          <span>Asesor AI</span>
        </button>
        <button
          onClick={() => setCurrentTab("accesorio-especial")}
          className={`flex flex-col items-center p-1 text-xs transition-colors ${
            currentTab === "accesorio-especial" ? "text-blue-400" : "text-slate-400"
          }`}
        >
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <span>Externos</span>
        </button>
        <button
          onClick={() => setCurrentTab("agendar")}
          className={`flex flex-col items-center p-1 text-xs transition-colors ${
            currentTab === "agendar" ? "text-blue-400" : "text-slate-400"
          }`}
        >
          <Wrench className="h-5 w-5 text-cyan-400" />
          <span>Cita</span>
        </button>
      </div>
    </header>
  );
}
