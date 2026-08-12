/**
 * useProfilePhoto — shared profile-photo resolution for the whole app.
 *
 * Priority: Clerk/Firebase imageUrl → localStorage (after Cloudinary upload)
 *           → default avatar for Orakzai accounts → null
 *
 * After a successful photo upload anywhere in the app, call
 * `setStoredProfilePhoto(url)` to persist to localStorage AND notify every
 * mounted component that uses this hook via a custom DOM event.
 */

import { useState, useEffect } from "react";
import { useUser } from "@/contexts/AuthContext";

const STORAGE_KEY   = "orakzai_profile_photo";
const UPDATE_EVENT  = "orakzai_photo_updated";

/** Call this after a successful Cloudinary upload (or any external photo URL). */
export function setStoredProfilePhoto(url: string): void {
  localStorage.setItem(STORAGE_KEY, url);
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: url }));
}

/** Returns the resolved photo URL (reactive to uploads and auth changes). */
export function useProfilePhoto(): string | null {
  const { user } = useUser();

  const resolve = (): string | null => {
    if (user?.imageUrl) return user.imageUrl;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    if (!email || email.includes("orakzai") || email.includes("faisalorakzai")) {
      return `${import.meta.env.BASE_URL}avatar-faisal.png`;
    }
    return null;
  };

  const [photoUrl, setPhotoUrl] = useState<string | null>(resolve);

  // Re-resolve whenever auth user changes
  useEffect(() => {
    setPhotoUrl(resolve());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.imageUrl, user?.primaryEmailAddress?.emailAddress]);

  // React instantly to in-app uploads (dispatched by setStoredProfilePhoto)
  useEffect(() => {
    const handler = (e: Event) => setPhotoUrl((e as CustomEvent<string>).detail);
    window.addEventListener(UPDATE_EVENT, handler);
    return () => window.removeEventListener(UPDATE_EVENT, handler);
  }, []);

  return photoUrl;
}
