import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push, type Database } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCZ6gQrqccSRE04krhPIAalncvp3CeB9_c",
  authDomain: "urbanexusai.firebaseapp.com",
  projectId: "urbanexusai",
  storageBucket: "urbanexusai.firebasestorage.app",
  messagingSenderId: "817968172770",
  appId: "1:817968172770:web:9ffed8a43eb28ecf4798bb",
  measurementId: "G-5YQWQDKKQ5",
  databaseURL: "https://urbanexusai-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Initialize Analytics (only in browser)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };

// Helper to write data to Firebase
export const writeData = async (path: string, data: unknown) => {
  const dbRef = ref(database, path);
  await set(dbRef, data);
};

// Helper to push data to Firebase (auto-generated key)
export const pushData = async (path: string, data: unknown) => {
  const dbRef = ref(database, path);
  return await push(dbRef, data);
};

// Helper to subscribe to realtime data
export const subscribeToData = (
  path: string, 
  callback: (data: unknown) => void
) => {
  const dbRef = ref(database, path);
  return onValue(dbRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export default app;
