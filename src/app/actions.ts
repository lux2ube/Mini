

'use server';

import { generateProjectSummary } from "@/ai/flows/generate-project-summary";
import type { GenerateProjectSummaryOutput } from "@/ai/flows/generate-project-summary";
import { calculateCashback } from "@/ai/flows/calculate-cashback";
import type { CalculateCashbackInput, CalculateCashbackOutput } from "@/ai/flows/calculate-cashback";
import { auth, db } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, Timestamp, runTransaction, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { generateReferralCode } from "@/lib/referral";


// Hardcoded data based on https://github.com/tcb4dev/cashback1
const projectData = {
    projectDescription: "A cashback calculation system in Go that processes customer transactions. It determines cashback rewards based on a set of configurable rules, including handling for blacklisted Merchant Category Codes (MCCs). The system is exposed via a RESTful API.",
    architectureDetails: "The project is a single microservice built in Go. It exposes a REST API for calculating cashback. The core logic is encapsulated within a rules engine that evaluates transactions against a list of rules to determine the final cashback amount. It has handlers for different API endpoints, and a main function to set up the server.",
    technologyDetails: "The backend is written entirely in Go. It uses the `gorilla/mux` library for HTTP routing and request handling. The project has no external database dependencies mentioned in the repository, suggesting it might be stateless or store data in memory/files.",
    mainGoals: "The main goal is to provide a reliable and efficient service for calculating cashback on transactions. It aims to be flexible through a rule-based system and provide a clear API for integration into larger e-commerce or financial platforms.",
};

export async function handleGenerateSummary(): Promise<{ summary: string | null; error: string | null }> {
    try {
        const result: GenerateProjectSummaryOutput = await generateProjectSummary(projectData);
        if (result && result.summary) {
            return { summary: result.summary, error: null };
        }
        return { summary: null, error: "Failed to generate summary." };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        return { summary: null, error: `An error occurred: ${errorMessage}` };
    }
}


export async function handleCalculateCashback(input: CalculateCashbackInput): Promise<{ result: CalculateCashbackOutput | null; error: string | null }> {
    try {
        const result: CalculateCashbackOutput = await calculateCashback(input);
        if (result) {
            return { result, error: null };
        }
        return { result: null, error: "Failed to calculate cashback." };
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        return { result: null, error: `An error occurred: ${errorMessage}` };
    }
}

export async function handleRegisterUser(formData: { name: string, email: string, password: string, referralCode?: string }) {
    const { name, email, password, referralCode } = formData;

    try {
        // Step 1: Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Step 2: Use a transaction to ensure all database operations succeed or fail together.
        await runTransaction(db, async (transaction) => {
            const usersRef = collection(db, "users");
            const counterRef = doc(db, 'counters', 'userCounter');
            
            let referrerId: string | null = null;
            let referrerRef = null;

            // Step 2a: Validate referral code if provided
            if (referralCode) {
                const q = query(usersRef, where("referralCode", "==", referralCode.toUpperCase()));
                const querySnapshot = await transaction.get(q);
                
                if (querySnapshot.empty) {
                    throw new Error("Invalid referral code."); // This will abort the transaction
                } else {
                    const referrerDoc = querySnapshot.docs[0];
                    referrerId = referrerDoc.id;
                    referrerRef = referrerDoc.ref;
                }
            }

            // Step 2b: Get the next client ID from the counter
            const counterSnap = await transaction.get(counterRef);
            const lastId = counterSnap.exists() ? counterSnap.data().lastId : 100000;
            const newClientId = lastId + 1;
            
            // Step 2c: Create the new user's document
            const newUserRef = doc(usersRef, user.uid);
            transaction.set(newUserRef, {
                uid: user.uid,
                name,
                email,
                role: "user",
                clientId: newClientId,
                createdAt: Timestamp.now(),
                referralCode: generateReferralCode(name),
                referredBy: referrerId,
                referrals: [],
                points: 0,
                tier: 'New',
                monthlyPoints: 0,
            });

            // Step 2d: Update the counter
            transaction.set(counterRef, { lastId: newClientId }, { merge: true });

            // Step 2e: If there was a referrer, update their document
            if (referrerRef) {
                transaction.update(referrerRef, {
                    referrals: arrayUnion(user.uid)
                });
            }
        });
        
        return { success: true, userId: user.uid };

    } catch (error: any) {
        console.error("Registration Error: ", error);

        // This will delete the user from Auth if the transaction fails
        if (auth.currentUser && auth.currentUser.email === email) {
            await auth.currentUser.delete();
            console.log(`Cleaned up partially registered user: ${email}`);
        }

        if (error.code === 'auth/email-already-in-use') {
            return { success: false, error: "This email is already in use. Please log in." };
        }
        if (error.message === 'Invalid referral code.') {
            return { success: false, error: 'The referral code you entered is not valid.' };
        }
        
        return { success: false, error: "An unexpected error occurred during registration." };
    }
}


export async function handleLogout() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Logout Error: ", error);
        return { success: false, error: "Failed to log out." };
    }
}
