import { readFileSync } from "fs";
import { join } from "path";
import type { EventsData } from "../data/events";
import { localizeEventTitleKo } from "./localizeEventTitle";

export function loadEventsData(): EventsData {
  const path = join(process.cwd(), "public", "data", "events.json");
  const content = readFileSync(path, "utf-8");
  const data = JSON.parse(content) as EventsData;

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
