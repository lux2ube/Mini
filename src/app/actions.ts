

'use server';

import { generateProjectSummary } from "@/ai/flows/generate-project-summary";
import type { GenerateProjectSummaryOutput } from "@/ai/flows/generate-project-summary";
import { calculateCashback } from "@/ai/flows/calculate-cashback";
import type { CalculateCashbackInput, CalculateCashbackOutput } from "@/ai/flows/calculate-cashback";
import { auth, db } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword, signOut, deleteUser, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, Timestamp, runTransaction, query, where, getDocs, collection, updateDoc, arrayUnion } from "firebase/firestore";
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

    let referrerData: { id: string; ref: any; } | null = null;

    if (referralCode) {
        const q = query(collection(db, 'users'), where('referralCode', '==', referralCode));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return { success: false, error: "The referral code you entered is not valid." };
        }
        const referrerDoc = querySnapshot.docs[0];
        referrerData = { id: referrerDoc.id, ref: referrerDoc.ref };
    }

    let userCredential;
    try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await runTransaction(db, async (transaction) => {
            const counterRef = doc(db, 'counters', 'userCounter');
            const counterSnap = await transaction.get(counterRef);
            const lastId = counterSnap.exists() ? counterSnap.data().lastId : 100000;
            const newClientId = lastId + 1;

            const newUserRef = doc(db, "users", user.uid);
            transaction.set(newUserRef, {
                // No 'uid' field here, it's the document ID
                name,
                email,
                clientId: newClientId,
                role: "user",
                status: "NEW", // Default status for new users
                createdAt: Timestamp.now(),
                referralCode: generateReferralCode(name),
                referredBy: referrerData ? referrerData.id : null,
                referrals: [],
                level: 1,
                monthlyEarnings: 0,
            });

            if (referrerData) {
                transaction.update(referrerData.ref, {
                    referrals: arrayUnion(user.uid)
                });
            }
            
            transaction.set(counterRef, { lastId: newClientId }, { merge: true });
        });

        return { success: true, userId: user.uid };

    } catch (error: any) {
        if (userCredential) {
            await deleteUser(userCredential.user);
        }

        console.error("Registration Error: ", error);
        
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, error: "This email is already in use. Please log in." };
        }
        
        return { success: false, error: "An unexpected error occurred during registration. Please try again." };
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

export async function handleForgotPassword(email: string) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error: any) {
        console.error("Forgot Password Error: ", error);
        if (error.code === 'auth/user-not-found') {
            return { success: false, error: "No user found with this email address." };
        }
        return { success: false, error: "An unexpected error occurred. Please try again." };
    }
}
