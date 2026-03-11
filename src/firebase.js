import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDBkzK2229sMJFpSxMARXUG_IsL0GM2mB4",
  authDomain: "pluggedin-10bb9.firebaseapp.com",
  projectId: "pluggedin-10bb9",
  storageBucket: "pluggedin-10bb9.firebasestorage.app",
  messagingSenderId: "843974865819",
  appId: "1:843974865819:web:702b034f33fbba4173a73e",
  measurementId: "G-DGSZVQV4CE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
