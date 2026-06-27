/**
 * Configuration module to centralize, sanitize, and validate environment variables.
 * This prevents common copy-paste issues like leading/trailing spaces, quotes, or equals signs.
 */

/**
 * Clean up environment variable values by removing trailing/leading whitespace,
 * surrounding quotes, and leading '=' signs if any.
 */
export function sanitizeEnvValue(val: string | undefined, fallback: string = ""): string {
  if (!val) return fallback;
  let clean = val.trim();
  
  // Clean common copy-paste errors (like leading equals sign or surrounding quotes)
  if (clean.startsWith("=")) {
    clean = clean.substring(1).trim();
  }
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.substring(1, clean.length - 1).trim();
  }
  
  return clean || fallback;
}

// Read raw environment variables using import.meta.env
const env = (import.meta as any).env || {};

export const config = {
  firebase: {
    apiKey: sanitizeEnvValue(env.VITE_FIREBASE_API_KEY, "AIzaSyDv4r7D6mGUN2eEVvnxc35iqbR848sRQP8"),
    authDomain: sanitizeEnvValue(env.VITE_FIREBASE_AUTH_DOMAIN, "gen-lang-client-0375481035.firebaseapp.com"),
    projectId: sanitizeEnvValue(env.VITE_FIREBASE_PROJECT_ID, "gen-lang-client-0375481035"),
    storageBucket: sanitizeEnvValue(env.VITE_FIREBASE_STORAGE_BUCKET, "gen-lang-client-0375481035.firebasestorage.app"),
    messagingSenderId: sanitizeEnvValue(env.VITE_FIREBASE_MESSAGING_SENDER_ID, "193475740874"),
    appId: sanitizeEnvValue(env.VITE_FIREBASE_APP_ID, "1:193475740874:web:8cdb7da8a09b0caa482033"),
    databaseId: sanitizeEnvValue(env.VITE_FIREBASE_DATABASE_ID, "ai-studio-c448ac26-4718-4279-b6d9-11e69a108621"),
  },
  isProd: env.PROD || false,
  isDev: env.DEV || false,
};
