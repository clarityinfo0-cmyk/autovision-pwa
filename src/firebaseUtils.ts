import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  deleteDoc
} from "firebase/firestore";
import { db, storage, auth } from "./firebase";
import { Service, GalleryItem, Appointment, BankSettings, CustomAccessoryRequest } from "./types";
import { INITIAL_SERVICES, INITIAL_GALLERY } from "./initialData";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Upload a file to Firebase Storage
export async function uploadFile(file: File, folder: string = "uploads"): Promise<string> {
  // Generate a safe unique filename
  const fileExt = file.name.split('.').pop() || "jpg";
  const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
  const storageRef = ref(storage, `${folder}/${safeName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

// Seed services if collection is empty
export async function seedInitialDataIfNeeded() {
  try {
    let servicesSnap;
    try {
      servicesSnap = await getDocs(collection(db, "services"));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "services");
      return;
    }

    if (servicesSnap.empty) {
      console.log("Seeding services into Firestore...");
      for (const service of INITIAL_SERVICES) {
        try {
          await setDoc(doc(db, "services", service.id), service);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `services/${service.id}`);
        }
      }
    } else {
      // Ensure the packages exist in the collection
      const packagesToCheck = INITIAL_SERVICES.filter(s => s.category === "Paquetes");
      for (const p of packagesToCheck) {
        const found = servicesSnap.docs.some(doc => doc.id === p.id);
        if (!found) {
          try {
            await setDoc(doc(db, "services", p.id), p);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `services/${p.id}`);
          }
        }
      }
    }

    let gallerySnap;
    try {
      gallerySnap = await getDocs(collection(db, "gallery"));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "gallery");
      return;
    }

    if (gallerySnap.empty) {
      console.log("Seeding gallery into Firestore...");
      for (const item of INITIAL_GALLERY) {
        const { id, ...rest } = item;
        try {
          await addDoc(collection(db, "gallery"), {
            ...rest,
            createdAt: Timestamp.now()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, "gallery");
        }
      }
    }

    // Seed default bank settings if empty
    let settingsSnap;
    try {
      settingsSnap = await getDocs(collection(db, "settings"));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "settings");
      return;
    }

    if (settingsSnap.empty) {
      console.log("Seeding default settings into Firestore...");
      try {
        await setDoc(doc(db, "settings", "bank"), {
          bankName: "BBVA México",
          accountHolder: "Adrián Autovisión S.A.",
          clabe: "0121 8000 1234 5678 90",
          accountNumber: "1234 5678 90"
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "settings/bank");
      }
    }
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
}

// Fetch all active services
export async function getServices(): Promise<Service[]> {
  const path = "services";
  try {
    const q = collection(db, path);
    const snap = await getDocs(q);
    const services: Service[] = [];
    snap.forEach((d) => {
      services.push({ id: d.id, ...d.data() } as Service);
    });
    return services;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return INITIAL_SERVICES; // Fallback
  }
}

// Create a new appointment
export async function createAppointment(appointment: Omit<Appointment, "id" | "createdAt" | "status" | "commissionRate" | "commissionAmount">) {
  const path = "appointments";
  const servicePrice = Number(appointment.servicePrice) || 0;
  const travelFee = Number(appointment.travelFee) || 0;
  const total = servicePrice + travelFee;
  const commissionRate = 0.15;
  const commissionAmount = Number((total * commissionRate).toFixed(2));

  const docData: Omit<Appointment, "id"> = {
    ...appointment,
    status: "pending",
    paymentStatus: appointment.paymentStatus || "pending",
    servicePrice,
    travelFee,
    total,
    commissionRate,
    commissionAmount,
    createdAt: Timestamp.now()
  };

  try {
    const docRef = await addDoc(collection(db, path), docData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Create a custom accessory request
export async function createCustomAccessoryRequest(reqData: Omit<CustomAccessoryRequest, "id" | "createdAt" | "status">) {
  const path = "custom_accessory_requests";
  const docData: Omit<CustomAccessoryRequest, "id"> = {
    ...reqData,
    status: "pending",
    createdAt: Timestamp.now()
  };
  try {
    const docRef = await addDoc(collection(db, path), docData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Fetch bank settings
export async function getBankSettings(): Promise<BankSettings> {
  const path = "settings";
  try {
    const snap = await getDocs(collection(db, path));
    let settings: BankSettings = {
      bankName: "BBVA México",
      accountHolder: "Adrián Autovisión S.A.",
      clabe: "0121 8000 1234 5678 90",
      accountNumber: "1234 5678 90"
    };
    snap.forEach((d) => {
      if (d.id === "bank") {
        settings = d.data() as BankSettings;
      }
    });
    return settings;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return {
      bankName: "BBVA México",
      accountHolder: "Adrián Autovisión S.A.",
      clabe: "0121 8000 1234 5678 90",
      accountNumber: "1234 5678 90"
    };
  }
}

// Update bank settings
export async function updateBankSettings(settings: BankSettings) {
  const path = "settings/bank";
  try {
    await setDoc(doc(db, "settings", "bank"), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Listen to appointments in real-time
export function subscribeAppointments(callback: (appointments: Appointment[]) => void) {
  const path = "appointments";
  const q = query(collection(db, path), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const appointments: Appointment[] = [];
    snap.forEach((d) => {
      appointments.push({ id: d.id, ...d.data() } as Appointment);
    });
    callback(appointments);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

// Listen to custom accessory requests in real-time
export function subscribeCustomAccessoryRequests(callback: (requests: CustomAccessoryRequest[]) => void) {
  const path = "custom_accessory_requests";
  const q = query(collection(db, path), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const requests: CustomAccessoryRequest[] = [];
    snap.forEach((d) => {
      requests.push({ id: d.id, ...d.data() } as CustomAccessoryRequest);
    });
    callback(requests);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

// Listen to gallery items in real-time
export function subscribeGallery(callback: (items: GalleryItem[]) => void) {
  const path = "gallery";
  const q = query(collection(db, path), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items: GalleryItem[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as GalleryItem);
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

// Add gallery item
export async function addGalleryItem(item: Omit<GalleryItem, "id" | "createdAt">) {
  const path = "gallery";
  try {
    await addDoc(collection(db, path), {
      ...item,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete gallery item
export async function deleteGalleryItem(id: string) {
  const path = `gallery/${id}`;
  try {
    await deleteDoc(doc(db, "gallery", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Update appointment status or payment
export async function updateAppointmentField(id: string, fields: Partial<Appointment>) {
  const path = `appointments/${id}`;
  try {
    await updateDoc(doc(db, "appointments", id), fields);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Update custom accessory status or quoted price
export async function updateCustomAccessoryRequestField(id: string, fields: Partial<CustomAccessoryRequest>) {
  const path = `custom_accessory_requests/${id}`;
  try {
    await updateDoc(doc(db, "custom_accessory_requests", id), fields);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Create/Update/Delete Service
export async function upsertService(service: Service) {
  const path = `services/${service.id}`;
  try {
    await setDoc(doc(db, "services", service.id), service);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteService(id: string) {
  const path = `services/${id}`;
  try {
    await deleteDoc(doc(db, "services", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
