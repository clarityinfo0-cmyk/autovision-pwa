import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";
import Catalog from "./components/Catalog";
import AIAdvisor from "./components/AIAdvisor";
import CustomAccessoryQuote from "./components/CustomAccessoryQuote";
import Scheduler from "./components/Scheduler";
import AdminPanel from "./components/AdminPanel";
import NotificationAlerts from "./components/NotificationAlerts";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  seedInitialDataIfNeeded, 
  getServices, 
  subscribeGallery 
} from "./firebaseUtils";
import { Service, GalleryItem } from "./types";
import { Heart, MessageCircle } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("inicio");
  const [services, setServices] = useState<Service[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 1. Seed and Load Initial Services & Gallery
  useEffect(() => {
    async function initApp() {
      // Seed Firestore with beautiful default services and gallery if empty
      await seedInitialDataIfNeeded();
      
      // Fetch fresh services
      const srvList = await getServices();
      setServices(srvList);
    }
    initApp();

    // Subscribe to gallery updates
    const unsubGallery = subscribeGallery(setGallery);

    // Auth monitor
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setUserLoggedIn(!!user && (user.uid === "Deo4NaEV22cKLCIyexpK8u9UhTX2" || user.uid === "HHIdRIm7BPh2TTwum7hefVwoY4Z2"));
    });

    return () => {
      unsubGallery();
      unsubAuth();
    };
  }, [currentTab]);

  const isTechnician = currentUser?.uid === "HHIdRIm7BPh2TTwum7hefVwoY4Z2";

  // Bridge callback: client clicks "Agendar" inside a specific service card
  const handleSelectServiceAndBook = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setCurrentTab("agendar");
    
    // Smooth scroll to top of scheduler
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearSelectedService = () => {
    setSelectedServiceId("");
  };

  const handleLogout = () => {
    signOut(auth);
    setUserLoggedIn(false);
    setCurrentUser(null);
    setCurrentTab("inicio");
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-between text-slate-100">
      {/* Real-time floating notifications overlay for Admin and Technician */}
      <NotificationAlerts 
        userLoggedIn={userLoggedIn}
        isTechnician={isTechnician}
        setCurrentTab={setCurrentTab}
      />

      {/* Dynamic Header & Navigation */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        isAdmin={userLoggedIn}
        onLogout={handleLogout}
      />

      {/* Main Screen Router */}
      <main className="flex-grow">
        {currentTab === "inicio" && (
          <Landing 
            services={services} 
            gallery={gallery} 
            onSelectService={handleSelectServiceAndBook} 
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === "servicios" && (
          <Catalog 
            services={services} 
            onSelectService={handleSelectServiceAndBook}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === "asesor-ai" && (
          <AIAdvisor />
        )}

        {currentTab === "accesorio-especial" && (
          <CustomAccessoryQuote />
        )}

        {currentTab === "agendar" && (
          <Scheduler 
            services={services} 
            selectedServiceId={selectedServiceId}
            onClearSelectedService={handleClearSelectedService}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === "admin" && (
          <AdminPanel />
        )}
      </main>

      {/* Footer Element */}
      <footer className="border-t border-slate-900 bg-[#070b13] py-12 pb-24 md:pb-12 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand details */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black border border-white/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  <span className="text-red-500 font-black italic text-sm tracking-tighter">AV</span>
                </div>
                <div className="flex flex-col -space-y-1">
                  <span className="font-sans text-base font-black tracking-tighter uppercase italic text-white leading-none">
                    AUTO<span className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">VISIÓN</span>
                  </span>
                  <span className="text-[6px] font-mono tracking-wider text-slate-500 font-bold uppercase leading-none">
                    ■ ■ ■ ■ ■ ■ | LED Y POLARIZADOS
                  </span>
                </div>
              </div>
              <p className="text-slate-500 leading-relaxed max-w-xs">
                Taller líder en personalización, protección térmica 3M, sistemas LED integrados, audio de alta fidelidad y estética automotriz profesional.
              </p>
            </div>

            {/* Quick links */}
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Mapa del Sitio</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li><button onClick={() => setCurrentTab("inicio")} className="hover:text-blue-400 transition-colors">Inicio / Landing</button></li>
                <li><button onClick={() => setCurrentTab("servicios")} className="hover:text-blue-400 transition-colors">Catálogo de Servicios</button></li>
                <li><button onClick={() => setCurrentTab("asesor-ai")} className="hover:text-blue-400 transition-colors">Asesor de Mejoras AI</button></li>
                <li><button onClick={() => setCurrentTab("accesorio-especial")} className="hover:text-blue-400 transition-colors">Cotizar Accesorio Externo</button></li>
              </ul>
            </div>

            {/* Coverage details */}
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Atención y Cobertura</h4>
              <p className="text-slate-400 leading-relaxed">
                📍 Instalación física en taller principal o servicio a domicilio (cobertura en zona cercana, media, lejana con traslados preferenciales).
              </p>
              <p className="text-slate-500 font-mono">Lunes a Sábado: 9:00 AM - 7:00 PM</p>
            </div>

            {/* Dev details */}
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Canales de Contacto</h4>
              <p className="text-slate-400 leading-relaxed">
                Escríbenos directamente a WhatsApp para cotizaciones urgentes o asistencia inmediata.
              </p>
              <div className="pt-1.5">
                <a
                  href="https://wa.me/526873675477"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl font-bold hover:bg-emerald-950/70 transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                  Escribir a WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <span>© 2026 Autovisión Pro. Todos los derechos reservados.</span>
            <span className="flex items-center gap-1">
              Calidad premium garantizada por Autovisión <Heart className="h-3 w-3 text-cyan-400 fill-cyan-400" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
