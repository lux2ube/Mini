
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDW1ZPSML_OZTmKN35YFANaP4NdQHOPYNs",
  authDomain: "cashback-56a16.firebaseapp.com",
  projectId: "cashback-56a16",
  storageBucket: "cashback-56a16.appspot.com",
  messagingSenderId: "1090837702640",
  appId: "1:1090837702640:web:be1142b8b28a374c05df35",
  measurementId: "G-KKY66CQJ0J"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');


export { app, auth, db, googleProvider, appleProvider };
