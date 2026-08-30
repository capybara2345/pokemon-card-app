import type { EventsData } from "../data/events";
import { localizeEventTitleKo } from "./localizeEventTitle";

function hasHangul(text: string): boolean {
  return /[\uAC00-\uD7A3]/.test(text);
}

export function normalizeEventsData(data: EventsData): EventsData {
  return {
    ...data,
    events: data.events.map((event) => {
      const en = event.title.en;
      const existingKo = event.title.ko?.trim() ?? "";
      // 이미 한글로 손본 제목은 자동 로컬라이즈로 덮지 않음
      const ko =
        hasHangul(existingKo) && existingKo !== en
          ? existingKo
          : localizeEventTitleKo(en);

      return {
        ...event,
        title: { en, ko },
      };
    }),
    tentativeEvents: data.tentativeEvents,
    tentativeMeta: data.tentativeMeta,
  };
}
