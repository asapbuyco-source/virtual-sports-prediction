import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, browserLocalPersistence, setPersistence } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";

interface FirestoreUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  plan: "free" | "daily" | "weekly" | "monthly" | "elite";
  predictionsUsed: number;
  predictionsLimit: number;
  createdAt: Date;
  lastActiveAt: Date;
}

const AUTH_TIMEOUT_MS = 15000;

export function useAuthListener() {
  const { setUser, setLoading } = useAppStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);

        unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }

            if (firebaseUser) {
              try {
                const ref = doc(db, "users", firebaseUser.uid);
                let snap = await getDoc(ref);

                let retries = 0;
                while (!snap.exists() && retries < 3) {
                  retries++;
                  await new Promise((r) => setTimeout(r, 800));
                  snap = await getDoc(ref);
                }

                if (snap.exists()) {
                  const userData = snap.data() as FirestoreUser;
                  await setDoc(
                    ref,
                    { lastActiveAt: serverTimestamp() },
                    { merge: true }
                  );
                  setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || "",
                    displayName: firebaseUser.displayName || userData.displayName || "User",
                    plan: userData.plan ?? "free",
                    predictionsUsed: userData.predictionsUsed ?? 0,
                    predictionsLimit: userData.predictionsLimit ?? 5,
                  });
                } else {
                  const newUser: Omit<FirestoreUser, "createdAt" | "lastActiveAt"> & {
                    createdAt: ReturnType<typeof serverTimestamp>;
                    lastActiveAt: ReturnType<typeof serverTimestamp>;
                  } = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || "",
                    displayName: firebaseUser.displayName || "User",
                    photoURL: firebaseUser.photoURL,
                    plan: "free",
                    predictionsUsed: 0 as number,
                    predictionsLimit: 5 as number,
                    createdAt: serverTimestamp() as ReturnType<typeof serverTimestamp>,
                    lastActiveAt: serverTimestamp() as ReturnType<typeof serverTimestamp>,
                  };
                  await setDoc(ref, newUser);
                  setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || "",
                    displayName: firebaseUser.displayName || "User",
                    plan: "free",
                    predictionsUsed: 0,
                    predictionsLimit: 5,
                  });
                }
              } catch (err) {
                console.error("Firestore error during auth sync:", err);
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  displayName: firebaseUser.displayName || "User",
                  plan: "free",
                  predictionsUsed: 0,
                  predictionsLimit: 5,
                });
              }
            } else {
              setUser(null);
            }
            setAuthResolved(true);
            setLoading(false);
          },
          (authError) => {
            console.error("Auth state change error:", authError);
            setUser(null);
            setAuthResolved(true);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Firebase init error:", err);
        setUser(null);
        setAuthResolved(true);
        setLoading(false);
      }
    };

    timeoutRef.current = setTimeout(() => {
      if (!authResolved) {
        console.warn("Auth timeout - Firebase not responding, continuing anyway");
        setAuthResolved(true);
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    setupAuth();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return authResolved;
}