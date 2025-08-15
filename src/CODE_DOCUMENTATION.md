
# Project Code Documentation

This document provides a detailed explanation of the project's source code, file by file. It is intended to help developers understand the application's structure, logic, and dependencies for long-term maintenance.

---

## 1. File Name: `src/app/actions.ts`

**Short description:** This file contains the primary server-side functions (Next.js Server Actions) that handle core application logic, such as user registration and AI-powered calculations.

### Overall Role

This file acts as the bridge between the user interface (client-side components) and the backend services (Firebase, Genkit AI). It exposes secure, callable functions that can be used directly from React components without needing to create separate API endpoints. Its main responsibilities include handling user registration, managing user logout, and executing Genkit AI flows for business logic. It directly interacts with `firebase/config.ts` for database and authentication services and with the AI flows defined in `src/ai/flows/`.

### Line-by-Line / Block Explanation

#### **Block: Imports**
```typescript
'use server';

import { generateProjectSummary } from "@/ai/flows/generate-project-summary";
// ... other imports
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
// ... other imports
```
**Explanation:**
- `'use server';`: Declares that all functions in this file are Next.js Server Actions, meaning they execute exclusively on the server.
- `import ... from "@/ai/flows/...";`: Imports the AI-powered functions (`generateProjectSummary`, `calculateCashback`) and their associated data types from the Genkit flows.
- `import ... from "firebase/auth";`: Imports specific functions from the Firebase Auth SDK for user creation and sign-out.
- `import ... from "firebase/firestore";`: Imports specific functions from the Firestore SDK for database operations like creating documents (`setDoc`).

#### **Block: `handleGenerateSummary` Function**
```typescript
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
```
**Explanation:**
- `export async function handleGenerateSummary(...)`: Defines an asynchronous server action to generate a project summary.
- `await generateProjectSummary(projectData)`: Calls the Genkit AI flow with hardcoded project data.
- `return { summary: result.summary, error: null };`: If successful, returns the generated summary.
- `catch (e)`: Catches any errors during the AI flow execution and returns a structured error message.


#### **Block: `handleRegisterUser` Function (Simplified)**
```typescript
export async function handleRegisterUser(formData: { name:string, email: string, password: string }) {
    const { name, email, password } = formData;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            email,
            role: "user",
            createdAt: Timestamp.now(),
            referralCode: generateReferralCode(name),
            referredBy: null,
            referrals: [],
            points: 0,
            tier: 'New',
            monthlyPoints: 0,
        });
        
        return { success: true, userId: user.uid };

    } catch (error: any) {
        // ... error handling
    }
}
```
**Explanation:**
- `export async function handleRegisterUser(...)`: Defines an asynchronous server action that accepts user registration data.
- `await createUserWithEmailAndPassword(auth, email, password);`: Creates a new user in the Firebase Authentication system. This is the first critical step.
- `const user = userCredential.user;`: Extracts the newly created user object, which contains the unique user ID (`uid`).
- `await setDoc(doc(db, "users", user.uid), { ... });`: Creates a new document in the `users` collection in Firestore. The document's ID is set to the new user's `uid`, linking the Auth record to the database profile. This object defines the initial data for the user's profile.
- `return { success: true, userId: user.uid };`: If both user creation and profile creation succeed, it returns a success object.
- `if (error.code === 'auth/email-already-in-use')`: Specifically checks if the error was because the email is already registered and provides a user-friendly message.

#### **Block: `handleLogout` Function**
```typescript
export async function handleLogout() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Logout Error: ", error);
        return { success: false, error: "Failed to log out." };
    }
}
```
**Explanation:**
- `export async function handleLogout()`: Defines an asynchronous server action to handle user logout.
- `await signOut(auth);`: Calls the Firebase SDK function to sign the current user out, clearing their session from the client.

### Important Notes

- **'use server' Directive:** This is crucial. It ensures this code only ever runs on the server, protecting sensitive logic and environment variables from being exposed to the client's browser.
- **Simplified Registration:** The `handleRegisterUser` function is intentionally simplified to ensure maximum reliability. It performs only the two most critical steps: creating the auth user and the database profile. More complex logic (like awarding referral points) was removed to prevent transactional failures.
- **Error Handling:** The `try...catch` blocks are essential for providing clear feedback to the user.

### Summary

This file is the central hub for server-side user actions. It securely handles new user registration, AI calculations, and provides a reliable mechanism for users to log out.

---
## 2. File Name: `src/app/admin/actions.ts`

**Short description:** This file is the primary backend for all administrative functionalities. It contains a large collection of server actions for managing every aspect of the application, from users and transactions to store products and loyalty programs.

### Overall Role

This file acts as the secure API layer for the admin dashboard. Every function exported from this file is a Next.js Server Action, callable only from server components or trusted client components within the admin section. It directly interfaces with the Firestore database to perform Create, Read, Update, and Delete (CRUD) operations on all major data collections. It is the single source of truth for business logic like awarding points, approving withdrawals, and managing content.

### Line-by-Line / Block Explanation

#### **Block: `logUserActivity` Function**
```typescript
export async function logUserActivity(
    userId: string, 
    event: ActivityLog['event'], 
    clientInfo: { deviceInfo: DeviceInfo, geoInfo: GeoInfo },
    details?: Record<string, any>,
) {
    // ... logic to create logEntry object ...
    await addDoc(collection(db, 'activityLogs'), logEntry);
}
```
**Explanation:**
- This function logs significant user actions (like 'login', 'signup') to the `activityLogs` collection in Firestore.
- It captures the user's ID, the event type, and detailed client information (IP, browser, OS, location) for security and auditing purposes.

#### **Block: `awardPoints` Function**
```typescript
export async function awardPoints(
    transaction: Transaction,
    userId: string,
    action: PointsRuleAction,
    amountValue?: number
) {
    // ... logic to determine points based on action ...
    const userRef = doc(db, 'users', userId);
    transaction.update(userRef, {
        points: increment(pointsToAward),
        monthlyPoints: increment(pointsToAward)
    });
    // ... logic to create notification ...
}
```
**Explanation:**
- This is the core points-awarding engine. It is designed to be called **within a Firestore transaction**.
- It takes a `userId` and an `action` (e.g., 'approve_account', 'cashback_earned') as input.
- It calculates the correct number of points based on a predefined set of rules.
- It updates the user's total points (`points`) and monthly points (`monthlyPoints`) in a single, atomic operation.
- It also creates a notification for the user to inform them of the points they've earned.

#### **Block: CRUD Functions (e.g., `addBroker`, `updateBroker`, `deleteBroker`)**
```typescript
export async function addBroker(data: Omit<Broker, 'id' | 'order'>) {
    // ... logic ...
    await addDoc(collection(db, 'brokers'), { ... });
}
export async function updateBroker(brokerId: string, data: Partial<Omit<Broker, 'id'>>) {
    // ... logic ...
    await updateDoc(brokerRef, data);
}
```
**Explanation:**
- The file contains dozens of functions that follow a standard CRUD (Create, Read, Update, Delete) pattern for managing collections like `brokers`, `products`, `users`, `blogPosts`, etc.
- Each function performs a specific action and returns a success/error object to the admin frontend.

#### **Block: Transactional Operations (e.g., `updateTradingAccountStatus`, `placeOrder`)**
```typescript
export async function updateTradingAccountStatus(accountId: string, status: 'Approved' | 'Rejected', reason?: string) {
    return runTransaction(db, async (transaction) => {
        // ... get documents ...
        // ... perform updates ...
        transaction.update(accountRef, updateData);
        // ... award points and create notifications ...
    });
}
```
**Explanation:**
- For complex operations that involve multiple database writes, the code correctly uses `runTransaction`.
- This ensures that all steps within the operation (e.g., updating an account's status, awarding points, creating a notification) either all succeed together or all fail, preventing data inconsistency. This is a critical pattern for reliability.

### Important Notes

- **Security:** Since these actions perform sensitive operations, they are intended to be used only within the admin dashboard, which is protected by the `AdminGuard`.
- **Firestore Transactions:** The use of transactions is vital for maintaining data integrity, especially in functions like `addCashbackTransaction` and `placeOrder` where multiple documents need to be updated atomically.
- **Dependencies:** This file is heavily dependent on the Firestore database (`db`) and the data structures defined in `src/types/index.ts`.

### Summary

`src/app/admin/actions.ts` is the engine of the admin panel, providing a secure and comprehensive set of server-side functions for managing all aspects of the application's data and business logic.

---
## 3. File Name: `src/hooks/useAuthContext.tsx`

**Short description:** This file defines a React Context and Provider for managing global authentication state across the entire application.

### Overall Role

This is one of the most fundamental files in the client-side application. It creates an `AuthContext` that provides all child components with information about the currently logged-in user and the loading status of the authentication process. It uses Firebase's `onAuthStateChanged` listener to automatically detect when a user logs in or out, and it enriches the basic Firebase user object with their detailed profile from the Firestore database.

### Line-by-Line / Block Explanation

#### **Block: `AppUser` Interface and `AuthContextType`**
```typescript
export interface AppUser extends FirebaseAuthUser {
    profile?: UserProfile;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  refetchUserData: () => void;
}
```
**Explanation:**
- `AppUser`: Extends the default Firebase user object to include our custom `UserProfile` from Firestore. This means `user.profile` will contain data like their role, points, tier, etc.
- `AuthContextType`: Defines the shape of the data that the context will provide to its consumers: the `user` object, a boolean `isLoading` flag, and a function `refetchUserData` to manually trigger a data refresh.

#### **Block: `AuthProvider` Component**
```typescript
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // ... fetchUserData function ...

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // ... logic to call fetchUserData or set user to null ...
    });
    // ... event listener for refetch ...
    return () => { /* cleanup */ };
  }, [fetchUserData]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
```
**Explanation:**
- `const [user, setUser]` and `const [isLoading, setIsLoading]`: These are the core state variables of the provider. `isLoading` is crucial for preventing UI flashes or incorrect redirects while Firebase is checking the auth state.
- `useEffect(() => { ... }, [fetchUserData])`: This is the main effect hook. It sets up the `onAuthStateChanged` listener when the component mounts.
- `onAuthStateChanged(auth, (firebaseUser) => { ... })`: This is the Firebase SDK's real-time listener. It automatically fires whenever a user logs in or logs out.
- Inside the listener, it calls `fetchUserData` if a user is detected, or sets the `user` state to `null` if they log out.
- `return () => { unsubscribe(); ... }`: This is the cleanup function. When the component unmounts, it detaches the listener to prevent memory leaks.

#### **Block: `fetchUserData` and `refetchUserData` Functions**
```typescript
const fetchUserData = useCallback(async (firebaseUser: FirebaseAuthUser) => {
    // ...
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userProfile = userDocSnap.exists() ? ... : undefined;
    setUser({ ...firebaseUser, profile: userProfile });
    // ...
}, []);

const refetchUserData = useCallback(() => { ... }, [fetchUserData]);
```
**Explanation:**
- `fetchUserData`: This function is responsible for getting the user's profile from the `users` collection in Firestore using their `uid`.
- It then merges the Firebase auth data (`firebaseUser`) with the Firestore profile data (`userProfile`) into a single `AppUser` object and updates the state.
- `refetchUserData`: This is a helper function exposed by the context. Other components can call it to manually trigger a refresh of the user's profile data (e.g., after they update their name).

### Important Notes

- **Context Provider:** The entire application (or at least the parts that need authentication) must be wrapped in the `<AuthProvider>` component for this system to work. This is typically done in a root layout file.
- **`AuthGuard`:** This context is used by guard components (like `AuthGuard` and `AdminGuard`) to protect routes and redirect unauthenticated or unauthorized users.
- **Asynchronous Nature:** It is critical to use the `isLoading` flag. Components should not attempt to access `user` data until `isLoading` is `false`, as the `user` object will be `null` during the initial check.

### Summary

`useAuthContext` provides a clean, robust, and centralized way to manage user authentication state. It listens for auth changes, fetches and attaches the user's database profile, and makes the complete user object and loading status available to any component that needs it.
