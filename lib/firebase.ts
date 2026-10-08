import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase web configuration. These values identify the public web app;
// access is protected by Firebase Authentication and Realtime Database rules.
const firebaseConfig = {
  apiKey: "AIzaSyAdS8GfcrB_GnPbXn_eRxhgE6cKcwC",
  authDomain: "volio-data.firebaseapp.com",
  databaseURL: "https://volio-data-default-rtdb.firebaseio.com",
  projectId: "volio-data",
  storageBucket: "volio-data.firebasestorage.app",
  messagingSenderId: "815692358976",
  appId: "1:815692358976:web:39c77604e2d40c8ee086a5",
  measurementId: "G-4R19CLMBFF"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
