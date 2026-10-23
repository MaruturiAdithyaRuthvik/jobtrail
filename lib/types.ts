export type Status = "wishlist" | "applied" | "interview" | "offer" | "rejected";

export interface Job {
  id: string;
  company: string;
  role: string;
  status: Status;
  date: string; // YYYY-MM-DD, the day it entered its current stage
  link?: string;
  notes?: string;
}

export const COLUMNS: { id: Status; label: string; hint: string; color: string }[] = [
  { id: "wishlist", label: "Wishlist", hint: "Roles you want to apply to", color: "#8b5cf6" },
  { id: "applied", label: "Applied", hint: "Waiting to hear back", color: "#0ea5e9" },
  { id: "interview", label: "Interview", hint: "In process", color: "#f59e0b" },
  { id: "offer", label: "Offer", hint: "Decide and reply", color: "#10b981" },
  { id: "rejected", label: "Closed", hint: "Not this time", color: "#94a3b8" },
];
