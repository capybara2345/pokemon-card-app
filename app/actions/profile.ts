"use server";

import { auth } from "@/auth";
import { getAdminDb } from "@/app/lib/firebaseAdmin";

export type UserProfile = {
  friendId?: string;
  updatedAt?: string;
};

export async function getProfile(): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const db = getAdminDb();
  const doc = await db.doc(`users/${session.user.email}/profile/default`).get();
  if (!doc.exists) {
    return { success: true, profile: {} };
  }

  const data = doc.data() as UserProfile;
  return { success: true, profile: data };
}

export async function updateProfile(
  profile: UserProfile
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const db = getAdminDb();
  const now = new Date().toISOString();
  await db.doc(`users/${session.user.email}/profile/default`).set(
    { ...profile, updatedAt: now },
    { merge: true }
  );
  return { success: true };
}
