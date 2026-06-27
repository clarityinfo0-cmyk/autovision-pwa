import React, { useState } from "react";
import { Sparkles, Car, Send, HelpCircle, Flame, AlertCircle } from "lucide-react";

// Solución del tipado para la renderización de texto
function renderTextWithLinksAndBold(text: string): React.ReactNode[] {
  if (!text) return [];
  
  const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
  const rawParts = text.split(regex);
  
  return rawParts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const innerText = part.slice(2, -2);
      return (
        <strong key={index} className="text-white font-bold text-blue-400">
          {renderTextWithLinksAndBold(innerText)}
        </strong>
      );
    } else if (part.startsWith("[") && part.includes("](")) {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const anchor = linkMatch[1];
        const url = linkMatch[2];
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline font-semibold transition-all hover:scale-[1.01]"
          >
            {renderTextWithLinksAndBold(anchor)}
          </a>
        );
      }
    }
    return part;
  });
}

// Lightweight markdown renderer ajustado para React
export function parseMarkdown(text: string): React.ReactNode {
  if (!text) return "";
  
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith("###")) {
          return (
            <h4 key={idx} className="text-md font-bold text-white mt-4 mb-2 flex items-center gap-2">
              <Flame className="h-4 w-4 text-cyan-400" />
              {renderTextWithLinksAndBold(trimmed.replace("###", "").trim())}
            </h4>
          );
        }
        if (trimmed.startsWith("##")) {
          return (
            <h3 key={idx} className="text-lg font-extrabold text-blue-500 mt-5 mb-2 uppercase tracking-wider">
              {renderTextWithLinksAndBold(trimmed.replace("##", "").trim())}
            </h3>
          );
        }
        if (trimmed.startsWith("#")) {
          return (
            <h2 key={idx} className="text-xl font-black text-white mt-6 mb-3 border-b border-slate-800 pb-1">
              {renderTextWithLinksAndBold(trimmed.replace("#", "").trim())}
            </h2>
          );
        }

        if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
          const content = trimmed.substring(1).trim();
          return (
            <li key={idx} className="ml-5 list-disc text-sm text-slate-300 mb-1.5 leading-relaxed">
              {renderTextWithLinksAndBold(content)}
            </li>
          );
        }

        if (trimmed.length === 0) return <div key={idx} className="h-2" />;
        
        return (
          <p key={idx} className="text-sm text-slate-300 leading-relaxed mb-3">
            {renderTextWithLinksAndBold(trimmed)}
          </p>
        );
      })}
    </>
  );
}

export default function AIAdvisor() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [currentUpgrades, setCurrentUpgrades] = useState("");
  const [customQuery, setCustomQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConsult = async (selectedQuery?: string) => {
    if (!brand || !model || !year) {
      setError("Por favor, ingresa los datos de tu vehículo (Marca, Modelo y Año).");
      return;
    }

    setLoading(true);
    setError(null);
    setAdvice(null);

    const queryToSend = selectedQuery || customQuery || "¿Qué mejoras le recomendarías a mi vehículo para que se vea más moderno, seguro y premium?";

    try {
      const response = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          model,
          year,
          currentUpgrades,
          query: queryToSend
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAdvice(data.recommendation);
      } else {
        setError(data.error || "Error al obtener recomendaciones.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Error de conexión al servidor del Asesor AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickOption = (topic: string) => {
    let queryText = "";
    switch (topic) {
      case "iluminacion":
        queryText = "¿Qué opciones de iluminación LED, barras de luz y faros auxiliares recomiendas para este auto para mejorar visibilidad y verse moderno?";
        break;
      case "audio":
        queryText = "¿Qué configuración de sonido, bocinas, subwoofer o amplificador me recomiendas para este modelo sin perder espacio de cajuela?";
        break;
      case "polarizado":
        queryText = "Explícame qué porcentaje y tipo de polarizado 3M le conviene más a este coche para reducir el calor del sol y tener buena privacidad.";
        break;
      case "todo":
        queryText = "¿Cuál sería el paquete completo ideal de mejoras (polarizado, iluminación, audio) para cambiar radicalmente el look de este modelo?";
        break;
    }
    handleConsult(queryText);
  };

  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="h-4 w-4 animate-pulse" /> Autovisión AI Advisor
        </div>
        <h1 className="text-3xl font-black text-white uppercase italic">
          Asesor de Mejoras <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.3)]">Inteligente</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
          Ingresa los datos de tu vehículo y nuestra IA basada en el catálogo premium de Autovisión te sugerirá las mejores actualizaciones de audio, luces LED y polarizados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Form Panel */}
        <div className="md:col-span-5 bg-[#12161D] rounded-3xl border border-white/5 p-6 space-y-4 shadow-2xl">
          <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest border-b border-white/5 pb-1.5 flex items-center gap-1.5 font-bold">
            <Car className="h-5 w-5 text-blue-500" />
            Datos de tu Auto
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Marca *</label>
              <input
                type="text"
                placeholder="Ej. Honda, Mazda, Ford..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Modelo *</label>
              <input
                type="text"
                placeholder="Ej. Civic, Mazda 3, Ranger..."
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Año *</label>
              <input
                type="number"
                placeholder="Ej. 2018, 2022..."
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Modificaciones actuales (opcional)</label>
              <input
                type="text"
                placeholder="Ej. Ninguna, ya tiene rines..."
                value={currentUpgrades}
                onChange={(e) => setCurrentUpgrades(e.target.value)}
                className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Pregunta específica o consulta</label>
            <textarea
              placeholder="Ej. ¿Qué me recomiendas para mejorar las luces bajas de agencia sin perder la garantía?"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              rows={3}
              className="w-full bg-[#0a0d14] border border-white/5 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white transition-all resize-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => handleConsult()}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analizando auto...
              </span>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Obtener Recomendación AI
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Advice Panel */}
        <div className="md:col-span-7 flex flex-col justify-between min-h-[400px]">
          {advice ? (
            <div className="bg-[#12161D] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4 flex-1 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="font-mono text-xs text-blue-400 flex items-center gap-1.5 uppercase font-bold">
                  <Sparkles className="h-3.5 w-3.5" /> Diagnóstico AI Autovisión
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {brand} {model} ({year})
                </span>
              </div>
              <div className="overflow-y-auto max-h-[450px] pr-2">
                {parseMarkdown(advice)}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 text-center flex-1 bg-[#12161D]/20">
              <HelpCircle className="h-12 w-12 text-slate-700 animate-pulse mb-4" />
              <h4 className="text-white font-bold">Asistente Virtual Autovisión</h4>
              <p className="text-slate-400 text-xs mt-2 max-w-sm">
                Rellena los datos del auto a la izquierda o selecciona una de estas opciones rápidas de consulta si ya llenaste tu modelo:
              </p>

              {/* Quick Actions Panel */}
              <div className="grid grid-cols-2 gap-2 mt-6 max-w-md w-full">
                <button
                  onClick={() => handleQuickOption("iluminacion")}
                  disabled={!brand}
                  className="p-3 bg-[#0a0d14] border border-white/5 hover:border-blue-500/30 text-xs text-slate-300 rounded-xl text-left transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  💡 Mejorar Iluminación LED
                </button>
                <button
                  onClick={() => handleQuickOption("audio")}
                  disabled={!brand}
                  className="p-3 bg-[#0a0d14] border border-white/5 hover:border-blue-500/30 text-xs text-slate-300 rounded-xl text-left transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  🔊 Mejorar Sonido / Audio
                </button>
                <button
                  onClick={() => handleQuickOption("polarizado")}
                  disabled={!brand}
                  className="p-3 bg-[#0a0d14] border border-white/5 hover:border-blue-500/30 text-xs text-slate-300 rounded-xl text-left transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  🕶️ Polarizado 3M Conveniente
                </button>
                <button
                  onClick={() => handleQuickOption("todo")}
                  disabled={!brand}
                  className="p-3 bg-[#0a0d14] border border-white/5 hover:border-blue-500/30 text-xs text-slate-300 rounded-xl text-left transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  ⚡ Kit Completo de Estilo
                </button>
              </div>
              {!brand && (
                <p className="text-blue-400 text-xs mt-4 font-semibold animate-pulse font-mono uppercase tracking-wider">
                  * Primero escribe la marca, modelo y año del coche para habilitar las consultas rápidas.
                </p>
              )}
            </div>
          )}

          {/* Consultation Note */}
          <div className="mt-4 p-4 rounded-xl bg-[#0a0d14] border border-white/5 text-xs text-slate-500 leading-relaxed">
            * Las sugerencias de IA son de referencia técnica basada en estándares automotrices. Antes de realizar cualquier instalación, nuestro equipo técnico comprobará la compatibilidad eléctrica e interna física de tu vehículo para garantizar cero problemas.
          </div>
        </div>
      </div>
    </div>
  );
}