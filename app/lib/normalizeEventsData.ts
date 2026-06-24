import type { EventsData } from "../data/events";
import { localizeEventTitleKo } from "./localizeEventTitle";

export function normalizeEventsData(data: EventsData): EventsData {
  return {
    ...data,
    events: data.events.map((event) => ({
      ...event,
      title: {
        en: event.title.en,
        ko: localizeEventTitleKo(event.title.en),
      },
    })),
  };
}
