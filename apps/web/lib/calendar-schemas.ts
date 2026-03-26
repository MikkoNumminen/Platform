import { ActionError } from "./actionErrors";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_LOCATION_LENGTH = 200;

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  allDay: boolean;
}

export interface UpdateEventInput extends CreateEventInput {
  id: string;
}

export function validateEventInput(input: CreateEventInput): {
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
} {
  const title = input.title?.trim();
  if (!title) {
    throw new ActionError("invalidEventTitle", "Event title is required");
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new ActionError(
      "eventTitleTooLong",
      `Event title must be ${MAX_TITLE_LENGTH} characters or less`,
    );
  }

  const description = input.description?.trim() || null;
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    throw new ActionError(
      "invalidEventTitle",
      `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
    );
  }

  const location = input.location?.trim() || null;
  if (location && location.length > MAX_LOCATION_LENGTH) {
    throw new ActionError(
      "invalidEventTitle",
      `Location must be ${MAX_LOCATION_LENGTH} characters or less`,
    );
  }

  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  if (isNaN(startTime.getTime())) {
    throw new ActionError("invalidEventTitle", "Invalid start time");
  }
  if (isNaN(endTime.getTime())) {
    throw new ActionError("invalidEventTitle", "Invalid end time");
  }
  if (endTime < startTime) {
    throw new ActionError(
      "eventEndBeforeStart",
      "End time must be after start time",
    );
  }

  return {
    title,
    description,
    location,
    startTime,
    endTime,
    allDay: Boolean(input.allDay),
  };
}
