import { readFileSync } from "fs";
import { join } from "path";
import type { EventsData } from "../data/events";
import { normalizeEventsData } from "./normalizeEventsData";

export function loadEventsData(): EventsData {
  const path = join(process.cwd(), "public", "data", "events.json");
  const content = readFileSync(path, "utf-8");
  const data = JSON.parse(content) as EventsData;
  return normalizeEventsData(data);
}
