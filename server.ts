import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Stripe from "stripe";
import { handleStripeWebhook, handleSuccessfulPayment } from "./src/stripeUtils";

dotenv.config();

const app = express();
const PORT = 3000;

// Stripe webhook endpoint - Must be registered BEFORE express.json() to capture raw payload correctly
app.post(
  "/api/pay/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    if (!sig) {
      console.warn("⚠️ Recibido post en webhook de Stripe pero sin stripe-signature.");
      return res.status(400).send("Falta la firma de Stripe.");
    }

    try {
      const result = await handleStripeWebhook(req.body, sig as string, webhookSecret);
      res.json(result);
    } catch (error: any) {
      console.error("❌ Error procesando webhook de Stripe:", error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

app.use(express.json());

// Lazy-loaded Stripe Client with strict validation
let stripeInstance: Stripe | null = null;
function getStripeInstance(): Stripe | null {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  let cleanKey = apiKey.trim();
  
  // Clean common copy-paste errors (like leading equals sign or surrounding quotes)
  if (cleanKey.startsWith("=")) {
    cleanKey = cleanKey.substring(1).trim();
  }
  if (
    (cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
    (cleanKey.startsWith("'") && cleanKey.endsWith("'"))
  ) {
    cleanKey = cleanKey.substring(1, cleanKey.length - 1).trim();
  }

  if (cleanKey === "") {
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(cleanKey);
  }
  return stripeInstance;
}

// Lazy-loaded Gemini Client with strict validation
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    // Check if key is completely absent, is literal quotes, undefined placeholder, or lacks the standard 'AIzaSy' Google API key prefix
    if (!apiKey || 
        apiKey === "undefined" || 
        apiKey === "null" || 
        apiKey.trim() === "" || 
        apiKey === '""' || 
        apiKey === "''" || 
        !apiKey.trim().startsWith("AIzaSy")) {
      console.warn("GEMINI_API_KEY is missing or invalid. AI Advisor will run on advanced local fallback rules.");
      return null;
    }
    aiClient = new GoogleGenAI({ 
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Advanced Local Advisor Intelligence (Backup when API key is missing or invalid)
function detectVehicleType(brand: string, model: string): "pickup" | "suv" | "compact" | "sedan" | "general" {
  const m = (model || "").toLowerCase();
  const b = (brand || "").toLowerCase();
  
  if (m.includes("hilux") || m.includes("ranger") || m.includes("tacoma") || m.includes("l200") || 
      m.includes("frontier") || m.includes("ram") || m.includes("f-150") || m.includes("lobo") || 
      m.includes("colorado") || m.includes("s10") || m.includes("pickup") || m.includes("raptor") ||
      b.includes("jeep") || m.includes("wrangler")) {
    return "pickup";
  }
  
  if (m.includes("cr-v") || m.includes("crv") || m.includes("rav4") || m.includes("sportage") || 
      m.includes("tucson") || m.includes("seltos") || m.includes("tiguan") || m.includes("kicks") || 
      m.includes("tracker") || m.includes("creta") || m.includes("duster") || m.includes("hr-v") || 
      m.includes("hrv") || m.includes("suv") || m.includes("cx-5") || m.includes("cx5") || m.includes("cx-30") ||
      m.includes("escape") || m.includes("explorer") || m.includes("duster") || m.includes("taos") || m.includes("territory")) {
    return "suv";
  }
  
  if (m.includes("swift") || m.includes("ibiza") || m.includes("spark") || m.includes("march") || 
      m.includes("beat") || m.includes("i10") || m.includes("clio") || m.includes("polo") || 
      m.includes("yaris") || m.includes("mini") || m.includes("cooper") || m.includes("fiat") || m.includes("mobi") ||
      m.includes("golf") || m.includes("rio") || m.includes("fit")) {
    return "compact";
  }
  
  if (m.includes("versa") || m.includes("onix") || m.includes("civic") || m.includes("corolla") || 
      m.includes("sentra") || m.includes("jetta") || m.includes("aveo") || m.includes("figo") || 
      m.includes("mazda 3") || m.includes("mazda3") || m.includes("sedan") || m.includes("forte") ||
      m.includes("accord") || m.includes("camry")) {
    return "sedan";
  }
  
  return "general";
}

function getLocalRecommendation(brand: string, model: string, year: string, query?: string): string {
  const type = detectVehicleType(brand, model);
  const formattedVehicle = `**${brand.toUpperCase()} ${model.toUpperCase()} (${year})**`;
  
  let intro = `¡Hola! Qué excelente vehículo es tu ${formattedVehicle}. Como asesor especialista en personalización y protección de **Autovisión**, he analizado detalladamente las especificaciones de tu modelo.\n\n`;
  
  if (type === "pickup") {
    intro += `Al ser un vehículo robusto, de trabajo pesado o aventura, las mejoras ideales para tu pick-up combinan alta resistencia ante vibraciones, iluminación de largo alcance para terracería o carretera, y una protección térmica de cabina sobresaliente.`;
  } else if (type === "suv") {
    intro += `Para tu SUV, nos enfocamos prioritariamente en elevar el confort de todos los pasajeros, garantizar un excelente rechazo de calor solar en cristales amplios y actualizar la tecnología de iluminación para máxima seguridad familiar en trayectos nocturnos.`;
  } else if (type === "compact") {
    intro += `Para tu hatchback compacto, buscamos optimizar el espacio interior, rejuvenecer su estética exterior con iluminación LED blanca nítida y modernizar su sistema multimedia o de audio para un manejo ágil y divertido.`;
  } else if (type === "sedan") {
    intro += `Para tu sedán, priorizamos un aspecto elegante de bajo perfil, un rechazo térmico óptimo en cabina (ideal para el tráfico diario o viajes en autopista) y una insonorización de primer nivel para viajes sumamente confortables.`;
  } else {
    intro += `Aquí tienes nuestra propuesta premium de Autovisión para optimizar al máximo el confort, la seguridad de manejo y la apariencia estética de tu vehículo.`;
  }

  let recommendations = "";
  if (type === "pickup") {
    recommendations = `
### 🛠️ Mejoras Premium Recomendadas para tu Pick-Up/Aventura:

1. **Polarizado Nano-Cerámico de Alta Gama (Línea Autovisión Pro)**
   * **Por qué tu vehículo lo necesita:** Las pick-ups tienen cristales traseros y laterales amplios que absorben una cantidad masiva de calor. La tecnología nano-cerámica ofrece hasta un 88% de rechazo térmico infrarrojo directo sin oscurecer tu visibilidad nocturna, manteniendo el aire acondicionado fresco y eficiente.
   * **Precio estimado:** Desde **$2,800 MXN** (Instalación limpia y profesional incluida).

2. **Paquete Iluminación LED de Alta Penetración (Focos Principales + Faros Auxiliares o Barra LED)**
   * **Por qué tu vehículo lo necesita:** Las luces halógenas de agencia limitan tu visión en terrenos oscuros. Reemplazamos tus focos originales por LEDs de 12,000 lúmenes con disipador térmico inteligente y alineación de haz milimétrica para no deslumbrar.
   * **Precio estimado:** Focos LED desde **$850 MXN** / Faros de Niebla LED desde **$900 MXN**.

3. **Sistema de Audio Premium con Subwoofer Activo Extra Plano**
   * **Por qué tu vehículo lo necesita:** El espacio trasero en cabinas de camionetas suele ser limitado. Instalamos un subwoofer autoamplificado extra plano debajo o detrás de los asientos traseros para darte graves profundos sin sacrificar un solo centímetro de espacio.
   * **Precio estimado:** Desde **$4,500 MXN** (Instalación oculta y cableado libre de oxígeno).
`;
  } else if (type === "suv") {
    recommendations = `
### 🛠️ Mejoras Premium Recomendadas para tu SUV Familiar:

1. **Película de Seguridad de Alta Resistencia y Control Solar**
   * **Por qué tu vehículo lo necesita:** Protege a tus pasajeros de cualquier imprevisto en carretera. Esta película laminada de alta micra previene que los cristales se colapsen ante un impacto fuerte y, de manera paralela, disminuye el calor sofocante del sol.
   * **Precio estimado:** Desde **$3,200 MXN** completo (Garantía de instalación sin burbujas).

2. **Actualización Completa a LED Inteligente en Faros Principales**
   * **Por qué tu vehículo lo necesita:** Brinda máxima seguridad activa al conducir de noche con tu familia. Nuestros focos LED proyectan un haz ultra blanco con enfoque exacto para ver baches, peatones y señales de tránsito a más de 150 metros de distancia.
   * **Precio estimado:** Desde **$950 MXN** el par (Instalación directa en 30 minutos sin cortar cables).

3. **Retrovisor Inteligente con Cámara de Reversa HD y Sensores Ultrasónicos**
   * **Por qué tu vehículo lo necesita:** Las SUV tienen puntos ciegos traseros importantes. Reemplazamos tu espejo central por un monitor digital de alta resolución acoplado a una cámara impermeable en la placa, complementado por sensores acústicos de proximidad.
   * **Precio estimado:** Desde **$2,100 MXN** instalado.
`;
  } else if (type === "compact") {
    recommendations = `
### 🛠️ Mejoras Premium Recomendadas para tu Compacto/Hatchback:

1. **Iluminación LED Nítida (Faros Principales y Cuartos de Presencia)**
   * **Por qué tu vehículo lo necesita:** Rejuvenece radicalmente la firma de luz frontal de tu coche compacto. La luz blanca fría (6500K) le da un aspecto extremadamente moderno y elegante, similar a los autos de último año.
   * **Precio estimado:** Desde **$850 MXN** el par (Sistema Can-Bus compatible, sin marcar errores en el tablero).

2. **Polarizado Inteligente de Privacidad y Confort Térmico**
   * **Por qué tu vehículo lo necesita:** En autos compactos, el sol desgasta rápidamente el habitáculo. Nuestro polarizado protege al 100% tus plásticos interiores de cuarteaduras, brinda privacidad para tus pertenencias y reduce el molesto destello solar.
   * **Precio estimado:** Desde **$1,400 MXN** completo.

3. **Sistema Multimedia Táctil con Apple CarPlay & Android Auto Inalámbrico**
   * **Por qué tu vehículo lo necesita:** Vincula tu celular para disfrutar de Waze, Google Maps y Spotify de forma 100% segura mediante comandos de voz. Incluye ecualizador integrado para revitalizar tus bocinas de agencia.
   * **Precio estimado:** Desde **$3,800 MXN** (Incluye frente adaptador a la medida y conectores de marca).
`;
  } else if (type === "sedan") {
    recommendations = `
### 🛠️ Mejoras Premium Recomendadas para tu Sedán Ejecutivo:

1. **Polarizado Nano-Cerámico Inteligente (Transparencia Selectiva)**
   * **Por qué tu vehículo lo necesita:** Si prefieres no oscurecer demasiado tus cristales para mantener una estética de agencia o facilitar tu visibilidad nocturna, las películas nano-cerámicas transparentes bloquean la radiación infrarroja solar en un 80% manteniendo la máxima visibilidad reglamentaria.
   * **Precio estimado:** Desde **$3,500 MXN** completo.

2. **Focos LED Principales con Enfoque de Haz de Alta Precisión**
   * **Por qué tu vehículo lo necesita:** El haz de luz blanca de alta potencia mejora significativamente la claridad del camino, permitiendo un manejo relajado y reduciendo el cansancio visual en viajes prolongados por carretera.
   * **Precio estimado:** Desde **$850 MXN** el par.

3. **Tratamiento Acústico e Insonorización de Puertas**
   * **Por qué tu vehículo lo necesita:** Bloquea el ruido de rodadura exterior, viento y tráfico. Notarás un manejo sumamente silencioso y hermético, similar al de un vehículo de gama ultra-lujosa, maximizando la pureza del sonido de tu música.
   * **Precio estimado:** Desde **$1,800 MXN** (Material butilo insonorizante de grado aeronáutico).
`;
  } else {
    recommendations = `
### 🛠️ Mejoras Premium Recomendadas para tu Vehículo:

1. **Polarizado Automotriz de Confort y Control Térmico**
   * **Por qué tu vehículo lo necesita:** Ofrece una barrera térmica directa que disminuye el esfuerzo del motor para enfriar la cabina, ahorrando combustible y protegiendo tu piel y pertenencias de la radiación directa.
   * **Precio estimado:** Desde **$1,400 MXN** completo.

2. **Iluminación LED de Alta Potencia y Mayor Alcance**
   * **Por qué tu vehículo lo necesita:** Luz blanca ultra brillante que se activa instantáneamente en milisegundos y tiene una vida útil superior a las 30,000 horas de uso.
   * **Precio estimado:** Desde **$850 MXN** el par.

3. **Estética y Restauración: Pulido Profesional de Faros con Sellador UV**
   * **Por qué tu vehículo lo necesita:** Elimina la capa opaca y amarillenta provocada por el sol, regresándole hasta un 95% de transparencia a tus faros para que alumbren de forma óptima y tu vehículo luzca impecable.
   * **Precio estimado:** Desde **$400 MXN** el par.
`;
  }

  const outro = `

### 📅 ¿Cuál es el siguiente paso para tu auto?
1. **Agenda tu servicio:** Ve a la pestaña **"Agendar Cita"** de la aplicación para reservar tu día y hora. Recuerda que realizamos la instalación de forma profesional y con garantía por escrito en nuestro taller o directamente en tu domicilio.
2. **Atención directa e inmediata:** Si deseas realizar alguna combinación especial de servicios o tienes dudas adicionales, haz clic en el botón de **WhatsApp** abajo para recibir una asesoría manual con nuestro equipo en segundos.

*¡En Autovisión cuidamos tu auto como si fuera nuestro!*`;

  return `${intro}\n${recommendations}\n${outro}`;
}

function getLocalQuoteAnalysis(brand: string, model: string, year: string, accessoryName: string, notes?: string): string {
  const acc = (accessoryName || "").toLowerCase();
  const n = (notes || "").toLowerCase();
  
  let accessoryCategory = "Accesorio Especial de Alto Desempeño";
  let techDetails = "";
  let basePrice = 2500;
  let workPrice = 800;
  let realBrand = "Premium OEM";
  
  if (acc.includes("estereo") || acc.includes("pantalla") || acc.includes("pantallas") || acc.includes("radio") || acc.includes("carplay") || acc.includes("android auto")) {
    accessoryCategory = "Sistema de Infoentretenimiento con Pantalla Android HD";
    techDetails = `
* **Arnés y Conectores de Ajuste Exacto:** Para tu ${brand} ${model} se requiere un contraarnés específico para conservar los controles al volante, cámara de reversa original de agencia e información de la computadora de viaje mediante un decodificador Can-Bus dedicado.
* **Frente Adaptador Premium:** Utilizaremos un bisel estético de doble DIN o de 9/10 pulgadas que se acopla milimétricamente al tablero de tu coche, conservando la textura y color original para que parezca salido de fábrica.`;
    basePrice = 4500;
    workPrice = 1200;
    realBrand = "Pioneer / Soundstream / JC Power (Premium Android Edition)";
  } else if (acc.includes("luz") || acc.includes("led") || acc.includes("faro") || acc.includes("faros") || acc.includes("iluminacion") || acc.includes("niebla")) {
    accessoryCategory = "Kit de Iluminación LED Inteligente de Alta Penetración";
    techDetails = `
* **Compatibilidad Can-Bus Inteligente:** Tu vehículo requiere focos LED equipados con tecnología Can-Bus integrada para evitar interferencias de radiofrecuencia y destellos parpadeantes o alertas de "foco fundido" en el panel de instrumentos.
* **Alineación de Haz y Disipación Activa:** Cuidamos la orientación precisa de los chips LED para replicar el haz de luz halógena original, evitando deslumbrar a otros conductores y duplicando el alcance de visión en carretera.`;
    basePrice = 1200;
    workPrice = 450;
    realBrand = "Philips / OSRAM LED / Novsight Pro";
  } else if (acc.includes("estribo") || acc.includes("estribos")) {
    accessoryCategory = "Estribos Laterales de Acero Reforzado y Diseño Aerodinámico";
    techDetails = `
* **Montaje a Chasis:** Los estribos para tu ${brand} ${model} se sujetarán directamente a los puntos de montaje roscados que el vehículo ya tiene en el chasis de fábrica. No requerimos taladrar, soldar ni modificar el metal estructural del coche.
* **Resistencia y Estética:** Fabricados con acero de alta resistencia y acabados en recubrimiento de pintura en polvo negro mate anti-corrosión, con superficie antideslizante certificada.`;
    basePrice = 5800;
    workPrice = 1400;
    realBrand = "Steelcraft / Go Rhino / Big Country";
  } else if (acc.includes("barras") || acc.includes("canastilla") || acc.includes("portaequipaje") || acc.includes("rack") || acc.includes("thule")) {
    accessoryCategory = "Sistema Portaequipaje y Barras de Techo de Alta Capacidad";
    techDetails = `
* **Ajuste Técnico de Anclaje:** Analizamos si tu coche tiene barras longitudinales elevadas, integradas al ras, o techo liso. Utilizaremos ganchos de sujeción engomados y pies de anclaje específicos para no rayar la pintura de tu carrocería.
* **Dinámica de Viento (Aero):** Perfiles aerodinámicos de aluminio extruido que minimizan el ruido del viento y la resistencia al arrastre, optimizando el consumo de gasolina a alta velocidad.`;
    basePrice = 3800;
    workPrice = 750;
    realBrand = "Thule / Yakima / Menabo";
  } else {
    techDetails = `
* **Integración Mecánica y Estética:** El montaje de este accesorio en tu ${brand} ${model} (${year}) se realiza siguiendo estrictos procedimientos del fabricante. Respetamos los puntos de anclaje estructurales y las líneas de ensamble para una apariencia totalmente OEM.
* **Cuidado Eléctrico y Estructural:** Todas las conexiones adicionales se aíslan con cinta de grado automotriz y manguera corrugada para prevenir cortos y proteger la instalación original.`;
  }
  
  const profitMargin = Math.round(basePrice * 0.28);
  const totalPrice = basePrice + profitMargin + workPrice;

  return `### 🔍 Análisis de Compatibilidad y Compatibilidad Real Encontrada

¡Excelente elección! Nuestro equipo de ingenieros de **Autovisión** ha estructurado los requerimientos exactos para un(a) **${accessoryName}** en tu **${brand} ${model} (${year})**.

${techDetails}

### 📦 Especificaciones de la Pieza Recomendada
* **Accesorio Identificado:** ${accessoryCategory}
* **Marca Sugerida:** ${realBrand} (Diseño con homologación exacta y garantía local)
* **Garantía Autovisión:** 12 meses por escrito ante cualquier defecto de fabricación o instalación.

### 💰 Presupuesto y Desglose de Distribución (MXN)
Ofrecemos un servicio "Llave en Mano" (todo incluido, sin sorpresas ni cargos ocultos) que se desglosa amigablemente de la siguiente manera:
1. **Costo de la Pieza Premium:** $${basePrice.toLocaleString("es-MX")} MXN
2. **Logística de Compra, Garantía Directa y Gestión:** $${profitMargin.toLocaleString("es-MX")} MXN
3. **Mano de Obra de Instalación Certificada:** $${workPrice.toLocaleString("es-MX")} MXN
---
* **PRECIO TOTAL INSTALADO NETO:** **$${totalPrice.toLocaleString("es-MX")} MXN**

### 📅 Próximos pasos de tu solicitud
* **Búsqueda con Distribuidores:** Ya estamos consultando con nuestra red de proveedores nacionales e internacionales para ofrecerte la pieza de mejor calidad y marca reconocida al costo más competitivo.
* **Cálculo de Tiempo de Instalación:** El tiempo promedio de montaje para este accesorio oscila entre **2 a 4 horas**, garantizando un trabajo impecable.
* **Envío de Presupuesto:** En breve, te contactaremos a tu número para darte las opciones disponibles y costos totales instalados.

*¡Si tienes fotos de referencia del accesorio que buscas, haz clic en "Notificar por WhatsApp" en la pantalla de éxito para enviarlas en segundos!*`;
}

// API endpoint for AI Advisor (accessory/upgrades recommendations)
app.post("/api/ai-advisor", async (req, res) => {
  const { brand, model, year, currentUpgrades, query } = req.body;

  if (!brand || !model || !year) {
    return res.status(400).json({ error: "Faltan datos del vehículo (marca, modelo, año)." });
  }

  const ai = getAiClient();
  if (!ai) {
    // Generate beautiful and dynamic local recommendations based on car specs
    const recommendationText = getLocalRecommendation(brand, model, year, query);
    return res.json({ recommendation: recommendationText });
  }

  try {
    const prompt = `Actúa como el Asesor Principal de Personalización Automotriz de "Autovisión", el centro de equipamiento y detallado premium líder en México.

INFORMACIÓN DEL VEHÍCULO DE CONSULTA:
- Marca: ${brand}
- Modelo: ${model}
- Año del vehículo: ${year}
${currentUpgrades ? `- Modificaciones o equipamiento actual: ${currentUpgrades}` : ""}

PREGUNTA O PREOCUPACIÓN EXPRESA DEL CLIENTE:
"${query || "¿Qué mejoras le recomendarías a mi vehículo para que se vea más moderno, seguro y premium?"}"

INSTRUCCIONES CRÍTICAS DE ENTRENAMIENTO AUTOMOTRIZ Y BÚSQUEDA PROFUNDA EN INTERNET (GOOGLE SEARCH):
1. **Búsqueda Altamente Focalizada:** DEBES realizar búsquedas automáticas reales para verificar autopartes, accesorios de marca, molduras, kits de suspensión, pantallas multimedia de ajuste exacto, iluminación LED compatible con Canbus o barras de carga específicos para la línea y generación de este auto exacto: "${brand} ${model} ${year}".
2. **Evita Genéricos, Busca Especificidad Técnica:** Por ejemplo, si busca iluminación, investiga si el tipo de conector para faros principales es H4, H11, 9005, u otro específico del modelo. Si busca estéreo, busca si el tablero requiere un frente adaptador de 9" o 10" y un decodificador Can-Bus para los mandos al volante. Si busca equipamiento off-road o de carga, busca las marcas exactas con herrajes certificados (ej. Thule, Yakima, Go Rhino) que se instalen en los rieles originales del ${brand} ${model} ${year}.
3. **Cálculo de Ganancia Comercial y Mano de Obra (Regla de Autovisión):**
   - Encuentra u ofrece el costo comercial real estimado en tiendas de e-commerce en México (MercadoLibre México, Amazon México, AutoZone, etc.).
   - Aplica rigurosamente el margen financiero de Autovisión: al costo neto comercial súmale una ganancia de distribución/importación y respaldo de garantía del taller (25% a 35% del valor de la pieza), MÁS el precio de mano de obra experta certificada (desde $500 hasta $1800 MXN según la complejidad de ensamblaje e instalación eléctrica).
   - Desglosa este presupuesto integrado al cliente de forma transparente y persuasiva en MXN, resaltando que delegar la compra e instalación le otorga una garantía de 1 año directo con nosotros sin comprometer la garantía de su auto con la agencia.
4. **Enlaces de Certeza Técnica:** Integra de forma natural enlaces reales con hipervínculos en formato markdown directo a las fuentes de referencia web encontradas (ej. [MercadoLibre] o [Amazon]) para sustentar la viabilidad técnica de la pieza hoy.

ESTRUCTURA PREMIUM DE TU RESPUESTA:
1. **Saludo Especialista y Diagnóstico del Vehículo:** Saluda cordialmente en español de México/latino. Comenta con entusiasmo y conocimiento real sobre las características específicas de la generación del ${brand} ${model} ${year}, destacando por qué este vehículo se beneficia enormemente de la personalización solicitada.
2. **Accesorios de Mejora Encontrados con Búsqueda Real (2-3 Propuestas Detalladas):** Describe con marcas y compatibilidad física precisa las opciones reales de actualización. Ofrece detalles técnicos profundos de conectores, fijaciones, o rendimiento.
3. **Presupuesto Detallado y Desglose Financiero (MXN):** Detalla el costo comercial, la ganancia de logística/cobertura de garantía del taller, la mano de obra certificada, y el **Precio Total Instalado Neto**.
4. **Enlaces de Referencia Real:** Muestra un listado amigable de las fuentes y productos reales encontrados en línea.
5. **Llamado a la Acción Directo:** Invítalo a apartar sus piezas o agendar su cita de instalación directamente desde la app o vía WhatsApp.

Sé extremadamente detallado, técnico y entusiasta. El cliente debe percibir que habla con un taller altamente profesional y especializado. Usa Markdown sofisticado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    res.json({ recommendation: response.text });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    const recommendationText = getLocalRecommendation(brand, model, year, query);
    res.json({ recommendation: recommendationText });
  }
});

// API endpoint for manual custom accessory quotes
app.post("/api/custom-accessory-quote", async (req, res) => {
  const { brand, model, year, accessoryName, notes, customerName, phone } = req.body;

  if (!brand || !model || !year || !accessoryName) {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }

  const ai = getAiClient();
  if (!ai) {
    const analysisText = getLocalQuoteAnalysis(brand, model, year, accessoryName, notes);
    return res.json({ analysis: analysisText });
  }

  try {
    const prompt = `El cliente ${customerName || "Interesado"} (Teléfono: ${phone || "No especificado"}) solicita una cotización técnica para un accesorio externo personalizado.

DETALLES DE LA SOLICITUD DE COTIZACIÓN:
- Vehículo del Cliente: ${brand} ${model} ${year}
- Accesorio Solicitado: ${accessoryName}
- Notas, preferencias o marca solicitada por el cliente: ${notes || "Ninguna especificada"}

Actúa como el Ingeniero Técnico de Autovisión. Tu objetivo es realizar una búsqueda profunda en internet y formular una respuesta sumamente profesional, con alto rigor automotriz, en español de México/latino.

INSTRUCCIONES CLÍTICAS DE ENTRENAMIENTO AUTOMOTRIZ Y BÚSQUEDA PROFUNDA EN INTERNET (GOOGLE SEARCH):
1. **Búsqueda Concreta e Investigación:** REALIZA búsquedas en Google Search en tiempo real buscando específicamente el accesorio "${accessoryName}" diseñado exclusivamente para acoplarse con un ${brand} ${model} ${year}. 
2. **Especificación Automotriz Directa:** Indica los aspectos críticos de instalación (ej. si requiere conectarse a la línea de fusibles original de forma independiente mediante un "add-a-circuit" para no perder garantía del distribuidor; si requiere bases roscadas originales en el chasis; si requiere codificación o interfaz Canbus para no generar errores en computadora).
3. **Regla de Negocios y Finanzas Autovisión:**
   - Investiga o estima con alta precisión el costo comercial de la pieza en portales de e-commerce mexicanos.
   - Suma un 25% a 30% en concepto de adquisición, importación si aplica, y garantía local extendida que el taller le brinda.
   - Suma el costo de mano de obra por montaje profesional limpio y estético (de $500 a $1500 MXN según dificultad).
   - Desglosa estos tres rubros amigablemente al cliente antes de presentar el **Precio Integrado Total Instalado**. Demuestra el valor agregado de Autovisión (cableado blindado, soldaduras protegidas con termofit, bases anticorrosivas, y 1 año de garantía).
4. **Hipervínculos Reales:** Proporciona los enlaces markdown reales de los distribuidores o tiendas electrónicas (ej. [Amazon] o [MercadoLibre]) donde se consiguen estas partes compatibles.

ESTRUCTURA DETALLADA DE LA COTIZACIÓN AI:
1. **Análisis de Compatibilidad y Diagnóstico Físico:** Detalla cómo se adaptará el ${accessoryName} al ${brand} ${model} ${year}. Habla sobre conectores, chasis, voltaje o espacio disponible con mucha propiedad técnica.
2. **Accesorios Recomendados y Marcas Encontradas hoy en la Web:** Indica exactamente la marca y las especificaciones que localizaste mediante Google Search.
3. **Presupuesto Estimado y Desglose Financiero (MXN):** Presenta el desglose amigable de la pieza, la ganancia operativa y garantía de distribución del taller, y la mano de obra certificada, terminando con el **Costo Total Instalado**.
4. **Enlaces de Referencia Real de Búsqueda:** Lista los enlaces directos a tiendas con la compatibilidad del producto.
5. **Llamado a la Acción:** Invita al cliente a confirmar su pedido mediante WhatsApp o agendar de una vez su espacio técnico en la pestaña de citas.

Usa un tono experto, formal, transparente y persuasivo. Aplica Markdown impecable con listas estructuradas y negritas bien ubicadas.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Error calling Gemini API for quote:", error);
    const analysisText = getLocalQuoteAnalysis(brand, model, year, accessoryName, notes);
    res.json({ analysis: analysisText });
  }
});

// API route to securely initiate Credit/Debit Card payments via Stripe Checkout
app.post("/api/pay/stripe-checkout", async (req, res) => {
  const { 
    customerName, 
    customerEmail, 
    phone, 
    brand, 
    model, 
    year, 
    serviceId,
    serviceName, 
    serviceType,
    addressText,
    references,
    date,
    time,
    travelFee,
    servicePrice,
    amount 
  } = req.body;

  if (!customerName || !amount) {
    return res.status(400).json({ error: "Faltan datos del cliente o del pago para proceder." });
  }

  const stripe = getStripeInstance();

  // If Stripe is not configured yet, we fall back to a ultra-secure and verified sandbox simulator
  if (!stripe) {
    console.warn("⚠️ STRIPE_SECRET_KEY no configurado en variables de entorno. Ejecutando en Modo Sandbox Seguro de Autovisión.");
    const transactionId = "SANDBOX-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const authorizationCode = Math.floor(100000 + Math.random() * 900000).toString();
    return res.json({
      success: true,
      mode: "sandbox",
      message: "Modo Sandbox Activo. Autovisión simula el flujo de pago con total seguridad sin cobrar dinero real hasta que agregues tu clave Stripe en Configuración.",
      transactionId,
      authorizationCode,
      amount,
      cardBrand: "Visa / Mastercard Simulation"
    });
  }

  try {
    // Dynamic origin detection so redirects work correctly in both Dev servers, previews, and production
    const origin = req.headers.origin || req.headers.referer || "http://localhost:3000";
    
    // Create highly secure Stripe Checkout Session (Redirect flow - PCI-DSS Compliant)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: `Autovisión Premium: ${serviceName || "Personalización Automotriz"}`,
              description: `Instalación profesional para ${brand || ""} ${model || ""} ${year || ""}. Cliente: ${customerName} (${phone})`,
            },
            unit_amount: Math.round(amount * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: customerEmail || undefined,
      success_url: `${origin}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment_status=cancelled`,
      metadata: {
        customerName: customerName || "",
        customerEmail: customerEmail || "",
        phone: phone || "",
        brand: brand || "",
        model: model || "",
        year: year || "",
        vehicle: `${brand || ""} ${model || ""} ${year || ""}`.trim() || "Vehículo Registrado",
        serviceId: serviceId || "",
        serviceName: serviceName || "Servicio Premium",
        serviceType: serviceType || "taller",
        addressText: addressText || "",
        references: references || "",
        date: date || "",
        time: time || "",
        travelFee: travelFee ? travelFee.toString() : "0",
        servicePrice: servicePrice ? servicePrice.toString() : amount.toString(),
        amount: amount.toString()
      }
    });

    res.json({
      success: true,
      mode: "real_stripe",
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error: any) {
    console.error("Error al crear sesión de pago de Stripe:", error);
    res.status(500).json({ error: "Error interno al iniciar el portal de pago seguro con Stripe. Intenta de nuevo." });
  }
});

// Secure API endpoint to verify transaction status directly from Stripe servers (anti-spoofing / anti-hacking)
app.get("/api/pay/stripe-verify/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const stripe = getStripeInstance();

  if (!stripe) {
    return res.status(400).json({ error: "El procesador Stripe no está configurado en producción." });
  }

  try {
    // Retrieve checkout session directly from Stripe servers
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid") {
      // Auto-reconcile and ensure appointment is updated/created in Firestore
      let appointmentId: string | null = null;
      try {
        appointmentId = await handleSuccessfulPayment(session);
      } catch (dbErr: any) {
        console.error("⚠️ Failed to auto-reconcile database during verify:", dbErr.message);
      }

      res.json({
        success: true,
        status: "paid",
        appointmentId,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        customerName: session.metadata?.customerName || "",
        vehicle: session.metadata?.vehicle || "",
        serviceName: session.metadata?.serviceName || "",
        paymentId: session.payment_intent as string || "N/A"
      });
    } else {
      res.json({
        success: false,
        status: session.payment_status,
        message: "La transacción aún no se encuentra aprobada."
      });
    }
  } catch (error: any) {
    console.error("Error verifying payment session:", error);
    res.status(500).json({ error: "No se pudo verificar el estado del pago con Stripe de manera segura." });
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
