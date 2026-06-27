export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const {
      vehicle,
      brand,
      model,
      year,
      accessory,
      budget,
      style,
      notes,
    } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Falta configurar GEMINI_API_KEY en Vercel.",
      });
    }

    const prompt = `
Eres un cotizador experto de Autovisión, negocio especializado en accesorios automotrices, luces LED, barras LED, sonido, polarizado 3M, subwoofers, amplificadores, pulido de faros y estética vehicular.

Datos del cliente:
- Vehículo: ${vehicle || ""}
- Marca: ${brand || ""}
- Modelo: ${model || ""}
- Año: ${year || ""}
- Accesorio o mejora solicitada: ${accessory || ""}
- Presupuesto aproximado: ${budget || "No especificado"}
- Estilo deseado: ${style || "No especificado"}
- Notas adicionales: ${notes || "Sin notas"}

Genera una recomendación profesional para cotización.

Responde en español mexicano, con formato atractivo y vendedor.

Incluye:
1. Resumen de lo que busca el cliente
2. Recomendación de piezas o componentes
3. Compatibilidad probable con el vehículo
4. Nivel recomendado: económico, intermedio o premium
5. Qué debe revisar el técnico antes de instalar
6. Posibles extras o mejoras complementarias
7. Cierre invitando a agendar cita en Autovisión

No inventes marcas específicas si no estás seguro.
No des garantía absoluta de compatibilidad.
Aclara que la compatibilidad final se valida físicamente en el taller.
No inventes precios exactos si no se proporcionó lista de precios.
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
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini custom quote error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "No fue posible generar la cotización con IA.",
      });
    }

    const quote =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No se pudo generar una recomendación en este momento.";

    return res.status(200).json({ quote });
  } catch (error) {
    console.error("Custom accessory quote error:", error);

    return res.status(500).json({
      error: "Error interno del cotizador IA.",
    });
  }
}