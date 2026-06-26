import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. AI Advisor features will use fallback responses.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// API endpoint for AI Advisor (accessory/upgrades recommendations)
app.post("/api/ai-advisor", async (req, res) => {
  const { brand, model, year, currentUpgrades, query } = req.body;

  if (!brand || !model || !year) {
    return res.status(400).json({ error: "Faltan datos del vehículo (marca, modelo, año)." });
  }

  const ai = getAiClient();
  if (!ai) {
    // Fallback response if GEMINI_API_KEY is not available
    return res.json({
      recommendation: `### Recomenciones para tu **${brand} ${model} (${year})**\n\n*Nota: El servicio de IA de Autovisión no está configurado (falta API Key). Aquí tienes algunas sugerencias estándar:*\n\n1. **Polarizado Premium 3M:** Protege el interior de tu ${model} de los rayos UV y mejora la privacidad.\n2. **Luces LED de Alta Potencia:** Dale una apariencia moderna y mejora un 300% tu visibilidad nocturna.\n3. **Pulido de Faros y Carrocería:** Restaura el brillo original para que se vea como nuevo.\n\n*¡Contáctanos por WhatsApp para recibir una asesoría personalizada por nuestro equipo humano!*`
    });
  }

  try {
    const prompt = `Actúa como el Asesor de Personalización Automotriz de "Autovisión", un taller premium especializado en:
- Polarizado de alta gama (3M, cerámico, privacidad, protección UV)
- Luces LED (cambio de focos principales, faros auxiliares, luces de cortesía)
- Barras LED (para camionetas, todoterrenos, instalación estética y segura)
- Sonido automotriz (bocinas, subwoofers, amplificadores, estéreos con Carplay/Android Auto, insonorización)
- Pulido estético (pulido de faros opacos, detallado de carrocería, abrillantado, selladores cerámicos)
- Accesorios estéticos y funcionales (barras portaequipaje, estribos, fundas de asiento, alarmas, sensores de reversa, cámaras)

El cliente tiene el siguiente vehículo:
- Marca: ${brand}
- Modelo: ${model}
- Año: ${year}
${currentUpgrades ? `- Mejoras actuales: ${currentUpgrades}` : ""}

Pregunta del cliente o interés:
"${query || "¿Qué mejoras le recomendarías a mi vehículo para que se vea más moderno, seguro y premium?"}"

Por favor, elabora una respuesta en un tono profesional, entusiasta, experto y muy cercano (en español latino). Sigue esta estructura:
1. **Saludo y diagnóstico:** Comenta brevemente sobre el vehículo (ej. si es un sedán familiar, una SUV robusta, un auto deportivo, etc., y qué estilo le va mejor).
2. **Mejoras recomendadas específicas:** Brinda de 2 a 3 recomendaciones concretas del catálogo de Autovisión explicadas específicamente para su auto (por ejemplo, "Para este modelo de ${brand}, unas luces LED de 12,000 lúmenes mejorarán enormemente los faros de fábrica" o "El polarizado 3M en tono intermedio le dará un toque elegante y mantendrá fresco el habitáculo").
3. **Precios aproximados de referencia (en Pesos Mexicanos MXN):** Indica precios estimados "desde" (por ejemplo, Polarizado 3M desde $1,400, Luces LED desde $850, Pulido de Faros desde $400, etc.).
4. **Llamado a la acción:** Invítalo a agendar una cita directamente desde la aplicación (con atención en taller o a domicilio) o a enviarnos un mensaje de WhatsApp para afinar los detalles de la cotización.

Usa formato Markdown elegante (negritas, listas, subtítulos). Sé conciso pero con mucha calidad.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ recommendation: response.text });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Error al procesar la sugerencia de IA: " + error.message });
  }
});

// API endpoint for manual custom accessory quotes
app.post("/api/custom-accessory-quote", async (req, res) => {
  const { brand, model, year, accessoryName, notes, customerName, phone } = req.body;

  if (!brand || !model || !year || !accessoryName) {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }

  // We can write custom business logic or use Gemini to give a pre-quote analysis
  const ai = getAiClient();
  if (!ai) {
    return res.json({
      analysis: `### Solicitud de Cotización Externa para **${accessoryName}**\n\nHemos registrado tu solicitud para el **${brand} ${model} (${year})**. Un asesor de Autovisión revisará la disponibilidad de la pieza en nuestro catálogo de proveedores y se comunicará contigo al teléfono **${phone}** para darte el precio final con instalación.\n\n*¡Gracias por confiar en Autovisión!*`
    });
  }

  try {
    const prompt = `El cliente ${customerName || "Interesado"} (Teléfono: ${phone || "No especificado"}) solicita cotizar un accesorio externo que no está listado en la aplicación.
Detalles de la solicitud:
- Vehículo: ${brand} ${model} ${year}
- Accesorio solicitado: ${accessoryName}
- Notas del cliente: ${notes || "Ninguna"}

Actúa como el experto técnico de Autovisión. Brinda un análisis técnico preliminar en español para el cliente sobre este accesorio en su vehículo. 
- ¿Es compatible generalmente?
- ¿Qué consideraciones de instalación se deben tomar en cuenta (ej: cableado, espacio, fijación)?
- ¿Qué beneficios le aportará?
- Menciona que nuestro equipo buscará la pieza exacta con nuestros proveedores nacionales e importados para enviarle el presupuesto final instalado (en taller o a domicilio) a su WhatsApp.

Usa Markdown para darle formato premium.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Error calling Gemini API for quote:", error);
    res.status(500).json({ error: "Error al generar análisis: " + error.message });
  }
});

// Vite server integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
