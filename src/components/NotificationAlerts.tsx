import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  Calendar, 
  Wrench, 
  Check, 
  X, 
  MessageSquare, 
  ExternalLink, 
  Volume2, 
  Shield, 
  MapPin, 
  Clock, 
  User, 
  Car 
} from "lucide-react";
import { 
  subscribeAppointments, 
  subscribeCustomAccessoryRequests, 
  updateAppointmentField 
} from "../firebaseUtils";
import { Appointment, CustomAccessoryRequest } from "../types";

interface NotificationAlertsProps {
  userLoggedIn: boolean;
  isTechnician: boolean;
  setCurrentTab: (tab: string) => void;
}

interface IncomingAlert {
  id: string;
  type: "appointment" | "accessory_request";
  title: string;
  customerName: string;
  phone: string;
  vehicle: string;
  details: string;
  timeLabel?: string;
  dateLabel?: string;
  price?: number;
  rawItem: Appointment | CustomAccessoryRequest;
}

export default function NotificationAlerts({ 
  userLoggedIn, 
  isTechnician, 
  setCurrentTab 
}: NotificationAlertsProps) {
  const [alerts, setAlerts] = useState<IncomingAlert[]>([]);
  const [muteSound, setMuteSound] = useState<boolean>(false);
  
  // Refs to store already seen IDs to prevent triggering on initial load of historical data
  const seenAppointmentIds = useRef<Set<string>>(new Set());
  const seenRequestIds = useRef<Set<string>>(new Set());
  
  const isInitialAppointments = useRef<boolean>(true);
  const isInitialRequests = useRef<boolean>(true);

  // Core AudioContext reference that will be unlocked on user click/touch
  const audioContextRef = useRef<AudioContext | null>(null);

  // Touch & Click listener to proactively unlock Web Audio API on iOS & Android PWAs
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }
      } catch (err) {
        console.warn("Failed to unlock audio context on gesture:", err);
      }
    };

    window.addEventListener("click", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // Synthesize a beautiful futuristic double-tone notification chime
  const playChime = () => {
    if (muteSound) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      let ctx = audioContextRef.current;
      if (!ctx) {
        ctx = new AudioContextClass();
        audioContextRef.current = ctx;
      }
      
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      const now = ctx.currentTime;
      
      // Tone 1: Medium-High Cyber Chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Tone 2: Harmonious Peak Chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.08); // A5
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22); // D6
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 0.5);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.52);
    } catch (e) {
      console.warn("Audio chime block by browser policy or unsupported:", e);
    }
  };

  useEffect(() => {
    if (!userLoggedIn) {
      // Clear alert stack if user logs out
      setAlerts([]);
      isInitialAppointments.current = true;
      isInitialRequests.current = true;
      seenAppointmentIds.current.clear();
      seenRequestIds.current.clear();
      return;
    }

    // Subscribe to Appointments
    const unsubAppointments = subscribeAppointments((list) => {
      if (isInitialAppointments.current) {
        // First load: just cache all existing IDs to avoid spamming alerts
        list.forEach((appt) => {
          if (appt.id) seenAppointmentIds.current.add(appt.id);
        });
        isInitialAppointments.current = false;
        return;
      }

      // Check for new pending appointments
      list.forEach((appt) => {
        if (!appt.id) return;
        
        // If it's a new ID, is pending, and not already in seen list
        if (!seenAppointmentIds.current.has(appt.id)) {
          seenAppointmentIds.current.add(appt.id);

          if (appt.status === "pending") {
            const newAlert: IncomingAlert = {
              id: appt.id,
              type: "appointment",
              title: "Nueva Cita Agendada",
              customerName: appt.customerName,
              phone: appt.phone,
              vehicle: `${appt.brand} ${appt.model} (${appt.year})`,
              details: appt.serviceName,
              timeLabel: appt.time,
              dateLabel: appt.date,
              price: appt.total,
              rawItem: appt
            };
            
            setAlerts((prev) => [newAlert, ...prev]);
            playChime();
          }
        }
      });
    });

    // Subscribe to Custom Accessory Requests (Solicitudes de Pieza)
    const unsubRequests = subscribeCustomAccessoryRequests((list) => {
      if (isInitialRequests.current) {
        // First load: just cache all existing IDs
        list.forEach((req) => {
          if (req.id) seenRequestIds.current.add(req.id);
        });
        isInitialRequests.current = false;
        return;
      }

      // Check for new pending accessory requests
      list.forEach((req) => {
        if (!req.id) return;

        if (!seenRequestIds.current.has(req.id)) {
          seenRequestIds.current.add(req.id);

          if (req.status === "pending") {
            const newAlert: IncomingAlert = {
              id: req.id,
              type: "accessory_request",
              title: "Nueva Solicitud de Pieza Especial",
              customerName: req.customerName,
              phone: req.phone,
              vehicle: `${req.brand} ${req.model} (${req.year})`,
              details: req.accessoryName,
              rawItem: req
            };

            setAlerts((prev) => [newAlert, ...prev]);
            playChime();
          }
        }
      });
    });

    return () => {
      unsubAppointments();
      unsubRequests();
    };
  }, [userLoggedIn, muteSound]);

  const handleDismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Direct confirmation handler for Admin (technician is read-only)
  const handleConfirmAppointmentDirectly = async (apptId: string) => {
    if (isTechnician) return;
    try {
      await updateAppointmentField(apptId, { status: "confirmed" });
      handleDismiss(apptId);
    } catch (err) {
      console.error("Error confirming directly from notification:", err);
    }
  };

  const handleNavigateToPanel = (alert: IncomingAlert) => {
    setCurrentTab("admin");
    handleDismiss(alert.id);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 md:right-10 max-w-sm w-full z-50 space-y-4 pointer-events-none">
      <div className="flex justify-between items-center bg-[#070b13]/90 border border-slate-800 rounded-lg p-2.5 mb-2 pointer-events-auto backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            {alerts.length} Notificación{alerts.length > 1 ? "es" : ""} Nueva{alerts.length > 1 ? "s" : ""}
          </span>
        </div>
        <button 
          onClick={() => setMuteSound(!muteSound)}
          className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1"
          title={muteSound ? "Activar sonido" : "Silenciar sonido"}
        >
          <Volume2 className={`h-4 w-4 ${muteSound ? "text-red-500 line-through opacity-60" : "text-brand-blue"}`} />
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => {
          const waLink = `https://wa.me/${alert.phone.replace(/\D/g, "")}`;
          
          return (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: 200 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`pointer-events-auto bg-gradient-to-b from-[#111625] to-[#0a0d17] border-l-4 rounded-2xl shadow-2xl overflow-hidden ${
                alert.type === "appointment" 
                  ? "border-l-brand-blue border-slate-800" 
                  : "border-l-amber-500 border-slate-800"
              } border`}
            >
              <div className="p-5 space-y-3.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      alert.type === "appointment" ? "bg-cyan-950 text-brand-blue" : "bg-amber-950 text-amber-500"
                    }`}>
                      {alert.type === "appointment" ? (
                        <Calendar className="h-4 w-4" />
                      ) : (
                        <Wrench className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wide leading-tight">
                        {alert.title}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">
                        {alert.type === "appointment" ? "Cita de Servicio" : "Pieza Especial"}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDismiss(alert.id)}
                    className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Content body */}
                <div className="bg-black/40 rounded-xl p-3 border border-slate-800/40 space-y-2.5 text-xs text-left">
                  {/* Customer & Car */}
                  <div className="flex items-center gap-2 text-slate-200">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold truncate">{alert.customerName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <Car className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{alert.vehicle}</span>
                  </div>

                  {/* Date and Time (for appointment) */}
                  {alert.type === "appointment" && alert.dateLabel && (
                    <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px] bg-slate-900/60 px-2 py-1.5 rounded-lg border border-slate-800/40">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                        <span>{alert.dateLabel}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                        <span>{alert.timeLabel}</span>
                      </div>
                    </div>
                  )}

                  {/* Details / Service Name / Accessory */}
                  <div className="pt-1.5 border-t border-slate-800/40 text-[11px]">
                    <span className="text-slate-500 block uppercase font-mono tracking-wider text-[9px] mb-0.5">Detalles del Pedido:</span>
                    <span className="text-white font-medium">{alert.details}</span>
                    {alert.price && (
                      <span className="text-emerald-400 font-bold font-mono ml-2">(${alert.price} MXN)</span>
                    )}
                  </div>
                </div>

                {/* Footer and Action controls */}
                <div className="flex flex-col gap-1.5 pt-1">
                  {alert.type === "appointment" && !isTechnician && (
                    <button
                      onClick={() => handleConfirmAppointmentDirectly(alert.id)}
                      className="w-full bg-brand-blue hover:bg-cyan-400 text-black font-black py-2 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      <Check className="h-4 w-4 stroke-[3]" /> Confirmar Cita Al Instante
                    </button>
                  )}

                  {isTechnician && alert.type === "appointment" && (
                    <div className="bg-amber-950/20 border border-amber-500/15 text-[9px] text-amber-500 rounded-lg p-1.5 text-center font-medium">
                      🛡️ Vista de Técnico (Solo el Administrador Adrián puede confirmar citas)
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleNavigateToPanel(alert)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      Ver en Panel <ExternalLink className="h-3 w-3" />
                    </button>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => handleDismiss(alert.id)}
                      className="bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      WhatsApp <MessageSquare className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
