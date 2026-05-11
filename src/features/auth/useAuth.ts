import { useEffect, useRef } from "react";
import { onAuthStateChanged, browserLocalPersistence, setPersistence } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";

interface FirestoreUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  plan: "free" | "pro" | "elite";
  predictionsUsed: number;
  predictionsLimit: number;
  createdAt: Date;
  lastActiveAt: Date;
}

export function useAuthListener() {
  const { setUser, setLoading } = useAppStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);

          if (firebaseUser) {
            try {
              const ref = doc(db, "users", firebaseUser.uid);
              const snap = await getDoc(ref);
              if (!snap.exists()) {
                await setDoc(ref, {
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  plan: "free",
                  predictionsUsed: 0,
                  predictionsLimit: 5,
                  createdAt: new Date(),
                  lastActiveAt: new Date(),
                }, { merge: true });
              } else {
                await setDoc(ref, {
                  lastActiveAt: new Date(),
                }, { merge: true });
              }
              const userData = snap.data() as FirestoreUser;
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email || "", displayName: firebaseUser.displayName || "User", plan: userData?.plan ?? "free", predictionsUsed: userData?.predictionsUsed ?? 0, predictionsLimit: userData?.predictionsLimit ?? 5 });
            } catch (err) {
              console.error("Firestore error:", err);
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email || "", displayName: firebaseUser.displayName || "User", plan: "free", predictionsUsed: 0, predictionsLimit: 5 });
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        }, (authError) => {
          console.error("Auth error:", authError);
          setUser(null);
          setLoading(false);
        });
      } catch (err) {
        console.error("Firebase init error:", err);
        setUser(null);
        setLoading(false);
      }
    };

    setupAuth();

    timeoutRef.current = setTimeout(() => {
      console.warn("Auth timeout - Firebase not responding");
      setUser(null);
      setLoading(false);
    }, 8000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (unsubscribe) unsubscribe();
    };
  }, []);
}