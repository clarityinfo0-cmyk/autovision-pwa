import React, { useState } from "react";
import { createCustomAccessoryRequest } from "../firebaseUtils";
import { parseMarkdown } from "./AIAdvisor";
import ImageUploader from "./ImageUploader";
import { Sparkles, MessageCircle, CheckCircle2, Package, UploadCloud, FileText, AlertCircle } from "lucide-react";

export default function CustomAccessoryQuote() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [accessoryName, setAccessoryName] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  // Upload of accessory reference photo is now handled by ImageUploader component direct to setImageUrl

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !brand || !model || !year || !accessoryName) {
      setError("Por favor, llena todos los campos obligatorios (*).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch AI compatibility analysis from backend server
      const aiRes = await fetch("/api/custom-accessory-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          model,
          year,
          accessoryName,
          notes,
          customerName,
          phone
        })
      });

      let aiResultText = "";
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        aiResultText = aiData.analysis;
        setAiAnalysis(aiResultText);
      }

      // 2. Save custom request to Firestore database
      await createCustomAccessoryRequest({
        customerName,
        phone,
        brand,
        model,
        year,
        accessoryName,
        notes,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&q=80&w=400",
        aiAnalysis: aiResultText || "Sugerencia pendiente de revisión técnica.",
        quotedPrice: 0 // Will be set by admin
      });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError("Error al registrar tu solicitud: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppQuote = () => {
    const text = encodeURIComponent(
      `Hola Autovisión, acabo de enviar una solicitud de cotización externa en la app de Autovisión.\n\n*Cliente:* ${customerName}\n*Celular:* ${phone}\n*Vehículo:* ${brand} ${model} (${year})\n*Pieza a cotizar:* ${accessoryName}\n*Detalles:* ${notes}\n\nQuedo al pendiente de tu presupuesto.`
    );
    window.open(`https://wa.me/526873675477?text=${text}`, "_blank");
  };

  if (success) {
    return (
      <div className="py-12 max-w-2xl mx-auto px-4 sm:px-6">
        <div className="bg-[#12161D] border border-white/5 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <div>
            <span className="font-mono text-xs text-emerald-400 uppercase font-bold tracking-widest">Solicitud Creada</span>
            <h2 className="text-3xl font-black text-white mt-1 uppercase italic">¡Solicitud Registrada con Éxito!</h2>
            <p className="text-slate-400 text-sm mt-2">
              Hemos guardado tu solicitud de accesorio externo. Autovisión buscará la pieza exacta con nuestros distribuidores autorizados.
            </p>
          </div>

          {/* AI Preliminary Analysis Card */}
          {aiAnalysis && (
            <div className="bg-[#0a0d14] border border-white/5 rounded-2xl p-6 text-left space-y-3">
              <span className="font-mono text-xs text-blue-400 flex items-center gap-1.5 uppercase font-bold">
                <Sparkles className="h-3.5 w-3.5" /> Análisis de Compatibilidad Automático
              </span>
              <div className="border-t border-white/5 pt-3 text-slate-300">
                {parseMarkdown(aiAnalysis)}
              </div>
            </div>
          )}

          {/* Prompt for WhatsApp escalation */}
          <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-500/10 text-xs text-slate-400">
            Puedes acelerar el proceso enviando los detalles y la foto de la pieza directamente a Autovisión por WhatsApp.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={sendWhatsAppQuote}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-bold text-black transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              <MessageCircle className="h-5 w-5" />
              Notificar por WhatsApp
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setCustomerName("");
                setPhone("");
                setBrand("");
                setModel("");
                setYear("");
                setAccessoryName("");
                setNotes("");
                setImageUrl("");
                setAiAnalysis(null);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[#0a0d14] border border-white/5 text-white px-6 py-3.5 text-sm font-bold hover:bg-[#12161D] transition-all cursor-pointer active:scale-95"
            >
              Nueva Cotización
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-bold uppercase tracking-wider mb-3">
          <Package className="h-3.5 w-3.5" /> Cotizaciones Especiales
        </span>
        <h1 className="text-3xl font-black text-white uppercase italic">
          Solicitud de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">Accesorios</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
          ¿Buscas un estéreo específico, barras portaequipaje, estribos o alguna pieza especial que no encuentras en nuestro catálogo? Envíanos los detalles y te la cotizamos instalada.
        </p>
      </div>

      <div className="bg-[#12161D] rounded-3xl border border-white/5 p-6 md:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest border-b border-white/5 pb-1.5 font-bold">
            Formulario de Requerimiento
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Tu Nombre Completo *</label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Pérez"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Teléfono de Contacto (WhatsApp) *</label>
              <input
                type="tel"
                required
                placeholder="Ej. 5512345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Marca del Auto *</label>
              <input
                type="text"
                required
                placeholder="Ej. Ford"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Modelo del Auto *</label>
              <input
                type="text"
                required
                placeholder="Ej. Ranger"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Año *</label>
              <input
                type="number"
                required
                placeholder="Ej. 2021"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Nombre de la pieza o accesorio *</label>
            <input
              type="text"
              required
              placeholder="Ej. Estribos de acero tubulares negros / Estéreo Android de 10 pulgadas"
              value={accessoryName}
              onChange={(e) => setAccessoryName(e.target.value)}
              className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Especificaciones, marca deseada o notas</label>
            <textarea
              rows={4}
              placeholder="Ingresa especificaciones como color, marca deseada, liga de referencia o cualquier detalle técnico."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all resize-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Real File Upload Section */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Foto de referencia de la pieza (opcional)</label>
            <ImageUploader
              folder="accessories"
              initialImageUrl={imageUrl}
              onUploadComplete={(url) => setImageUrl(url)}
              label="Subir foto de referencia"
            />
            
            {/* Direct URL alternative */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-mono text-slate-600">O ingresa URL de imagen:</span>
              <input
                type="text"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 bg-[#0a0d14]/60 border border-white/5 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
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
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando compatibilidad con IA y enviando...
              </span>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                Registrar Solicitud Especial
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
