
'use server';

import { generateProjectSummary } from "@/ai/flows/generate-project-summary";
import type { GenerateProjectSummaryOutput } from "@/ai/flows/generate-project-summary";
import { calculateCashback } from "@/ai/flows/calculate-cashback";
import type { CalculateCashbackInput, CalculateCashbackOutput } from "@/ai/flows/calculate-cashback";
import { auth, db } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, runTransaction, query, collection, where, getDocs, Timestamp, getDoc } from "firebase/firestore";
import { generateReferralCode } from "@/lib/referral";
import { logUserActivity, awardPoints, getLoyaltyTiers } from "./admin/actions";
import { getClientSessionInfo } from "@/lib/device-info";


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
        // Step 1: Create user in Firebase Auth first. This is outside the transaction.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const clientInfo = await getClientSessionInfo();
        const finalReferralCode = (referralCode || '').trim();

        // Step 2: Fetch loyalty tiers BEFORE the transaction.
        const loyaltyTiers = await getLoyaltyTiers();

        // Step 3: Run all Firestore writes in a single atomic transaction.
        await runTransaction(db, async (transaction) => {
            let referrerProfile: { uid: string, data: any } | null = null;
            let referrerTier = null;

            // Find referrer if a code was provided
            if (finalReferralCode) {
                const referrerQuery = query(collection(db, "users"), where("referralCode", "==", finalReferralCode));
                const referrerSnapshot = await transaction.get(referrerQuery);
                if (!referrerSnapshot.empty) {
                    const doc = referrerSnapshot.docs[0];
                    referrerProfile = { uid: doc.id, data: doc.data() };
                    referrerTier = loyaltyTiers.find(t => t.name === referrerProfile?.data.tier) || loyaltyTiers[0];
                } else {
                    console.warn("Referral code not found:", finalReferralCode);
                }
            }

            // Get the next client ID
            const counterRef = doc(db, 'counters', 'userCounter');
            const counterSnap = await transaction.get(counterRef);
            const lastId = counterSnap.exists() ? counterSnap.data().lastId : 100000;
            const newClientId = lastId + 1;

            // Prepare the new user's profile
            const newUserDocRef = doc(db, "users", user.uid);
            const newUserProfileData = {
                uid: user.uid,
                name,
                email,
                role: "user",
                clientId: newClientId,
                createdAt: Timestamp.now(),
                country: clientInfo.geoInfo.country || null,
                referralCode: generateReferralCode(name),
                referredBy: referrerProfile ? referrerProfile.uid : null,
                referrals: [],
                points: 0,
                tier: 'New',
                monthlyPoints: 0,
            };
            
            // --- Execute all writes ---
            
            // 1. Create the new user's document.
            transaction.set(newUserDocRef, newUserProfileData);

            // 2. Award signup points to the new user.
            const userTier = loyaltyTiers.find(t => t.name === 'New')!;
            await awardPoints(transaction, user.uid, 'user_signup_pts', userTier);

            // 3. Update the referrer if they exist.
            if (referrerProfile && referrerTier) {
                const referrerDocRef = doc(db, "users", referrerProfile.uid);
                const currentReferrals = referrerProfile.data.referrals || [];
                transaction.update(referrerDocRef, {
                    referrals: [...currentReferrals, user.uid],
                });
                // Award points to the referrer for the new signup.
                await awardPoints(transaction, referrerProfile.uid, 'referral_signup', referrerTier);
            }

            // 4. Update the client ID counter.
            transaction.set(counterRef, { lastId: newClientId }, { merge: true });
        });

        // Step 4: Log the successful signup activity.
        await logUserActivity(user.uid, 'signup', clientInfo, { method: 'email', referralCode: finalReferralCode || null });

        return { success: true, userId: user.uid };

    } catch (error: any) {
        console.error("Registration Error: ", error);
        let errorMessage = "An unexpected error occurred during registration.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email is already in use. Please log in.";
        }
        return { success: false, error: errorMessage };
    }
}
