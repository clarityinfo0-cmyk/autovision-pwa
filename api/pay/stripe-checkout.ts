import Stripe from "stripe";

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

    const stripe = new Stripe(stripeKey);

    const {
      amount,
      customerName,
      phone,
      serviceName,
      vehicle,
      email,
    } = req.body || {};

    const finalAmount = Number(amount);

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ error: "Monto inválido." });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://autovision-pwa.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: `Autovisión: ${serviceName || "Servicio automotriz"}`,
              description: `Cliente: ${customerName || ""} (${phone || ""}) - Vehículo: ${vehicle || ""}`,
            },
            unit_amount: Math.round(finalAmount * 100),
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
    console.error("Stripe checkout error:", error);

    return res.status(500).json({
      error: error?.message || "Error al crear checkout de Stripe.",
    });
  }
}