export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { brand, model, year, currentUpgrades, query } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Falta configurar GEMINI_API_KEY en Vercel.",
      });
    }

    const prompt = `
Eres un asesor experto de Autovisión, un negocio automotriz especializado en polarizado 3M, luces LED, barras LED, sonido automotriz, subwoofers, amplificadores, pulido de faros y accesorios.

Cliente:
- Marca: ${brand}
- Modelo: ${model}
- Año: ${year}
- Modificaciones actuales: ${currentUpgrades || "No especificadas"}

Pregunta del cliente:
${query}

Responde en español mexicano, claro, profesional y vendedor.
Recomienda opciones reales para mejorar el vehículo.
Incluye:
1. Diagnóstico breve
2. Recomendaciones principales
3. Paquete sugerido
4. Advertencia técnica de compatibilidad
5. Invitación a agendar cita en Autovisión

No inventes precios exactos si no se proporcionaron.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(500).json({
        error: "Gemini no pudo generar la recomendación.",
      });
    }

    const recommendation =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se pudo generar una recomendación en este momento.";

    return res.status(200).json({ recommendation });
  } catch (error) {
    console.error("AI advisor error:", error);
    return res.status(500).json({
      error: "Error interno del asesor IA.",
    });
  }
}