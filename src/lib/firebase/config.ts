
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDW1ZPSML_OZTmKN35YFANaP4NdQHOPYNs",
  authDomain: "cashback-56a16.firebaseapp.com",
  projectId: "cashback-56a16",
  storageBucket: "cashback-56a16.appspot.com",
  messagingSenderId: "1090837702640",
  appId: "1:1090837702640:web:be1142b8b28a374c05df35",
  measurementId: "G-KKY66CQJ0J"
};

// This function safely initializes the Firebase app, preventing re-initialization
function initializeClientApp() {
    if (getApps().length > 0) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

// We will call initializeClientApp() from a client component (AuthProvider)
// to ensure it only runs in the browser.

const app = initializeClientApp();
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

export { app, auth, db, googleProvider, appleProvider, initializeClientApp };
