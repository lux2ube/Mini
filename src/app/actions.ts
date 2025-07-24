
'use server';

import { generateProjectSummary } from "@/ai/flows/generate-project-summary";
import type { GenerateProjectSummaryOutput } from "@/ai/flows/generate-project-summary";
import { calculateCashback } from "@/ai/flows/calculate-cashback";
import type { CalculateCashbackInput, CalculateCashbackOutput } from "@/ai/flows/calculate-cashback";
import { auth, db } from "@/lib/firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, runTransaction, query, collection, where, getDocs, Timestamp, getDoc } from "firebase/firestore";
import { generateReferralCode } from "@/lib/referral";
import { logUserActivity, awardPoints } from "./admin/actions";
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const clientInfo = await getClientSessionInfo();

        await runTransaction(db, async (transaction) => {
            const counterRef = doc(db, 'counters', 'userCounter');
            const counterSnap = await transaction.get(counterRef);
            const lastId = counterSnap.exists() ? counterSnap.data().lastId : 100000;
            const newClientId = lastId + 1;

            let referrerProfile = null;
            if (referralCode) {
                const referrerQuery = query(collection(db, "users"), where("referralCode", "==", referralCode));
                const referrerSnapshot = await transaction.get(referrerQuery);
                if (!referrerSnapshot.empty) {
                    referrerProfile = {
                        id: referrerSnapshot.docs[0].id,
                        ...referrerSnapshot.docs[0].data(),
                    };
                }
            }

            const newUserProfileData = {
                uid: user.uid,
                name,
                email,
                role: "user",
                clientId: newClientId,
                createdAt: Timestamp.now(),
                country: clientInfo.geoInfo.country || null,
                referralCode: generateReferralCode(name),
                referredBy: referrerProfile ? referrerProfile.id : null,
                referrals: [],
                points: 0,
                tier: 'New',
                monthlyPoints: 0,
            };

            const newUserDocRef = doc(db, "users", user.uid);
            transaction.set(newUserDocRef, newUserProfileData);
            
            // Award signup points to the new user
            await awardPoints(transaction, user.uid, 'user_signup_pts');
            
            if (referrerProfile) {
                const referrerDocRef = doc(db, "users", referrerProfile.id);
                const currentReferrals = referrerProfile.referrals || [];
                transaction.update(referrerDocRef, {
                    referrals: [...currentReferrals, user.uid],
                });
                await awardPoints(transaction, referrerProfile.id, 'referral_signup');
            }

            transaction.set(counterRef, { lastId: newClientId }, { merge: true });
        });

        await logUserActivity(user.uid, 'signup', clientInfo, { method: 'email', referralCode: referralCode || null });
        
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
