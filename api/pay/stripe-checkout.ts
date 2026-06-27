import Stripe from "stripe";

function normalizeAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.trim().replace(/\s/g, "").replace(/,/g, ".");
    const parsed = Number(cleaned);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return res.status(500).json({
        error: "Falta STRIPE_SECRET_KEY en Vercel.",
      });
    }

    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};

    const {
      amount,
      customerName,
      phone,
      serviceName,
      vehicle,
      email,
    } = body;

    const finalAmount = normalizeAmount(amount);

    if (finalAmount === null || finalAmount <= 0) {
      return res.status(400).json({
        error:
          "Monto inválido. Envía un número válido, por ejemplo 1500 o 1500.50.",
      });
    }

    const stripe = new Stripe(stripeKey);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://autovision-pwa.vercel.app";

    const unitAmount = Math.round(finalAmount * 100);

    if (unitAmount < 50) {
      return res.status(400).json({
        error: "El monto mínimo para Stripe es de $0.50 MXN.",
      });
    }

    const normalizedEmail =
      typeof email === "string" ? email.trim() : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: normalizedEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: `Autovisión: ${serviceName || "Servicio automotriz"}`,
              description: `Cliente: ${customerName || ""} (${phone || ""}) - Vehículo: ${vehicle || ""}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        customerName: customerName || "",
        phone: phone || "",
        serviceName: serviceName || "",
        vehicle: vehicle || "",
        amount: String(finalAmount),
      },
      success_url: `${appUrl}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?payment_status=cancelled`,
    });

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Stripe checkout error:", {
      message: error?.message,
      type: error?.type,
      code: error?.code,
    });

    let errorMessage = "No se pudo iniciar la transacción de Stripe.";

    if (error?.type === "StripeCardError") {
      errorMessage = "La tarjeta fue rechazada por Stripe.";
    } else if (error?.type === "StripeInvalidRequestError") {
      errorMessage = "Los datos enviados a Stripe no son válidos.";
    }

    return res.status(500).json({ error: errorMessage });
  }
}