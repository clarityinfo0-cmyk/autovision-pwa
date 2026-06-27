import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import fs from "fs";
import path from "path";
import Stripe from "stripe";

// Load Firebase configuration from the root config file
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Initialize Firebase App for Node.js context
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Lazy-loaded Stripe Client with env variable cleanup
let stripeInstance: Stripe | null = null;

export function getStripeInstance(): Stripe {
  if (stripeInstance) return stripeInstance;

  const stripeKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  let cleanKey = stripeKey;
  if (cleanKey.startsWith("=")) {
    cleanKey = cleanKey.substring(1).trim();
  }
  if (
    (cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
    (cleanKey.startsWith("'") && cleanKey.endsWith("'"))
  ) {
    cleanKey = cleanKey.substring(1, cleanKey.length - 1).trim();
  }

  if (!cleanKey) {
    throw new Error("STRIPE_SECRET_KEY no configurado en variables de entorno.");
  }

  stripeInstance = new Stripe(cleanKey);
  return stripeInstance;
}

/**
 * Safely cleans and verifies a Stripe signature.
 * Returns the fully verified Stripe.Event if authentic, or throws an error.
 */
export function verifyStripeSignature(payload: string | Buffer, sig: string, rawWebhookSecret: string): Stripe.Event {
  if (!sig) {
    throw new Error("No stripe-signature header provided.");
  }
  
  let cleanSecret = (rawWebhookSecret || "").trim();
  if (cleanSecret.startsWith("=")) {
    cleanSecret = cleanSecret.substring(1).trim();
  }
  if (
    (cleanSecret.startsWith('"') && cleanSecret.endsWith('"')) ||
    (cleanSecret.startsWith("'") && cleanSecret.endsWith("'"))
  ) {
    cleanSecret = cleanSecret.substring(1, cleanSecret.length - 1).trim();
  }

  if (!cleanSecret) {
    throw new Error("Stripe webhook signing secret is empty or not configured.");
  }

  const stripe = getStripeInstance();
  return stripe.webhooks.constructEvent(payload, sig, cleanSecret);
}

/**
 * Handles Stripe webhook events securely and updates Firestore.
 * @param payload Raw request body (string or Buffer) from Stripe
 * @param sig stripe-signature header value
 * @param webhookSecret Stripe webhook signing secret (whsec_...)
 */
export async function handleStripeWebhook(payload: string | Buffer, sig: string, webhookSecret: string) {
  let event: Stripe.Event;

  try {
    event = verifyStripeSignature(payload, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Stripe Webhook Signature Verification Failed: ${err.message}`);
    throw new Error(`Webhook Error: ${err.message}`);
  }

  console.log(`ℹ️ Received verified Stripe Webhook event: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      await handleSuccessfulPayment(session);
    }
  }

  return { success: true };
}

/**
 * Process a successful payment from Stripe Session and update or create Firestore appointment.
 */
export async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const sessionId = session.id;
  const paymentIntentId = session.payment_intent as string || "";
  const metadata = session.metadata || {};
  
  console.log(`✅ Successful payment detected for Stripe Session: ${sessionId}`);

  const appointmentsRef = collection(db, "appointments");

  // 1. Check if there's an explicit appointmentId in the session metadata
  if (metadata.appointmentId) {
    try {
      const apptDocRef = doc(db, "appointments", metadata.appointmentId);
      await updateDoc(apptDocRef, {
        paymentStatus: "paid",
        status: "confirmed",
        stripeSessionId: sessionId,
        stripePaymentIntentId: paymentIntentId,
        updatedAt: Timestamp.now()
      });
      console.log(`✓ Appointment ${metadata.appointmentId} updated successfully using explicit ID from metadata.`);
      return metadata.appointmentId;
    } catch (err: any) {
      console.error(`⚠️ Failed to update appointment by explicit ID ${metadata.appointmentId}: ${err.message}. Retrying search query...`);
    }
  }

  // 2. Search if an appointment already has this Stripe Session ID
  const qBySession = query(appointmentsRef, where("stripeSessionId", "==", sessionId));
  const querySnapshotBySession = await getDocs(qBySession);

  if (!querySnapshotBySession.empty) {
    const docSnap = querySnapshotBySession.docs[0];
    await updateDoc(docSnap.ref, {
      paymentStatus: "paid",
      status: "confirmed",
      stripePaymentIntentId: paymentIntentId,
      updatedAt: Timestamp.now()
    });
    console.log(`✓ Appointment updated successfully by stripeSessionId search: ${docSnap.id}`);
    return docSnap.id;
  }

  // 3. Fallback: search by customer details for any pending card payment
  const customerEmail = session.customer_details?.email || metadata.customerEmail || "";
  const phone = metadata.phone || "";
  const customerName = metadata.customerName || "";

  if (customerEmail || phone || customerName) {
    const qPending = query(
      appointmentsRef,
      where("paymentStatus", "==", "pending"),
      where("paymentMethod", "==", "card")
    );
    
    try {
      const querySnapshotPending = await getDocs(qPending);
      let matchedDocRef = null;

      for (const d of querySnapshotPending.docs) {
        const data = d.data();
        const matchEmail = customerEmail && data.customerEmail === customerEmail;
        const matchPhone = phone && data.phone === phone;
        const matchName = customerName && data.customerName === customerName;

        if (matchEmail || matchPhone || matchName) {
          matchedDocRef = d.ref;
          break;
        }
      }

      if (matchedDocRef) {
        await updateDoc(matchedDocRef, {
          stripeSessionId: sessionId,
          stripePaymentIntentId: paymentIntentId,
          paymentStatus: "paid",
          status: "confirmed",
          updatedAt: Timestamp.now()
        });
        console.log(`✓ Matched pending appointment updated successfully: ${matchedDocRef.id}`);
        return matchedDocRef.id;
      }
    } catch (err: any) {
      console.error(`⚠️ Error searching pending appointments: ${err.message}`);
    }
  }

  // 4. Create new appointment automatically if not found.
  // This guarantees no customer payment is lost even if they closed their browser tab.
  console.log(`ℹ️ No existing appointment found for session ${sessionId}. Creating new verified record dynamically.`);

  const amount = session.amount_total ? session.amount_total / 100 : Number(metadata.amount) || 0;
  const servicePrice = Number(metadata.servicePrice) || amount;
  const travelFee = Number(metadata.travelFee) || 0;
  const commissionRate = 0.15;
  const commissionAmount = Number((amount * commissionRate).toFixed(2));

  const brand = metadata.brand || "";
  const model = metadata.model || "";
  const year = metadata.year || "";
  const vehicle = metadata.vehicle || (brand ? `${brand} ${model} ${year}` : "Vehículo Registrado");

  const newApptData = {
    customerName: customerName || session.customer_details?.name || "Cliente Stripe",
    customerEmail: customerEmail || "sin_correo@autovision.mx",
    phone: phone || session.customer_details?.phone || "Sin Teléfono",
    vehicle,
    brand,
    model,
    year,
    serviceId: metadata.serviceId || "stripe-web-auto",
    serviceName: metadata.serviceName || "Servicio Premium Autovisión",
    serviceType: metadata.serviceType || "taller",
    addressText: metadata.addressText || "",
    references: metadata.references || "",
    date: metadata.date || new Date().toISOString().split("T")[0],
    time: metadata.time || "10:00",
    status: "confirmed",
    paymentMethod: "card",
    paymentStatus: "paid",
    servicePrice,
    travelFee,
    total: amount,
    commissionRate,
    commissionAmount,
    stripeSessionId: sessionId,
    stripePaymentIntentId: paymentIntentId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  try {
    const newDocRef = await addDoc(appointmentsRef, newApptData);
    console.log(`✓ Successfully created auto-recovered appointment in Firestore via Webhook: ${newDocRef.id}`);
    return newDocRef.id;
  } catch (err: any) {
    console.error(`❌ Failed to create auto-recovered appointment in Firestore: ${err.message}`);
    return null;
  }
}
