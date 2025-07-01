import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDI9CU1MxqVKTil1kIGEvKXAU7E51txDBg",
  authDomain: "vs1-47131.firebaseapp.com",
  projectId: "vs1-47131",
  storageBucket: "vs1-47131.appspot.com",
  messagingSenderId: "1040278228647",
  appId: "1:1040278228647:web:7533412f2e62838b65d582"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
