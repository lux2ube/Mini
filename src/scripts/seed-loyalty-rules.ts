
import {initializeApp} from 'firebase/app';
import {getFirestore, collection, addDoc, getDocs, query } from 'firebase/firestore';
import type { PointsRule } from '@/types';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file at the root of the project
config({ path: resolve(__dirname, '../../.env') });

// IMPORTANT: Paste your Firebase project configuration here.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const defaultRules: Omit<PointsRule, 'id'>[] = [
    {
        action: 'approve_account',
        points: 50,
        isDollarBased: false,
        description: 'For linking and approving a new trading account.'
    },
    {
        action: 'cashback_earned',
        points: 1,
        isDollarBased: true,
        description: 'Earn 1 point for every $1 of cashback received.'
    },
    {
        action: 'store_purchase',
        points: 1,
        isDollarBased: true,
        description: 'Earn 1 point for every $1 spent in the store.'
    },
    {
        action: 'referral_signup',
        points: 25,
        isDollarBased: false,
        description: 'For referring a new user who signs up.'
    },
    {
        action: 'referral_becomes_active',
        points: 100,
        isDollarBased: false,
        description: 'When your referral links their first approved account.'
    },
    {
        action: 'referral_becomes_trader',
        points: 250,
        isDollarBased: false,
        description: 'When your referral receives their first cashback.'
    },
    {
        action: 'referral_commission',
        points: 1,
        isDollarBased: true,
        description: 'Earn points from your referral\'s cashback, based on your tier.'
    }
];

async function seedDefaultPointsRules() {
    console.log('Starting script to seed default loyalty points rules...');

    try {
        const rulesCollection = collection(db, 'pointsRules');
        const existingRulesSnap = await getDocs(query(rulesCollection));
        const existingActions = existingRulesSnap.docs.map(doc => doc.data().action);

        const rulesToAdd = defaultRules.filter(rule => !existingActions.includes(rule.action));

        if (rulesToAdd.length === 0) {
            console.log('All default rules already exist. No action needed.');
            return;
        }

        console.log(`Found ${rulesToAdd.length} new rules to add...`);

        for (const rule of rulesToAdd) {
            await addDoc(rulesCollection, rule);
            console.log(`Added rule for action: ${rule.action}`);
        }

        console.log('Script finished successfully. Default points rules have been seeded.');

    } catch (error) {
        console.error('An error occurred while seeding rules:', error);
    }
}

seedDefaultPointsRules().then(() => {
    console.log("Exiting script.");
    // In a local Node.js environment, you might want to explicitly exit:
    // process.exit(0);
}).catch(e => {
    console.error("Unhandled error in script:", e);
    // process.exit(1);
});
