// Byteform Admin Portal - Firebase Configuration
// Connects to the unified Byteform Firebase Project

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase configuration for byteform-website
export const firebaseConfig = {
  apiKey: "AIzaSyCqpW-onC0DfN9hmMGXhI1l6501QWLX5NQ",
  authDomain: "byteform-website.firebaseapp.com",
  projectId: "byteform-website",
  storageBucket: "byteform-website.firebasestorage.app",
  messagingSenderId: "126791292420",
  appId: "1:126791292420:web:f807ce86d55ea15862c751",
  measurementId: "G-67RTVMC4NT"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
};
