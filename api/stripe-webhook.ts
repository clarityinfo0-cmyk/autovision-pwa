import { handleStripeWebhook } from "../src/stripeUtils";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).send("Método no permitido");
  }

  try {
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const payload = Buffer.concat(chunks);
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).send("Falta Stripe Signature");
    }

    await handleStripeWebhook(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    return res.status(200).json({
      received: true,
    });

  } catch (err: any) {
    console.error(err);

    return res.status(400).json({
      error: err.message,
    });
  }
}