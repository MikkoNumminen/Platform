export const LOCALSTORAGE_KEY = "platform_survey_submitted";

export const CONVERSATION_STYLES = [
  "Real-time threads (Slack/Discord style)",
  "Forum posts (Reddit style — searchable, organized)",
  "Both",
] as const;

export const FEATURE_OPTIONS = [
  "File sharing / resource library",
  "Polls & voting",
  "Direct messages / private chat",
  "Member profiles (bio, skills, links)",
  "Notifications (email/push)",
  "Wiki / knowledge base",
  "Subgroups / topic channels",
] as const;

export const DEVELOPMENT_SKILL_OPTIONS = [
  "Coding (frontend)",
  "Coding (backend)",
  "UI/UX design",
  "Graphic art / illustrations",
  "Testing / QA",
  "Writing / documentation",
  "Ideas / product feedback",
] as const;

export interface SurveyData {
  conversationStyle: string;
  features: string[];
  mustHave: string;
  dealbreaker: string;
  otherFeedback: string;
  developmentSkills: string[];
}

export interface ValidationErrors {
  conversationStyle?: string;
  features?: string;
  mustHave?: string;
  dealbreaker?: string;
  otherFeedback?: string;
}

export function validateSurveyData(data: SurveyData): {
  valid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  if (!data.conversationStyle) {
    errors.conversationStyle = "Please select a conversation style";
  } else if (
    !CONVERSATION_STYLES.includes(data.conversationStyle as (typeof CONVERSATION_STYLES)[number])
  ) {
    errors.conversationStyle = "Invalid selection";
  }

  if (!data.features || data.features.length === 0) {
    errors.features = "Please select at least one feature";
  } else if (
    data.features.some((f) => !FEATURE_OPTIONS.includes(f as (typeof FEATURE_OPTIONS)[number]))
  ) {
    errors.features = "Invalid feature selection";
  }

  if (!data.mustHave || data.mustHave.trim().length === 0) {
    errors.mustHave = "This field is required";
  } else if (data.mustHave.length > 200) {
    errors.mustHave = "Maximum 200 characters";
  }

  if (data.dealbreaker && data.dealbreaker.length > 200) {
    errors.dealbreaker = "Maximum 200 characters";
  }

  if (data.otherFeedback && data.otherFeedback.length > 500) {
    errors.otherFeedback = "Maximum 500 characters";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
