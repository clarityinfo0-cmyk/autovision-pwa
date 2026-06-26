import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDv4r7D6mGUN2eEVvnxc35iqbR848sRQP8",
  authDomain: "gen-lang-client-0375481035.firebaseapp.com",
  projectId: "gen-lang-client-0375481035",
  storageBucket: "gen-lang-client-0375481035.firebasestorage.app",
  messagingSenderId: "193475740874",
  appId: "1:193475740874:web:8cdb7da8a09b0caa482033"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);

// Use the specific custom firestore database if provided in config, else default
export const db = getFirestore(app, "ai-studio-c448ac26-4718-4279-b6d9-11e69a108621");

export const storage = getStorage(app);
