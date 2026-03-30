export interface CustomQuestion {
  id: string;
  text: string;
  type: "single" | "multi" | "text";
  options?: string[];
  required?: boolean;
}

export type CustomAnswers = Record<string, string | string[]>;

export function validateCustomAnswers(
  questions: CustomQuestion[],
  answers: CustomAnswers,
): string | null {
  for (const q of questions) {
    if (!q.required) continue;
    const answer = answers[q.id];
    if (q.type === "text") {
      if (!answer || (typeof answer === "string" && !answer.trim())) {
        return `"${q.text}" is required`;
      }
    } else if (q.type === "single") {
      if (!answer || (typeof answer === "string" && !answer)) {
        return `Please answer "${q.text}"`;
      }
    } else if (q.type === "multi") {
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        return `Please select at least one option for "${q.text}"`;
      }
    }
  }
  return null;
}

// ─── DM Testing Survey Questions ──────────────────────────────────────────

export const DM_TESTING_QUESTIONS: CustomQuestion[] = [
  {
    id: "dm_findability",
    text: "How easy was it to find the messaging feature?",
    type: "single",
    options: ["Very easy", "Easy", "Neutral", "Difficult", "Very difficult"],
    required: true,
  },
  {
    id: "dm_whisper",
    text: "Did you try the /w whisper command?",
    type: "single",
    options: [
      "Yes, liked it",
      "Yes, but it was confusing",
      "No, didn't try",
      "Didn't know about it",
    ],
    required: true,
  },
  {
    id: "dm_features_used",
    text: "Which messaging features did you use?",
    type: "multi",
    options: [
      "Sent a private message",
      "Started a new conversation",
      "Used the /w whisper command",
      "Read the bot help messages",
      "Received a message from someone",
    ],
    required: true,
  },
  {
    id: "dm_rating",
    text: "How would you rate the messaging experience overall?",
    type: "single",
    options: ["Excellent", "Good", "Average", "Poor", "Terrible"],
    required: true,
  },
  {
    id: "dm_wanted_features",
    text: "What messaging features would you like to see added?",
    type: "multi",
    options: [
      "Group chats",
      "Message reactions / emojis",
      "File / image sharing",
      "Read receipts",
      "Message editing",
      "Emoji picker",
      "Message search",
      "None — it's fine as is",
    ],
    required: false,
  },
  {
    id: "dm_bugs",
    text: "Did you encounter any bugs? (optional)",
    type: "text",
    required: false,
  },
];
