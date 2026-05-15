import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface CompatUser {
  id: string;
  uid: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  imageUrl: string | null;
  phoneNumber: string | null;
  _raw: User;
}

function toCompatUser(u: User): CompatUser {
  const name = u.displayName ?? null;
  const parts = name?.split(" ") ?? [];
  return {
    id: u.uid,
    uid: u.uid,
    fullName: name,
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
    username: u.email ? u.email.split("@")[0] : null,
    primaryEmailAddress: u.email ? { emailAddress: u.email } : null,
    imageUrl: u.photoURL,
    phoneNumber: u.phoneNumber,
    _raw: u,
  };
}

interface AuthContextValue {
  firebaseUser: User | null;
  user: CompatUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  _listeners: Set<(user: User | null) => void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const listenersRef = useRef<Set<(user: User | null) => void>>(new Set());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setIsLoaded(true);
      listenersRef.current.forEach((fn) => fn(u));
    });
    return unsub;
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        firebaseUser,
        user: firebaseUser ? toCompatUser(firebaseUser) : null,
        isLoaded,
        isSignedIn: !!firebaseUser,
        signOut,
        _listeners: listenersRef.current,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

function useAuthCtx() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuthCtx must be inside FirebaseAuthProvider");
  return ctx;
}

export function useUser() {
  const { user, isLoaded, isSignedIn } = useAuthCtx();
  return { user, isLoaded, isSignedIn };
}

export function useClerk() {
  const { signOut, _listeners } = useAuthCtx();

  const addListener = useCallback(
    (fn: (payload: { user: CompatUser | null }) => void) => {
      const wrapped = (u: User | null) => {
        fn({ user: u ? toCompatUser(u) : null });
      };
      _listeners.add(wrapped);
      return () => _listeners.delete(wrapped);
    },
    [_listeners]
  );

  return { signOut, addListener };
}

export function useAuth() {
  return useAuthCtx();
}

interface ShowProps {
  when: "signed-in" | "signed-out";
  children: ReactNode;
}

export function Show({ when, children }: ShowProps) {
  const { isSignedIn, isLoaded } = useAuthCtx();
  if (!isLoaded) return null;
  if (when === "signed-in" && isSignedIn) return <>{children}</>;
  if (when === "signed-out" && !isSignedIn) return <>{children}</>;
  return null;
}
