export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  priceFrom: number;
  duration: string; // e.g., "1.5 horas", "3 horas"
  image?: string;
  active: boolean;
}

export interface Appointment {
  id?: string;
  customerName: string;
  phone: string;
  vehicle: string; // Combined text, e.g., "Mazda 3"
  brand: string;
  model: string;
  year: string;
  serviceId: string;
  serviceName: string;
  serviceType: "taller" | "domicilio";
  addressText: string;
  references: string;
  location: {
    lat: number | null;
    lng: number | null;
  };
  date: string;
  time: string;
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  paymentMethod: "cash" | "transfer" | "mercadopago";
  paymentStatus: "pending" | "proof_sent" | "paid" | "rejected";
  servicePrice: number;
  travelFee: number;
  total: number;
  commissionRate: number; // 0.15 for Adrián
  commissionAmount: number;
  receiptUrl?: string; // proof of transfer
  notes?: string; // extra notes or customer message
  createdAt: any; // Firestore Timestamp
}

export interface GalleryItem {
  id?: string;
  title: string;
  description?: string;
  imageUrlBefore: string;
  imageUrlAfter: string;
  category?: string;
  createdAt?: any;
}

export interface BankSettings {
  bankName: string;
  accountHolder: string;
  clabe: string;
  accountNumber: string;
}

export interface CustomAccessoryRequest {
  id?: string;
  customerName: string;
  phone: string;
  brand: string;
  model: string;
  year: string;
  accessoryName: string;
  notes: string;
  imageUrl?: string;
  status: "pending" | "quoted" | "completed";
  quotedPrice?: number;
  aiAnalysis?: string;
  createdAt: any;
}
