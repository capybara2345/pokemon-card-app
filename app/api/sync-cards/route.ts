import { NextResponse } from "next/server";
import { collection, writeBatch, doc, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { fetchCards } from "../../lib/fetchCards";
import { auth } from "../../../auth";

// Firestore 배치 최대 한도
const BATCH_SIZE = 499;

const ADMIN_EMAILS = (process.env.SYNC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST() {
  const session = await auth();
  const userEmail = session?.user?.email?.toLowerCase() ?? "";

  if (!userEmail || (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(userEmail))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const cards = await fetchCards();

    if (cards.length === 0) {
      return NextResponse.json({ error: "No cards fetched from Google Sheets" }, { status: 400 });
    }

    const cardsCol = collection(db, "cards");

    // 기존 문서 전부 삭제
    const existing = await getDocs(cardsCol);
    for (let i = 0; i < existing.docs.length; i += BATCH_SIZE) {
      const chunk = existing.docs.slice(i, i + BATCH_SIZE);
      const deleteBatch = writeBatch(db);
      for (const d of chunk) {
        deleteBatch.delete(d.ref);
      }
      await deleteBatch.commit();
    }

    // 새 데이터 업로드
    let written = 0;
    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      const chunk = cards.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const card of chunk) {
        const id = String(card.ID);
        const ref = doc(cardsCol, id);
        batch.set(ref, card);
      }

      await batch.commit();
      written += chunk.length;
    }

    return NextResponse.json({
      success: true,
      deleted: existing.docs.length,
      written,
      total: cards.length,
    });
  } catch (err) {
    console.error("sync-cards error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
