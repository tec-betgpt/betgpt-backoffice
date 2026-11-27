import { defineStore } from "pinia";
import type { Area } from "@/navigation/registry";

const RECENTS_KEY = "elevate.v2.recent_workspaces";
const MAX_RECENTS = 5;

function readRecents(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export const useShellStore = defineStore("shell", {
  state: () => ({
    lastArea: null as Area | null,
    viewAsClient: false,
    recents: readRecents(),
    paletteOpen: false,
  }),
  actions: {
    setArea(area: Area) {
      if (area !== "account") this.lastArea = area;
    },
    rememberWorkspace(id: string) {
      this.recents = [id, ...this.recents.filter((r) => r !== id)].slice(0, MAX_RECENTS);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(this.recents));
      } catch {
        //
      }
    },
  },
});
