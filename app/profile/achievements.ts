import type { Profile } from "./ProfileContext";

export type Achievement = {
  id: string;
  name: string;
  detail: string;
  icon: string;
  earned: boolean;
  /** 0-1 toward earning it, for the ones with a natural runway. */
  progress?: number;
};

type Inputs = {
  tickets: number;
  accuracy: number | null;
  graded: number;
  profile: Profile;
};

// Derived from data already tracked rather than stored separately, so an
// achievement can never disagree with the numbers in the HUD.
export function buildAchievements({ tickets, accuracy, graded, profile }: Inputs): Achievement[] {
  const acc = accuracy ?? 0;
  return [
    {
      id: "first-blood",
      name: "First Answer",
      detail: "Answer your first graded question.",
      icon: "★",
      earned: graded >= 1,
      progress: Math.min(1, graded / 1),
    },
    {
      id: "ticket-25",
      name: "Ticket Roll",
      detail: "Earn 25 tickets.",
      icon: "🎟",
      earned: tickets >= 25,
      progress: Math.min(1, tickets / 25),
    },
    {
      id: "ticket-100",
      name: "Assessment Ready",
      detail: "Earn 100 tickets.",
      icon: "🏆",
      earned: tickets >= 100,
      progress: Math.min(1, tickets / 100),
    },
    {
      id: "acc-60",
      name: "Reliable",
      detail: "Hold 60% accuracy over 20+ questions.",
      icon: "◎",
      earned: acc >= 60 && graded >= 20,
      progress: Math.min(1, graded / 20),
    },
    {
      id: "acc-80",
      name: "Sharp",
      detail: "Hold 80% accuracy over 50+ questions.",
      icon: "◆",
      earned: acc >= 80 && graded >= 50,
      progress: Math.min(1, graded / 50),
    },
    {
      id: "streak-7",
      name: "Week Streak",
      detail: "Log in 7 days in a row.",
      icon: "🔥",
      earned: profile.streak >= 7,
      progress: Math.min(1, profile.streak / 7),
    },
    {
      id: "multi-track",
      name: "Cross-Trained",
      detail: "Prep for two or more tracks at once.",
      icon: "⚑",
      earned: profile.tracks.length >= 2,
    },
    {
      id: "daily",
      name: "Daily Driver",
      detail: "Answer a daily challenge.",
      icon: "☀",
      earned: profile.dailyAttempted !== "",
    },
  ];
}
