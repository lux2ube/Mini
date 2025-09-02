
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: "YOUR_API_KEY",
  authDomain: "cashback-56a16.firebaseapp.com",
  projectId: "cashback-56a16",
  storageBucket: "cashback-56a16.appspot.com",
  messagingSenderId: "395561662919",
  appId: "1:395561662919:web:968f700b0949d0b6748286",
  measurementId: "G-L0151593G1"
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
