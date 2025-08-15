
'use server';

import { generateProjectSummary } from "@/ai/flows/generate-project-summary";
import type { GenerateProjectSummaryOutput } from "@/ai/flows/generate-project-summary";
import { calculateCashback } from "@/ai/flows/calculate-cashback";
import type { CalculateCashbackInput, CalculateCashbackOutput } from "@/ai/flows/calculate-cashback";
import { auth, db } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword, UserCredential } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
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


export async function handleRegisterUser(formData: { name: string, email: string, password: string }) {
    const { name, email, password } = formData;
    let userCredential: UserCredential | undefined;

    try {
        // Step 1: Create the user in Firebase Auth.
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Step 2: Create the user's profile in Firestore.
        // This is a minimal profile. All other fields can be added later.
        const newUserProfileData = {
            uid: user.uid,
            name,
            email,
            role: "user",
            createdAt: Timestamp.now(),
            points: 0,
            tier: 'New',
            monthlyPoints: 0,
            referrals: [],
            referralCode: generateReferralCode(name),
            referredBy: null,
        };

        await setDoc(doc(db, "users", user.uid), newUserProfileData);
        
        // Step 3: Success.
        return { success: true, userId: user.uid };

    } catch (error: any) {
        // If any step fails, especially the database write, this block will execute.
        // We should delete the auth user to allow them to try again.
        if (userCredential) {
            await userCredential.user.delete();
        }
        
        console.error("Registration Error: ", error);
        
        // Provide a more specific error message if available
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, error: "This email is already in use. Please log in." };
        }
        
        return { success: false, error: "An unexpected error occurred during registration. Please try again." };
    }
}
