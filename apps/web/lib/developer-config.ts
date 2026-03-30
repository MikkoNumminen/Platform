export const DEVELOPER_TAGS = [
  "master",
  "coder",
  "artist",
  "storyteller",
  "architect",
  "scout",
  "advisor",
] as const;

export type DeveloperTag = (typeof DEVELOPER_TAGS)[number];

export const DEVELOPER_TAG_LABELS: Record<string, string> = {
  master: "Master",
  coder: "Coder",
  artist: "Artist",
  storyteller: "Storyteller",
  architect: "Architect",
  scout: "Scout",
  advisor: "Advisor",
};

// Icons shown next to aliases in chat — maps to MUI icon display characters
export const DEVELOPER_TAG_ICONS: Record<string, string> = {
  master: "👑",
  coder: "💻",
  artist: "🎨",
  storyteller: "📖",
  architect: "🏗️",
  scout: "🔭",
  advisor: "🧠",
};
